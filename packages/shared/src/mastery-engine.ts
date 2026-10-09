import { DIFFICULTY_WEIGHTS, MASTERY_CONFIG } from './assessment-config';
import { TopicMasteryLevel } from './phase3-enums';

export interface ScoredItemForMastery {
  difficulty: number;
  isCorrect: boolean;
  answeredAt: Date | string;
}

export interface TopicMasteryResult {
  scoredCount: number;
  mastery: number;
  level: TopicMasteryLevel;
}

/**
 * Deterministically computes topic mastery using exponential recency decay,
 * difficulty weighting, and Bayesian prior smoothing.
 */
export function computeMastery(
  items: ScoredItemForMastery[],
  referenceDate: Date = new Date(),
): TopicMasteryResult {
  if (!items || items.length === 0) {
    return {
      scoredCount: 0,
      mastery: 0.5,
      level: TopicMasteryLevel.INSUFFICIENT_DATA,
    };
  }

  // Sort descending by answeredAt and take up to the configured window
  const sorted = [...items]
    .sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime())
    .slice(0, MASTERY_CONFIG.MAX_SCORED_ITEMS_WINDOW);

  const scoredCount = sorted.length;
  const nowMs = referenceDate.getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  let sumWeightedCorrect = 0;
  let sumWeights = 0;

  for (const item of sorted) {
    const diff = Math.min(5, Math.max(1, Math.round(item.difficulty || 3)));
    const diffWeight = DIFFICULTY_WEIGHTS[diff] ?? 1.0;

    const itemTimeMs = new Date(item.answeredAt).getTime();
    const validTime = Number.isNaN(itemTimeMs) ? nowMs : itemTimeMs;
    const ageDays = Math.max(0, (nowMs - validTime) / MS_PER_DAY);
    const recencyWeight = Math.pow(0.5, ageDays / MASTERY_CONFIG.RECENCY_HALF_LIFE_DAYS);

    const weight = diffWeight * recencyWeight;
    sumWeights += weight;

    if (item.isCorrect) {
      sumWeightedCorrect += weight;
    }
  }

  const K = MASTERY_CONFIG.BAYESIAN_PRIOR_WEIGHT_K;
  const rawMastery = (sumWeightedCorrect + K * 0.5) / (sumWeights + K);
  const mastery = Math.round(rawMastery * 10000) / 10000;

  let level: TopicMasteryLevel;
  if (scoredCount < MASTERY_CONFIG.MIN_SCORED_ITEMS_FOR_LEVEL) {
    level = TopicMasteryLevel.INSUFFICIENT_DATA;
  } else if (mastery >= MASTERY_CONFIG.STRONG_THRESHOLD) {
    level = TopicMasteryLevel.STRONG;
  } else if (mastery >= MASTERY_CONFIG.MODERATE_THRESHOLD) {
    level = TopicMasteryLevel.MODERATE;
  } else {
    level = TopicMasteryLevel.WEAK;
  }

  return {
    scoredCount,
    mastery,
    level,
  };
}
