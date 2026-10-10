import {
  COMPANY_SCORING_DISCLAIMER,
  COMPANY_SCORING_FORMULA_VERSION,
  FORBIDDEN_DEMOGRAPHIC_KEYS,
  ALLOWED_PRIORITY_INPUT_KEYS,
  PRIORITY_COMPONENT_WEIGHTS,
} from './company-scoring-config';
import { CompanyPriorityTier } from './phase4-enums';

export interface CompanyPriorityInput {
  isEligible: boolean;
  ineligibilityReasons?: string[];
  matchScore: number | null;
  daysUntilDrive: number | null;
  isFollowed: boolean;
  hasApplication: boolean;
  readinessScore?: number | null;
}

export interface CompanyPriorityComponents {
  timingScore: number;
  matchComponent: number;
  interestScore: number;
  gapComponent: number;
  isEligible: boolean;
  ineligibilityReasons: string[];
}

export interface CompanyPriorityResult {
  tier: CompanyPriorityTier;
  priorityScore: number;
  components: CompanyPriorityComponents;
  formulaVersion: string;
  disclaimer: string;
}

/**
 * Validates that priority scoring input contains ONLY approved domain fields and no forbidden identity traits.
 */
export function assertCleanPriorityInput(rawInput: Record<string, unknown>): void {
  const keys = Object.keys(rawInput);

  for (const key of keys) {
    const normalizedKey = key.toLowerCase();
    if (FORBIDDEN_DEMOGRAPHIC_KEYS.includes(normalizedKey)) {
      throw new Error(
        `Scoring Integrity Violation: Demographic or proxy field '${key}' is prohibited from priority evaluation.`,
      );
    }
    if (
      !ALLOWED_PRIORITY_INPUT_KEYS.includes(key as (typeof ALLOWED_PRIORITY_INPUT_KEYS)[number])
    ) {
      throw new Error(
        `Scoring Integrity Violation: Unknown or unauthorized input key '${key}' encountered in priority evaluation.`,
      );
    }
  }
}

/**
 * Pure, deterministic computation of preparation priority tier for a company.
 */
export function computeCompanyPriority(input: CompanyPriorityInput): CompanyPriorityResult {
  // 1. Whitelist validation
  assertCleanPriorityInput(input as unknown as Record<string, unknown>);

  const {
    isEligible,
    ineligibilityReasons = [],
    matchScore,
    daysUntilDrive,
    isFollowed,
    hasApplication,
  } = input;

  // 2. Strict eligibility gate
  if (!isEligible) {
    return {
      tier: CompanyPriorityTier.NOT_ELIGIBLE,
      priorityScore: 0,
      components: {
        timingScore: 0,
        matchComponent: 0,
        interestScore: 0,
        gapComponent: 0,
        isEligible: false,
        ineligibilityReasons,
      },
      formulaVersion: COMPANY_SCORING_FORMULA_VERSION,
      disclaimer: COMPANY_SCORING_DISCLAIMER,
    };
  }

  // 3. Timing score
  let timingScore = 30; // default when drive date is unannounced
  if (daysUntilDrive !== null) {
    if (daysUntilDrive <= 7) {
      timingScore = 100;
    } else if (daysUntilDrive <= 14) {
      timingScore = 85;
    } else if (daysUntilDrive <= 30) {
      timingScore = 65;
    } else {
      timingScore = 40;
    }
  }

  // 4. Match component
  const matchComponent = matchScore ?? 50;

  // 5. Interest component
  let interestScore = 30;
  if (hasApplication) {
    interestScore = 100;
  } else if (isFollowed) {
    interestScore = 80;
  }

  // 6. Readiness gap component (incentivizes closing prep headroom before drive)
  const gapComponent = Math.max(0, 100 - matchComponent);

  // 7. Composite priority score
  const rawScore =
    timingScore * PRIORITY_COMPONENT_WEIGHTS.TIMING +
    matchComponent * PRIORITY_COMPONENT_WEIGHTS.MATCH_SCORE +
    interestScore * PRIORITY_COMPONENT_WEIGHTS.STUDENT_INTEREST +
    gapComponent * PRIORITY_COMPONENT_WEIGHTS.READINESS_GAP;

  const priorityScore = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  // 8. Tier assignment
  let tier: CompanyPriorityTier;
  if (daysUntilDrive !== null && daysUntilDrive <= 14) {
    tier = CompanyPriorityTier.PREPARE_NOW;
  } else if (priorityScore >= 70) {
    tier = CompanyPriorityTier.PREPARE_NOW;
  } else if ((daysUntilDrive !== null && daysUntilDrive <= 30) || priorityScore >= 45) {
    tier = CompanyPriorityTier.PREPARE_NEXT;
  } else {
    tier = CompanyPriorityTier.ON_RADAR;
  }

  return {
    tier,
    priorityScore,
    components: {
      timingScore,
      matchComponent,
      interestScore,
      gapComponent,
      isEligible: true,
      ineligibilityReasons: [],
    },
    formulaVersion: COMPANY_SCORING_FORMULA_VERSION,
    disclaimer: COMPANY_SCORING_DISCLAIMER,
  };
}
