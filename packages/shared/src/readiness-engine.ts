import { FORMULA_VERSION, READINESS_CONFIG, READINESS_DISCLAIMER } from './assessment-config';
import { ReadinessBand, ReadinessConfidence, TechnicalTrack } from './phase3-enums';

export interface TopicMasteryInput {
  topicId: string;
  name: string;
  mastery: number;
  scoredCount: number;
  importance?: number;
}

export interface MockAttemptInput {
  percent: number;
  submittedAt: Date | string;
}

export interface ComputeReadinessInput {
  track: TechnicalTrack;
  hasCompletedDiagnostic: boolean;
  aptitudeTopics: TopicMasteryInput[];
  technicalTopics: TopicMasteryInput[];
  recentMockAttempts: MockAttemptInput[];
  activeDaysInLast14Days: number;
  totalScoredItems: number;
}

export interface ReadinessComponentDetail {
  name: string;
  value: number | null;
  weight: number;
  available: boolean;
  explanation: string;
}

export interface ReadinessEvaluationResult {
  isAvailable: boolean;
  score: number | null;
  band: ReadinessBand | null;
  bandLabel: string | null;
  confidence: ReadinessConfidence;
  disclaimer: string;
  formulaVersion: string;
  components: {
    aptitude: ReadinessComponentDetail;
    technical: ReadinessComponentDetail;
    mockPerformance: ReadinessComponentDetail;
    consistency: ReadinessComponentDetail;
    coding: ReadinessComponentDetail;
    interview: ReadinessComponentDetail;
  };
}

/**
 * Deterministically computes the Placement Readiness Score, component breakdown,
 * confidence tier, and readiness band.
 */
export function computeReadiness(input: ComputeReadinessInput): ReadinessEvaluationResult {
  const {
    track,
    hasCompletedDiagnostic,
    aptitudeTopics,
    technicalTopics,
    recentMockAttempts,
    activeDaysInLast14Days,
    totalScoredItems,
  } = input;

  const weights =
    track === TechnicalTrack.SOFTWARE
      ? READINESS_CONFIG.WEIGHTS.SOFTWARE
      : READINESS_CONFIG.WEIGHTS.OTHER;

  // 1. Aptitude Component
  const totalAptitudeItems = aptitudeTopics.reduce((sum, t) => sum + (t.scoredCount || 0), 0);
  const isAptitudeAvailable =
    totalAptitudeItems >= READINESS_CONFIG.AVAILABILITY.APTITUDE_MIN_ITEMS;

  let aptitudeValue: number | null = null;
  let aptitudeExplanation = `Requires at least ${READINESS_CONFIG.AVAILABILITY.APTITUDE_MIN_ITEMS} scored aptitude practice questions (${totalAptitudeItems} answered so far).`;

  if (isAptitudeAvailable && aptitudeTopics.length > 0) {
    let sumWeight = 0;
    let sumWeightedVal = 0;
    for (const t of aptitudeTopics) {
      const imp = Number.isNaN(t.importance) || t.importance === undefined ? 1.0 : t.importance;
      const mastery = Number.isNaN(t.mastery) ? 0.5 : Math.max(0, Math.min(1, t.mastery));
      sumWeight += imp;
      sumWeightedVal += mastery * 100 * imp;
    }
    aptitudeValue = sumWeight > 0 ? Math.round((sumWeightedVal / sumWeight) * 100) / 100 : 50;
    aptitudeExplanation = `Average aptitude mastery across ${aptitudeTopics.length} topics (${totalAptitudeItems} scored questions).`;
  }

  // 2. Technical Component
  const isTechTrack = track === TechnicalTrack.SOFTWARE;
  const totalTechItems = technicalTopics.reduce((sum, t) => sum + (t.scoredCount || 0), 0);
  const isTechAvailable =
    isTechTrack && totalTechItems >= READINESS_CONFIG.AVAILABILITY.TECHNICAL_MIN_ITEMS;

  let techValue: number | null = null;
  let techExplanation = isTechTrack
    ? `Requires at least ${READINESS_CONFIG.AVAILABILITY.TECHNICAL_MIN_ITEMS} scored technical questions (${totalTechItems} answered so far).`
    : 'Not applicable for non-software track.';

  if (isTechAvailable && technicalTopics.length > 0) {
    let sumWeight = 0;
    let sumWeightedVal = 0;
    for (const t of technicalTopics) {
      const imp = Number.isNaN(t.importance) || t.importance === undefined ? 1.0 : t.importance;
      const mastery = Number.isNaN(t.mastery) ? 0.5 : Math.max(0, Math.min(1, t.mastery));
      sumWeight += imp;
      sumWeightedVal += mastery * 100 * imp;
    }
    techValue = sumWeight > 0 ? Math.round((sumWeightedVal / sumWeight) * 100) / 100 : 50;
    techExplanation = `Core computer science topic mastery across ${technicalTopics.length} topics (${totalTechItems} scored questions).`;
  }

  // 3. Mock Performance Component
  const sortedMocks = [...recentMockAttempts]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, READINESS_CONFIG.AVAILABILITY.MOCK_CONSIDERED_COUNT);

  const isMockAvailable = sortedMocks.length >= READINESS_CONFIG.AVAILABILITY.MOCK_MIN_ATTEMPTS;
  let mockValue: number | null = null;
  let mockExplanation = 'Requires at least 1 completed full mock or college test attempt.';

  if (isMockAvailable) {
    const validMocks = sortedMocks.map((m) =>
      Number.isNaN(m.percent) ? 0 : Math.max(0, Math.min(100, m.percent)),
    );
    const mean = validMocks.reduce((sum, p) => sum + p, 0) / validMocks.length;
    mockValue = Math.round(mean * 100) / 100;
    mockExplanation = `Average score of ${mockValue}% across the last ${sortedMocks.length} mock/college test attempt(s).`;
  }

  // 4. Consistency Component
  const clampedActiveDays = Math.max(0, Math.min(14, activeDaysInLast14Days));
  const consistencyRatio = Math.min(
    1.0,
    clampedActiveDays / READINESS_CONFIG.AVAILABILITY.CONSISTENCY_TARGET_DAYS,
  );
  const consistencyValue = Math.round(consistencyRatio * 10000) / 100;
  const consistencyExplanation = `Active on ${clampedActiveDays} of the last 14 days (benchmark: 10 active days for optimal retention).`;

  // 5. Confidence Assessment
  let confidence: ReadinessConfidence;
  if (totalScoredItems <= READINESS_CONFIG.CONFIDENCE_THRESHOLDS.LOW_MAX) {
    confidence = ReadinessConfidence.LOW;
  } else if (totalScoredItems <= READINESS_CONFIG.CONFIDENCE_THRESHOLDS.MEDIUM_MAX) {
    confidence = ReadinessConfidence.MEDIUM;
  } else {
    confidence = ReadinessConfidence.HIGH;
  }

  // Components Dictionary
  const components = {
    aptitude: {
      name: 'Aptitude Mastery',
      value: aptitudeValue,
      weight: weights.APTITUDE,
      available: isAptitudeAvailable,
      explanation: aptitudeExplanation,
    },
    technical: {
      name: 'Technical Mastery',
      value: techValue,
      weight: weights.TECHNICAL,
      available: isTechAvailable,
      explanation: techExplanation,
    },
    mockPerformance: {
      name: 'Mock Test Performance',
      value: mockValue,
      weight: weights.MOCK,
      available: isMockAvailable,
      explanation: mockExplanation,
    },
    consistency: {
      name: 'Practice Consistency',
      value: consistencyValue,
      weight: weights.CONSISTENCY,
      available: hasCompletedDiagnostic,
      explanation: consistencyExplanation,
    },
    coding: {
      name: 'Coding Evaluation',
      value: null,
      weight: 0.0,
      available: false,
      explanation: 'Coding practice module scheduled for Phase 5.',
    },
    interview: {
      name: 'Interview Simulation',
      value: null,
      weight: 0.0,
      available: false,
      explanation: 'AI interview simulator scheduled for Phase 6.',
    },
  };

  // Diagnostic Guard: If diagnostic is not completed, readiness score is not generated
  if (!hasCompletedDiagnostic) {
    return {
      isAvailable: false,
      score: null,
      band: null,
      bandLabel: null,
      confidence: ReadinessConfidence.LOW,
      disclaimer: READINESS_DISCLAIMER,
      formulaVersion: FORMULA_VERSION,
      components,
    };
  }

  // Compute weighted score over available components
  let totalAvailableWeight = 0;
  let sumWeightedScore = 0;

  const activeComponents: ReadinessComponentDetail[] = [
    components.aptitude,
    components.technical,
    components.mockPerformance,
    components.consistency,
  ];

  for (const c of activeComponents) {
    if (c.available && c.value !== null && c.weight > 0) {
      totalAvailableWeight += c.weight;
      sumWeightedScore += c.weight * c.value;
    }
  }

  if (totalAvailableWeight === 0) {
    return {
      isAvailable: false,
      score: null,
      band: null,
      bandLabel: null,
      confidence,
      disclaimer: READINESS_DISCLAIMER,
      formulaVersion: FORMULA_VERSION,
      components,
    };
  }

  const normalizedScore = Math.round((sumWeightedScore / totalAvailableWeight) * 100) / 100;
  const finalScore = Math.max(0, Math.min(100, normalizedScore));

  let band: ReadinessBand;
  let bandLabel: string;

  if (finalScore < READINESS_CONFIG.BANDS.GETTING_STARTED_MAX) {
    band = ReadinessBand.GETTING_STARTED;
    bandLabel = READINESS_CONFIG.BAND_LABELS.GETTING_STARTED;
  } else if (finalScore < READINESS_CONFIG.BANDS.BUILDING_MAX) {
    band = ReadinessBand.BUILDING;
    bandLabel = READINESS_CONFIG.BAND_LABELS.BUILDING;
  } else if (finalScore < READINESS_CONFIG.BANDS.COMPETITIVE_MAX) {
    band = ReadinessBand.COMPETITIVE;
    bandLabel = READINESS_CONFIG.BAND_LABELS.COMPETITIVE;
  } else {
    band = ReadinessBand.STRONG;
    bandLabel = READINESS_CONFIG.BAND_LABELS.STRONG;
  }

  return {
    isAvailable: true,
    score: finalScore,
    band,
    bandLabel,
    confidence,
    disclaimer: READINESS_DISCLAIMER,
    formulaVersion: FORMULA_VERSION,
    components,
  };
}
