export enum QuestionType {
  MCQ_SINGLE = 'MCQ_SINGLE',
  MCQ_MULTI = 'MCQ_MULTI',
  NUMERIC = 'NUMERIC',
}

export enum ContentScope {
  GLOBAL = 'GLOBAL',
  COLLEGE = 'COLLEGE',
}

export enum QuestionStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  RETIRED = 'RETIRED',
  FLAGGED = 'FLAGGED',
}

export enum QuestionSource {
  ORIGINAL_SEED = 'ORIGINAL_SEED',
  AUTHORED = 'AUTHORED',
  IMPORTED = 'IMPORTED',
  LICENSED = 'LICENSED',
}

export enum QuestionReportReason {
  WRONG_ANSWER = 'WRONG_ANSWER',
  UNCLEAR = 'UNCLEAR',
  DUPLICATE = 'DUPLICATE',
  OFFENSIVE = 'OFFENSIVE',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

export enum TestTemplateKind {
  DIAGNOSTIC = 'DIAGNOSTIC',
  PRACTICE = 'PRACTICE',
  MOCK = 'MOCK',
  COLLEGE_TEST = 'COLLEGE_TEST',
}

export enum TestTemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum TestGenerationMode {
  GENERATED = 'GENERATED',
  FIXED = 'FIXED',
}

export enum TestTrack {
  ALL = 'ALL',
  SOFTWARE = 'SOFTWARE',
}

export enum TechnicalTrack {
  SOFTWARE = 'SOFTWARE',
  OTHER = 'OTHER',
}

export enum TestScheduleAudience {
  ALL = 'ALL',
  BY_BRANCH = 'BY_BRANCH',
  BY_BATCH_YEAR = 'BY_BATCH_YEAR',
}

export enum ResultsReleasePolicy {
  IMMEDIATE = 'IMMEDIATE',
  AFTER_WINDOW_CLOSES = 'AFTER_WINDOW_CLOSES',
  MANUAL = 'MANUAL',
}

export enum TestScheduleStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  AUTO_SUBMITTED = 'AUTO_SUBMITTED',
  ABANDONED = 'ABANDONED',
  VOIDED = 'VOIDED',
}

export enum AttemptEventType {
  BLUR = 'BLUR',
  FOCUS = 'FOCUS',
  FULLSCREEN_EXIT = 'FULLSCREEN_EXIT',
  VISIBILITY_HIDDEN = 'VISIBILITY_HIDDEN',
  PASTE = 'PASTE',
  RECONNECT = 'RECONNECT',
}

export enum TopicMasteryLevel {
  STRONG = 'STRONG',
  MODERATE = 'MODERATE',
  WEAK = 'WEAK',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
}

export enum ReadinessBand {
  GETTING_STARTED = 'GETTING_STARTED',
  BUILDING = 'BUILDING',
  COMPETITIVE = 'COMPETITIVE',
  STRONG = 'STRONG',
}

export enum ReadinessConfidence {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum ReadinessTrigger {
  ATTEMPT_SUBMITTED = 'ATTEMPT_SUBMITTED',
  DAILY = 'DAILY',
  MANUAL = 'MANUAL',
}

export enum RoadmapPlanStatus {
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
}

export enum RoadmapTaskKind {
  PRACTICE_TOPIC = 'PRACTICE_TOPIC',
  TAKE_TEST = 'TAKE_TEST',
  REVIEW_MISTAKES = 'REVIEW_MISTAKES',
  MAINTENANCE = 'MAINTENANCE',
  DRIVE_PREP = 'DRIVE_PREP',
}

export enum RoadmapTaskStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  SKIPPED = 'SKIPPED',
}
