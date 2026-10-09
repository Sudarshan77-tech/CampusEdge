/**
 * CampusEdge Assessment & Readiness Configuration Authority
 *
 * All scoring, mastery, readiness, and roadmap constants are centralized here.
 * NEVER hardcode weights, decay rates, or thresholds outside this module.
 */

export const FORMULA_VERSION = '1.0.0';

/**
 * Mandatory statutory preparation indicator disclaimer displayed next to all readiness scores.
 */
export const READINESS_DISCLAIMER =
  'The Placement Readiness Score is a diagnostic preparation indicator designed to measure conceptual mastery and practice consistency. It does NOT constitute a guarantee, prediction, or legal assurance of employment or recruitment selection by CampusEdge or partner institutions.';

/**
 * Question difficulty weighting for mastery and adaptive scoring.
 * Range: 1 (Foundational) to 5 (Advanced / Complex).
 */
export const DIFFICULTY_WEIGHTS: Record<number, number> = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 1.2,
  5: 1.4,
};

/**
 * Topic Mastery Parameters
 */
export const MASTERY_CONFIG = {
  // Max recent scored items considered per topic
  MAX_SCORED_ITEMS_WINDOW: 50,
  // Half-life in days for exponential recency decay (0.5^(ageDays / HALF_LIFE_DAYS))
  RECENCY_HALF_LIFE_DAYS: 30,
  // Bayesian prior weight (pseudo-observations) centered at 0.5 prior accuracy
  BAYESIAN_PRIOR_WEIGHT_K: 2,
  // Minimum scored items required before assigning a definitive level (STRONG / MODERATE / WEAK)
  MIN_SCORED_ITEMS_FOR_LEVEL: 5,
  // Thresholds for mastery levels
  STRONG_THRESHOLD: 0.7,
  MODERATE_THRESHOLD: 0.4,
} as const;

/**
 * Readiness Component Weights and Minimum Data Availability Thresholds
 */
export const READINESS_CONFIG = {
  // Component weights by student track
  WEIGHTS: {
    SOFTWARE: {
      APTITUDE: 0.3,
      TECHNICAL: 0.35,
      MOCK: 0.2,
      CONSISTENCY: 0.15,
      CODING: 0.0, // Reserved for Phase 5
      INTERVIEW: 0.0, // Reserved for Phase 6
    },
    OTHER: {
      APTITUDE: 0.55,
      TECHNICAL: 0.0,
      MOCK: 0.3,
      CONSISTENCY: 0.15,
      CODING: 0.0,
      INTERVIEW: 0.0,
    },
  },
  // Minimum scored items / attempts required for component availability
  AVAILABILITY: {
    APTITUDE_MIN_ITEMS: 15,
    TECHNICAL_MIN_ITEMS: 20,
    MOCK_MIN_ATTEMPTS: 1,
    MOCK_CONSIDERED_COUNT: 3,
    CONSISTENCY_WINDOW_DAYS: 14,
    CONSISTENCY_TARGET_DAYS: 10,
  },
  // Total scored items across all topics required for overall confidence band
  CONFIDENCE_THRESHOLDS: {
    LOW_MAX: 29, // < 30 = LOW
    MEDIUM_MAX: 100, // 30 - 100 = MEDIUM, > 100 = HIGH
  },
  // Readiness score scale bands (0 - 100)
  BANDS: {
    GETTING_STARTED_MAX: 40,
    BUILDING_MAX: 60,
    COMPETITIVE_MAX: 80,
  },
  BAND_LABELS: {
    GETTING_STARTED: 'Getting started',
    BUILDING: 'Building',
    COMPETITIVE: 'Competitive',
    STRONG: 'Strong',
  },
} as const;

/**
 * Test Engine Operational Limits & Safeguards
 */
export const TEST_ENGINE_CONFIG = {
  // Grace period added to deadline_at before rejecting answers (HTTP 409)
  DEADLINE_GRACE_PERIOD_MS: 5000,
  // Hard cap on anti-tampering integrity events stored per attempt
  MAX_EVENTS_PER_ATTEMPT: 200,
  // Maximum attempts a single student may initiate per calendar day
  MAX_ATTEMPTS_PER_DAY: 30,
  // Cooldown in days required between full diagnostic attempts
  DIAGNOSTIC_COOLDOWN_DAYS: 14,
  // Days to avoid serving previously seen questions to a student in practice/test generation
  ANTI_REPEAT_WINDOW_DAYS: 30,
} as const;

/**
 * Personalized Roadmap Parameters
 */
export const ROADMAP_CONFIG = {
  HORIZON_DAYS: 28,
  QUESTIONS_PER_STUDY_HOUR: 20,
  MIN_DAILY_QUESTIONS: 10,
  MAX_DAILY_QUESTIONS: 160,
  DEFAULT_STUDY_HOURS: 1.5,
  MAINTENANCE_INTERVAL_DAYS: 10,
  MAINTENANCE_QUESTION_COUNT: 10,
  MISTAKE_REVIEW_TASKS_PER_WEEK: 2,
  MOCKS_PER_WEEK: 1,
  DRIVE_PROXIMITY_DAYS: 30,
  DRIVE_WEIGHT_BOOST: 0.5,
  RECURRING_RECRUITER_TOPIC_BOOST: 0.3,
  CORE_TRACK_BOOST: 0.2,
} as const;
