export const COMPANY_SCORING_FORMULA_VERSION = '1.0.0';

export const COMPANY_SCORING_DISCLAIMER =
  'The CampusEdge Company Match Score and Priority Tier are indicative self-assessment tools designed solely to guide student preparation focus. They do NOT constitute a job offer, interview shortlisting guarantee, or prediction of recruiter evaluation. Selection criteria are determined exclusively and independently by prospective employers.';

export const MATCH_COMPONENT_WEIGHTS = {
  SKILLS: 0.4,
  TOPIC_MASTERY: 0.35,
  READINESS: 0.25,
} as const;

export const PRIORITY_COMPONENT_WEIGHTS = {
  TIMING: 0.35,
  MATCH_SCORE: 0.35,
  STUDENT_INTEREST: 0.15,
  READINESS_GAP: 0.15,
} as const;

export const CONFIDENCE_CRITERIA = {
  HIGH_MIN_SKILLS: 3,
  HIGH_MIN_TOPICS: 2,
  HIGH_REQUIRES_READINESS: true,
  MEDIUM_MIN_EVIDENCE: 1,
} as const;

/**
 * Strict deny-list of non-academic demographic, socioeconomic, or personal identity fields.
 * Any input payload containing any of these keys will be immediately rejected with an error.
 */
export const FORBIDDEN_DEMOGRAPHIC_KEYS: readonly string[] = [
  'gender',
  'sex',
  'caste',
  'reservation_category',
  'religion',
  'race',
  'ethnicity',
  'age',
  'dob',
  'date_of_birth',
  'family_income',
  'annual_income',
  'parent_occupation',
  'disability',
  'handicapped',
  'hometown',
  'native_place',
  'marital_status',
  'photo',
  'photo_url',
  'avatar',
  'blood_group',
] as const;

/**
 * Whitelist of permissible domain fields that may be processed for company match computation.
 */
export const ALLOWED_MATCH_INPUT_KEYS: readonly string[] = [
  'studentSkills',
  'studentTopicMastery',
  'readinessScore',
  'companyRequiredSkills',
  'companyRequiredTopics',
  'roleFamily',
] as const;

/**
 * Whitelist of permissible domain fields that may be processed for company priority computation.
 */
export const ALLOWED_PRIORITY_INPUT_KEYS: readonly string[] = [
  'isEligible',
  'ineligibilityReasons',
  'matchScore',
  'daysUntilDrive',
  'isFollowed',
  'hasApplication',
  'readinessScore',
] as const;
