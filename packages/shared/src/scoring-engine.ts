import { QuestionType } from './phase3-enums';

export interface ScoreItemInput {
  type: QuestionType;
  selectedOptionIds?: string[];
  numericResponse?: number | null;
  correctOptionIds: string[];
  numericAnswer?: number | null;
  numericTolerance?: number | null;
  marksPerQuestion: number;
  negativeMarks: number;
}

export interface ScoreItemResult {
  isCorrect: boolean;
  marksAwarded: number;
  isSkipped: boolean;
}

export interface AttemptSectionDefinition {
  sequence: number;
  title: string;
  marksPerQuestion: number;
  negativeMarks: number;
  questionCount: number;
}

export interface AttemptItemForScoring {
  sectionSeq: number;
  position: number;
  isCorrect?: boolean;
  marksAwarded?: number;
  isSkipped?: boolean;
}

export interface SectionScoreSummary {
  sequence: number;
  title: string;
  score: number;
  totalMarks: number;
  percent: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
}

export interface ScoreAttemptResult {
  score: number;
  totalMarks: number;
  percent: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  sectionScores: Record<number, SectionScoreSummary>;
}

/**
 * Deterministically scores a single question response.
 */
export function scoreItem(input: ScoreItemInput): ScoreItemResult {
  const {
    type,
    selectedOptionIds,
    numericResponse,
    correctOptionIds,
    numericAnswer,
    numericTolerance,
    marksPerQuestion,
    negativeMarks,
  } = input;

  const penalty = Math.abs(negativeMarks);

  // 1. Check for skipped state
  let isSkipped = false;
  if (type === QuestionType.NUMERIC) {
    isSkipped =
      numericResponse === null || numericResponse === undefined || Number.isNaN(numericResponse);
  } else {
    isSkipped = !selectedOptionIds || selectedOptionIds.length === 0;
  }

  if (isSkipped) {
    return {
      isCorrect: false,
      marksAwarded: 0,
      isSkipped: true,
    };
  }

  // 2. Evaluate correctness by question type
  let isCorrect = false;

  switch (type) {
    case QuestionType.MCQ_SINGLE: {
      const selected = selectedOptionIds ?? [];
      isCorrect =
        selected.length === 1 &&
        correctOptionIds.length >= 1 &&
        selected[0] === correctOptionIds[0];
      break;
    }

    case QuestionType.MCQ_MULTI: {
      // Strict all-or-nothing: zero partial credit
      const selectedSet = new Set(selectedOptionIds ?? []);
      const correctSet = new Set(correctOptionIds);
      isCorrect =
        selectedSet.size === correctSet.size && [...selectedSet].every((id) => correctSet.has(id));
      break;
    }

    case QuestionType.NUMERIC: {
      if (
        numericResponse !== null &&
        numericResponse !== undefined &&
        numericAnswer !== null &&
        numericAnswer !== undefined
      ) {
        const tol = Math.abs(numericTolerance ?? 0);
        isCorrect = Math.abs(numericResponse - numericAnswer) <= tol;
      }
      break;
    }
  }

  // 3. Compute marks with negative marking for incorrect attempts
  const rawMarks = isCorrect ? marksPerQuestion : -penalty;
  const marksAwarded = Math.round(rawMarks * 100) / 100;

  return {
    isCorrect,
    marksAwarded,
    isSkipped: false,
  };
}

/**
 * Deterministically scores a full assessment attempt and aggregates section breakdowns.
 */
export function scoreAttempt(
  scoredItems: AttemptItemForScoring[],
  sections: AttemptSectionDefinition[],
): ScoreAttemptResult {
  const sectionMap = new Map<number, AttemptSectionDefinition>();
  for (const s of sections) {
    sectionMap.set(s.sequence, s);
  }

  const sectionSummaries: Record<number, SectionScoreSummary> = {};

  for (const s of sections) {
    sectionSummaries[s.sequence] = {
      sequence: s.sequence,
      title: s.title,
      score: 0,
      totalMarks: Math.round(s.questionCount * s.marksPerQuestion * 100) / 100,
      percent: 0,
      correctCount: 0,
      incorrectCount: 0,
      skippedCount: 0,
    };
  }

  let totalScore = 0;
  let overallCorrect = 0;
  let overallIncorrect = 0;
  let overallSkipped = 0;

  for (const item of scoredItems) {
    const summary = sectionSummaries[item.sectionSeq];
    const marks = item.marksAwarded ?? 0;

    totalScore += marks;

    if (summary) {
      summary.score = Math.round((summary.score + marks) * 100) / 100;
      if (item.isSkipped) {
        summary.skippedCount++;
        overallSkipped++;
      } else if (item.isCorrect) {
        summary.correctCount++;
        overallCorrect++;
      } else {
        summary.incorrectCount++;
        overallIncorrect++;
      }
    } else {
      if (item.isSkipped) overallSkipped++;
      else if (item.isCorrect) overallCorrect++;
      else overallIncorrect++;
    }
  }

  let totalPossibleMarks = 0;
  for (const s of sections) {
    const summary = sectionSummaries[s.sequence];
    if (summary) {
      totalPossibleMarks += summary.totalMarks;
      if (summary.totalMarks > 0) {
        const clampedScore = Math.max(0, summary.score);
        summary.percent = Math.round((clampedScore / summary.totalMarks) * 10000) / 100;
      }
    }
  }

  totalPossibleMarks = Math.round(totalPossibleMarks * 100) / 100;
  totalScore = Math.round(totalScore * 100) / 100;

  const clampedOverallScore = Math.max(0, totalScore);
  const overallPercent =
    totalPossibleMarks > 0
      ? Math.round((clampedOverallScore / totalPossibleMarks) * 10000) / 100
      : 0;

  return {
    score: totalScore,
    totalMarks: totalPossibleMarks,
    percent: Math.min(100, overallPercent),
    correctCount: overallCorrect,
    incorrectCount: overallIncorrect,
    skippedCount: overallSkipped,
    sectionScores: sectionSummaries,
  };
}
