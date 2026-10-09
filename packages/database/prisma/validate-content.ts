import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { QuestionSeed } from '../seed-content/builders/quant';

const VALID_TOPIC_SLUGS = new Set([
  'aptitude',
  'logical',
  'verbal',
  'dsa',
  'sql-dbms',
  'os-concurrency',
  'networks',
  'oop',
  'programming',
]);

function computeStemHash(stem: string): string {
  const normalized = stem.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function validateQuestionBank(questions: QuestionSeed[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seenHashes = new Map<string, number>();

  if (questions.length < 300) {
    errors.push(`Question bank must contain at least 300 questions. Found: ${questions.length}`);
  }

  questions.forEach((q, idx) => {
    const qNum = idx + 1;

    // Topic check
    if (!q.topicSlug || !VALID_TOPIC_SLUGS.has(q.topicSlug)) {
      errors.push(
        `Q#${qNum}: Invalid topicSlug "${q.topicSlug}". Must be one of: ${Array.from(VALID_TOPIC_SLUGS).join(', ')}`,
      );
    }

    // Stem check
    if (!q.stem || q.stem.trim().length < 10) {
      errors.push(`Q#${qNum}: Question stem must be at least 10 characters long.`);
    }

    // Duplicate stem / text_hash check
    if (q.stem) {
      const hash = computeStemHash(q.stem);
      if (seenHashes.has(hash)) {
        errors.push(
          `Q#${qNum}: Duplicate question stem detected! Matches Q#${seenHashes.get(hash)}.`,
        );
      } else {
        seenHashes.set(hash, qNum);
      }
    }

    // Difficulty check
    if (!q.difficulty || q.difficulty < 1 || q.difficulty > 5) {
      errors.push(`Q#${qNum}: Difficulty must be between 1 and 5. Found: ${q.difficulty}`);
    }

    // Expected time check
    if (!q.expectedTimeSeconds || q.expectedTimeSeconds < 10 || q.expectedTimeSeconds > 600) {
      errors.push(
        `Q#${qNum}: expectedTimeSeconds must be between 10 and 600. Found: ${q.expectedTimeSeconds}`,
      );
    }

    // Explanation check
    if (!q.explanation || q.explanation.trim().length < 10) {
      errors.push(`Q#${qNum}: Explanation must be non-empty and at least 10 characters.`);
    }

    // Type and option/numeric check
    if (q.type === 'MCQ_SINGLE') {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Q#${qNum}: MCQ_SINGLE requires at least 2 options.`);
      } else {
        const correctCount = q.options.filter((o) => o.isCorrect).length;
        if (correctCount !== 1) {
          errors.push(
            `Q#${qNum}: MCQ_SINGLE must have exactly 1 correct option. Found: ${correctCount}`,
          );
        }
        const optionKeys = new Set<string>();
        for (const opt of q.options) {
          if (!opt.key || !opt.text || opt.text.trim().length === 0) {
            errors.push(`Q#${qNum}: Option key and text must not be empty.`);
          }
          if (optionKeys.has(opt.key)) {
            errors.push(`Q#${qNum}: Duplicate option key "${opt.key}".`);
          }
          optionKeys.add(opt.key);
        }
      }
    } else if (q.type === 'MCQ_MULTI') {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Q#${qNum}: MCQ_MULTI requires at least 2 options.`);
      } else {
        const correctCount = q.options.filter((o) => o.isCorrect).length;
        if (correctCount < 1) {
          errors.push(`Q#${qNum}: MCQ_MULTI must have at least 1 correct option.`);
        }
      }
    } else if (q.type === 'NUMERIC') {
      if (typeof q.numericAnswer !== 'number' || !Number.isFinite(q.numericAnswer)) {
        errors.push(`Q#${qNum}: NUMERIC question must specify a valid finite numericAnswer.`);
      }
    } else {
      errors.push(`Q#${qNum}: Unknown question type "${q.type}".`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function runValidation() {
  const jsonPath = path.resolve(__dirname, '../seed-content/starter-questions.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(
      `[ContentValidation] File not found: ${jsonPath}. Run 'seed-content/generate.ts' first.`,
    );
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as QuestionSeed[];
  console.info(
    `[ContentValidation] Loaded ${data.length} starter questions. Running validation...`,
  );

  const result = validateQuestionBank(data);
  if (!result.valid) {
    console.error(`[ContentValidation] FAILED with ${result.errors.length} validation errors:`);
    result.errors.slice(0, 20).forEach((err) => console.error(` - ${err}`));
    if (result.errors.length > 20) {
      console.error(` ... and ${result.errors.length - 20} more errors.`);
    }
    process.exit(1);
  }

  // Summary counts
  const byTopic: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byDiff: Record<number, number> = {};
  for (const q of data) {
    byTopic[q.topicSlug] = (byTopic[q.topicSlug] || 0) + 1;
    byType[q.type] = (byType[q.type] || 0) + 1;
    byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1;
  }

  console.info('[ContentValidation] PASSED! All questions are valid and compliant.');
  console.info(`Total Questions: ${data.length}`);
  console.info('Distribution by Topic:', byTopic);
  console.info('Distribution by Type:', byType);
  console.info('Distribution by Difficulty:', byDiff);
}

if (require.main === module) {
  runValidation();
}
