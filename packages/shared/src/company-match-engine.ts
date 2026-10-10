import {
  COMPANY_SCORING_DISCLAIMER,
  COMPANY_SCORING_FORMULA_VERSION,
  FORBIDDEN_DEMOGRAPHIC_KEYS,
  ALLOWED_MATCH_INPUT_KEYS,
  MATCH_COMPONENT_WEIGHTS,
} from './company-scoring-config';
import { CompanyMatchConfidence, RoleFamily } from './phase4-enums';

export interface StudentSkillInput {
  name: string;
  proficiency?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string;
}

export interface StudentTopicMasteryInput {
  slug: string;
  name?: string;
  mastery: number; // 0.0 to 1.0
}

export interface CompanyMatchInput {
  studentSkills: StudentSkillInput[];
  studentTopicMastery: StudentTopicMasteryInput[];
  readinessScore: number | null;
  companyRequiredSkills: string[];
  companyRequiredTopics: string[];
  roleFamily?: RoleFamily;
}

export interface CompanyMatchComponents {
  skillScore: number;
  topicScore: number;
  readinessComponent: number | null;
  matchedSkillCount: number;
  totalRequiredSkills: number;
  evaluatedTopicCount: number;
  totalRequiredTopics: number;
}

export interface CompanyMatchResult {
  matchScore: number | null;
  confidence: CompanyMatchConfidence;
  components: CompanyMatchComponents;
  formulaVersion: string;
  disclaimer: string;
}

const PROFICIENCY_WEIGHTS: Record<string, number> = {
  BEGINNER: 0.5,
  INTERMEDIATE: 0.8,
  ADVANCED: 1.0,
};

/**
 * Validates that scoring input contains ONLY approved domain fields and no forbidden identity traits.
 */
export function assertCleanMatchInput(rawInput: Record<string, unknown>): void {
  const keys = Object.keys(rawInput);

  for (const key of keys) {
    const normalizedKey = key.toLowerCase();
    if (FORBIDDEN_DEMOGRAPHIC_KEYS.includes(normalizedKey)) {
      throw new Error(
        `Scoring Integrity Violation: Demographic or proxy field '${key}' is prohibited from match evaluation.`,
      );
    }
    if (!ALLOWED_MATCH_INPUT_KEYS.includes(key as (typeof ALLOWED_MATCH_INPUT_KEYS)[number])) {
      throw new Error(
        `Scoring Integrity Violation: Unknown or unauthorized input key '${key}' encountered.`,
      );
    }
  }
}

/**
 * Pure, deterministic computation of student-to-company preparation match score.
 */
export function computeCompanyMatch(input: CompanyMatchInput): CompanyMatchResult {
  // 1. Whitelist validation
  assertCleanMatchInput(input as unknown as Record<string, unknown>);

  const {
    studentSkills,
    studentTopicMastery,
    readinessScore,
    companyRequiredSkills,
    companyRequiredTopics,
  } = input;

  // 2. Skill component
  let skillScore = 70; // baseline if no specific skills specified by employer
  let matchedSkillCount = 0;
  const totalRequiredSkills = companyRequiredSkills.length;

  if (totalRequiredSkills > 0) {
    let accumulatedSkillWeight = 0;
    const studentSkillMap = new Map<string, number>();

    for (const sk of studentSkills) {
      const normalized = sk.name.trim().toLowerCase();
      const profWeight = PROFICIENCY_WEIGHTS[sk.proficiency?.toUpperCase() ?? ''] ?? 0.7;
      studentSkillMap.set(normalized, profWeight);
    }

    for (const req of companyRequiredSkills) {
      const normalizedReq = req.trim().toLowerCase();
      if (studentSkillMap.has(normalizedReq)) {
        accumulatedSkillWeight += studentSkillMap.get(normalizedReq)!;
        matchedSkillCount++;
      }
    }

    skillScore = Math.min(100, Math.round((accumulatedSkillWeight / totalRequiredSkills) * 100));
  }

  // 3. Topic mastery component
  let topicScore = 70; // baseline if no specific topics required
  let evaluatedTopicCount = 0;
  const totalRequiredTopics = companyRequiredTopics.length;

  if (totalRequiredTopics > 0) {
    let accumulatedTopicMastery = 0;
    const topicMasteryMap = new Map<string, number>();

    for (const tm of studentTopicMastery) {
      topicMasteryMap.set(tm.slug.trim().toLowerCase(), tm.mastery);
      if (tm.name) {
        topicMasteryMap.set(tm.name.trim().toLowerCase(), tm.mastery);
      }
    }

    for (const reqTopic of companyRequiredTopics) {
      const normalizedTopic = reqTopic.trim().toLowerCase();
      if (topicMasteryMap.has(normalizedTopic)) {
        accumulatedTopicMastery += topicMasteryMap.get(normalizedTopic)!;
        evaluatedTopicCount++;
      }
    }

    if (evaluatedTopicCount > 0) {
      topicScore = Math.min(100, Math.round((accumulatedTopicMastery / totalRequiredTopics) * 100));
    } else {
      topicScore = 20; // required topics exist but student has zero practice in them
    }
  }

  // 4. Confidence determination
  let confidence: CompanyMatchConfidence = CompanyMatchConfidence.LOW;
  const totalEvidence = studentSkills.length + studentTopicMastery.length;

  if (totalEvidence >= 5 && readinessScore !== null) {
    confidence = CompanyMatchConfidence.HIGH;
  } else if (totalEvidence >= 1 || readinessScore !== null) {
    confidence = CompanyMatchConfidence.MEDIUM;
  }

  // If totally insufficient data, return null score
  if (
    confidence === CompanyMatchConfidence.LOW &&
    studentSkills.length === 0 &&
    studentTopicMastery.length === 0
  ) {
    return {
      matchScore: null,
      confidence: CompanyMatchConfidence.LOW,
      components: {
        skillScore: 0,
        topicScore: 0,
        readinessComponent: readinessScore,
        matchedSkillCount: 0,
        totalRequiredSkills,
        evaluatedTopicCount: 0,
        totalRequiredTopics,
      },
      formulaVersion: COMPANY_SCORING_FORMULA_VERSION,
      disclaimer: COMPANY_SCORING_DISCLAIMER,
    };
  }

  // 5. Weighted score calculation
  let finalMatchScore: number;

  if (readinessScore !== null) {
    finalMatchScore =
      skillScore * MATCH_COMPONENT_WEIGHTS.SKILLS +
      topicScore * MATCH_COMPONENT_WEIGHTS.TOPIC_MASTERY +
      readinessScore * MATCH_COMPONENT_WEIGHTS.READINESS;
  } else {
    // Re-normalize between skills and topic mastery (0.40 and 0.35 -> sum = 0.75)
    const normalizedSkillWeight = MATCH_COMPONENT_WEIGHTS.SKILLS / 0.75;
    const normalizedTopicWeight = MATCH_COMPONENT_WEIGHTS.TOPIC_MASTERY / 0.75;
    finalMatchScore = skillScore * normalizedSkillWeight + topicScore * normalizedTopicWeight;
  }

  finalMatchScore = Math.max(0, Math.min(100, Math.round(finalMatchScore * 10) / 10));

  return {
    matchScore: finalMatchScore,
    confidence,
    components: {
      skillScore,
      topicScore,
      readinessComponent: readinessScore,
      matchedSkillCount,
      totalRequiredSkills,
      evaluatedTopicCount,
      totalRequiredTopics,
    },
    formulaVersion: COMPANY_SCORING_FORMULA_VERSION,
    disclaimer: COMPANY_SCORING_DISCLAIMER,
  };
}
