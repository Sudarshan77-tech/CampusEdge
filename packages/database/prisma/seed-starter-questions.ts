import {
  PrismaClient,
  TopicCategory,
  ContentScope,
  QuestionStatus,
  QuestionSource,
  QuestionType,
} from '@prisma/client';
import * as crypto from 'crypto';
import { getAllStarterQuestions } from '../seed-content/generate';

const prisma = new PrismaClient();

function computeStemHash(stem: string): string {
  const normalized = stem.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

const TOPICS_METADATA = [
  {
    name: 'Quantitative Aptitude',
    slug: 'aptitude',
    category: TopicCategory.APTITUDE,
    sortOrder: 1,
  },
  { name: 'Logical Reasoning', slug: 'logical', category: TopicCategory.LOGICAL, sortOrder: 2 },
  { name: 'Verbal Ability', slug: 'verbal', category: TopicCategory.VERBAL, sortOrder: 3 },
  { name: 'Data Structures & Algorithms', slug: 'dsa', category: TopicCategory.DSA, sortOrder: 4 },
  {
    name: 'Relational Databases & SQL',
    slug: 'sql-dbms',
    category: TopicCategory.SQL,
    sortOrder: 5,
  },
  {
    name: 'Operating Systems & Concurrency',
    slug: 'os-concurrency',
    category: TopicCategory.OS,
    sortOrder: 6,
  },
  { name: 'Computer Networks', slug: 'networks', category: TopicCategory.NETWORKS, sortOrder: 7 },
  { name: 'Object-Oriented Programming', slug: 'oop', category: TopicCategory.OOP, sortOrder: 8 },
  {
    name: 'Programming Constructs & Fundamentals',
    slug: 'programming',
    category: TopicCategory.PROGRAMMING,
    sortOrder: 9,
  },
];

export async function seedStarterQuestions() {
  console.info('[StarterQuestionsSeed] Starting starter question bank seeding...');

  // 1. Ensure topics taxonomy exists
  const topicMap: Record<string, string> = {};
  for (const t of TOPICS_METADATA) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { name: t.name, category: t.category, sortOrder: t.sortOrder },
      create: { name: t.name, slug: t.slug, category: t.category, sortOrder: t.sortOrder },
    });
    topicMap[t.slug] = topic.id;
  }
  console.info(
    `[StarterQuestionsSeed] Ensured ${Object.keys(topicMap).length} topic categories in database.`,
  );

  // 2. Load questions
  const questions = getAllStarterQuestions();
  console.info(`[StarterQuestionsSeed] Preparing to seed ${questions.length} questions...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const q of questions) {
    const textHash = computeStemHash(q.stem);
    const topicId = topicMap[q.topicSlug];
    if (!topicId) {
      throw new Error(`Missing topic ID for slug: ${q.topicSlug}`);
    }

    // Check if question exists by textHash
    const existing = await prisma.question.findFirst({
      where: { textHash },
      include: { currentVersion: { include: { options: true } } },
    });

    if (!existing) {
      // Create atomically with transaction
      await prisma.$transaction(async (tx) => {
        // Create Question
        const newQuestion = await tx.question.create({
          data: {
            scope: ContentScope.GLOBAL,
            collegeId: null,
            topicId,
            type: q.type as QuestionType,
            difficulty: q.difficulty,
            status: QuestionStatus.APPROVED,
            source: QuestionSource.AUTHORED,
            textHash,
            needsHumanReview: false,
            expectedTimeSeconds: q.expectedTimeSeconds,
            tags: q.tags || [],
          },
        });

        // Create Version 1
        const version = await tx.questionVersion.create({
          data: {
            questionId: newQuestion.id,
            version: 1,
            stem: q.stem,
            explanation: q.explanation,
            numericAnswer: q.numericAnswer ?? null,
            numericTolerance: q.numericTolerance ?? 0,
          },
        });

        // Set currentVersionId
        await tx.question.update({
          where: { id: newQuestion.id },
          data: { currentVersionId: version.id },
        });

        // Create Options if MCQ
        if (q.options && q.options.length > 0) {
          await tx.questionOption.createMany({
            data: q.options.map((opt, oIdx) => ({
              versionId: version.id,
              key: opt.key,
              text: opt.text,
              isCorrect: opt.isCorrect,
              sort: oIdx,
            })),
          });
        }

        // Initialize Stats
        await tx.questionStat.create({
          data: {
            questionId: newQuestion.id,
            attemptCount: 0,
            correctCount: 0,
            avgTimeMs: 0,
            reportCount: 0,
          },
        });
      });
      createdCount++;
    } else {
      // Already exists - update metadata to keep in sync
      await prisma.question.update({
        where: { id: existing.id },
        data: {
          topicId,
          difficulty: q.difficulty,
          expectedTimeSeconds: q.expectedTimeSeconds,
          tags: q.tags || [],
          scope: ContentScope.GLOBAL,
          status: QuestionStatus.APPROVED,
          needsHumanReview: false,
        },
      });
      updatedCount++;
    }
  }

  console.info(
    `[StarterQuestionsSeed] Seeding finished. Created: ${createdCount}, Updated/Verified: ${updatedCount}, Total: ${questions.length}.`,
  );
}

if (require.main === module) {
  seedStarterQuestions()
    .catch((err) => {
      console.error('[StarterQuestionsSeed] Error during seeding:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
