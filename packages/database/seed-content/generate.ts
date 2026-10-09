import * as fs from 'fs';
import * as path from 'path';
import { quantQuestions } from './builders/quant';
import { logicalQuestions } from './builders/logical';
import { verbalQuestions } from './builders/verbal';
import { dsaQuestions } from './builders/dsa';
import { dbmsQuestions } from './builders/dbms';
import { osQuestions } from './builders/os';
import { networkQuestions } from './builders/networks';
import { oopQuestions } from './builders/oop';
import { programmingQuestions } from './builders/programming';
import { QuestionSeed } from './builders/quant';

export function getAllStarterQuestions(): QuestionSeed[] {
  const allQuestions: QuestionSeed[] = [
    ...quantQuestions,
    ...logicalQuestions,
    ...verbalQuestions,
    ...dsaQuestions,
    ...dbmsQuestions,
    ...osQuestions,
    ...networkQuestions,
    ...oopQuestions,
    ...programmingQuestions,
  ];
  return allQuestions;
}

export function generateStarterContentJson() {
  const allQuestions = getAllStarterQuestions();
  console.info(
    `[GenerateContent] Aggregating questions across all categories: Total = ${allQuestions.length}`,
  );

  const outDir = path.resolve(__dirname);
  const outPath = path.join(outDir, 'starter-questions.json');

  fs.writeFileSync(outPath, JSON.stringify(allQuestions, null, 2), 'utf-8');
  console.info(
    `[GenerateContent] Successfully exported ${allQuestions.length} questions to ${outPath}`,
  );

  // Summary by topic
  const counts: Record<string, number> = {};
  for (const q of allQuestions) {
    counts[q.topicSlug] = (counts[q.topicSlug] || 0) + 1;
  }
  console.info('[GenerateContent] Topic breakdown:', counts);
  return allQuestions;
}

if (require.main === module) {
  generateStarterContentJson();
}
