export enum CollegeFeatureType {
  COMPANY_PREP = 'COMPANY_PREP',
  COMPANY_MATCH = 'COMPANY_MATCH',
  CALENDAR = 'CALENDAR',
  EMAIL_NOTIFICATIONS = 'EMAIL_NOTIFICATIONS',
  INTERVIEW_BANK = 'INTERVIEW_BANK',
}

export enum DriveEventKind {
  REGISTRATION_OPENS = 'REGISTRATION_OPENS',
  REGISTRATION_DEADLINE = 'REGISTRATION_DEADLINE',
  PRE_PLACEMENT_TALK = 'PRE_PLACEMENT_TALK',
  APTITUDE_TEST = 'APTITUDE_TEST',
  CODING_TEST = 'CODING_TEST',
  GROUP_DISCUSSION = 'GROUP_DISCUSSION',
  TECHNICAL_INTERVIEW = 'TECHNICAL_INTERVIEW',
  HR_INTERVIEW = 'HR_INTERVIEW',
  RESULTS = 'RESULTS',
  DOCUMENT_DEADLINE = 'DOCUMENT_DEADLINE',
  OTHER = 'OTHER',
}

export enum EventMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum EventAudience {
  ALL_ELIGIBLE = 'ALL_ELIGIBLE',
  REGISTERED = 'REGISTERED',
  SHORTLISTED = 'SHORTLISTED',
}

export enum EventStatus {
  SCHEDULED = 'SCHEDULED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  DONE = 'DONE',
}

export enum CollegeEventAudience {
  ALL = 'ALL',
  BY_BRANCH = 'BY_BRANCH',
  BY_BATCH_YEAR = 'BY_BATCH_YEAR',
}

export enum PrepResourceType {
  LINK = 'LINK',
  FILE = 'FILE',
  NOTE = 'NOTE',
}

export enum PrepResourceStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  RETIRED = 'RETIRED',
}

export enum InterviewQuestionCategory {
  HR = 'HR',
  BEHAVIORAL = 'BEHAVIORAL',
  TECHNICAL = 'TECHNICAL',
  PROJECT = 'PROJECT',
  ROLE_SPECIFIC = 'ROLE_SPECIFIC',
}

export enum InterviewQuestionProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  PRACTICING = 'PRACTICING',
  CONFIDENT = 'CONFIDENT',
}

export enum CompanyMatchConfidence {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum CompanyPriorityTier {
  PREPARE_NOW = 'PREPARE_NOW',
  PREPARE_NEXT = 'PREPARE_NEXT',
  ON_RADAR = 'ON_RADAR',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
}

export enum NotificationCategory {
  ACCOUNT_SECURITY = 'ACCOUNT_SECURITY',
  ACCOUNT_APPROVAL = 'ACCOUNT_APPROVAL',
  DRIVE_PUBLISHED = 'DRIVE_PUBLISHED',
  REGISTRATION_DEADLINE = 'REGISTRATION_DEADLINE',
  EVENT_REMINDER = 'EVENT_REMINDER',
  APPLICATION_STATUS = 'APPLICATION_STATUS',
  TEST_SCHEDULED = 'TEST_SCHEDULED',
  TEST_REMINDER = 'TEST_REMINDER',
  NOTICE = 'NOTICE',
  EXPERIENCE_REVIEW = 'EXPERIENCE_REVIEW',
  PREP_NUDGE = 'PREP_NUDGE',
  WEEKLY_DIGEST = 'WEEKLY_DIGEST',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
}

export enum EmailOutboxStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SUPPRESSED = 'SUPPRESSED',
  SKIPPED = 'SKIPPED',
  BOUNCED = 'BOUNCED',
  COMPLAINED = 'COMPLAINED',
}

export enum CompanySizeBand {
  STARTUP = 'STARTUP',
  MID_SIZE = 'MID_SIZE',
  ENTERPRISE = 'ENTERPRISE',
  LARGE_ENTERPRISE = 'LARGE_ENTERPRISE',
}

export enum RoleFamily {
  SOFTWARE_DEV = 'SOFTWARE_DEV',
  DATA_ANALYTICS = 'DATA_ANALYTICS',
  QA_TESTING = 'QA_TESTING',
  SUPPORT_OPERATIONS = 'SUPPORT_OPERATIONS',
  CORE_ENGINEERING = 'CORE_ENGINEERING',
  CONSULTING_BUSINESS = 'CONSULTING_BUSINESS',
  OTHER = 'OTHER',
}

export enum EmailSuppressionReason {
  BOUNCE = 'BOUNCE',
  COMPLAINT = 'COMPLAINT',
  MANUAL = 'MANUAL',
  UNSUBSCRIBE_ALL = 'UNSUBSCRIBE_ALL',
}

/**
 * Adjacency map defining lateral preparation skill transferability between role families.
 */
export const ROLE_FAMILY_ADJACENCY: Record<RoleFamily, RoleFamily[]> = {
  [RoleFamily.SOFTWARE_DEV]: [RoleFamily.DATA_ANALYTICS, RoleFamily.QA_TESTING],
  [RoleFamily.DATA_ANALYTICS]: [RoleFamily.SOFTWARE_DEV, RoleFamily.CONSULTING_BUSINESS],
  [RoleFamily.QA_TESTING]: [RoleFamily.SOFTWARE_DEV, RoleFamily.SUPPORT_OPERATIONS],
  [RoleFamily.SUPPORT_OPERATIONS]: [RoleFamily.QA_TESTING, RoleFamily.CORE_ENGINEERING],
  [RoleFamily.CORE_ENGINEERING]: [RoleFamily.SUPPORT_OPERATIONS, RoleFamily.OTHER],
  [RoleFamily.CONSULTING_BUSINESS]: [RoleFamily.DATA_ANALYTICS, RoleFamily.OTHER],
  [RoleFamily.OTHER]: [],
};

export const ROLE_FAMILY_LABELS: Record<RoleFamily, string> = {
  [RoleFamily.SOFTWARE_DEV]: 'Software Engineering & Development',
  [RoleFamily.DATA_ANALYTICS]: 'Data Science & Analytics',
  [RoleFamily.QA_TESTING]: 'Quality Assurance & SDET',
  [RoleFamily.SUPPORT_OPERATIONS]: 'IT Support & Operations',
  [RoleFamily.CORE_ENGINEERING]: 'Core Technical Engineering',
  [RoleFamily.CONSULTING_BUSINESS]: 'Business & Technology Consulting',
  [RoleFamily.OTHER]: 'General & Emerging Roles',
};

export const COMPANY_SIZE_LABELS: Record<CompanySizeBand, string> = {
  [CompanySizeBand.STARTUP]: 'Startup (< 50 employees)',
  [CompanySizeBand.MID_SIZE]: 'Mid-Size (50 - 500 employees)',
  [CompanySizeBand.ENTERPRISE]: 'Enterprise (500 - 5,000 employees)',
  [CompanySizeBand.LARGE_ENTERPRISE]: 'Large Enterprise (5,000+ employees)',
};
