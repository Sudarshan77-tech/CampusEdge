import { z } from 'zod';

// =============================================================================
// Phase 2 Enums
// =============================================================================

export enum CompanyStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  MERGED = 'MERGED',
}

export enum TopicCategory {
  APTITUDE = 'APTITUDE',
  VERBAL = 'VERBAL',
  LOGICAL = 'LOGICAL',
  DSA = 'DSA',
  PROGRAMMING = 'PROGRAMMING',
  DBMS = 'DBMS',
  SQL = 'SQL',
  OS = 'OS',
  NETWORKS = 'NETWORKS',
  OOP = 'OOP',
  SOFTWARE_ENGINEERING = 'SOFTWARE_ENGINEERING',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  HR = 'HR',
  OTHER = 'OTHER',
}

export enum DriveType {
  ON_CAMPUS = 'ON_CAMPUS',
  OFF_CAMPUS = 'OFF_CAMPUS',
  POOL = 'POOL',
  VIRTUAL = 'VIRTUAL',
}

export enum DriveCategory {
  MASS_RECRUITER = 'MASS_RECRUITER',
  REGULAR = 'REGULAR',
  DREAM = 'DREAM',
  SUPER_DREAM = 'SUPER_DREAM',
}

export enum DriveStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  INTERNSHIP = 'INTERNSHIP',
  INTERN_PLUS_PPO = 'INTERN_PLUS_PPO',
}

export enum RoundType {
  APTITUDE = 'APTITUDE',
  TECHNICAL_MCQ = 'TECHNICAL_MCQ',
  CODING = 'CODING',
  GROUP_DISCUSSION = 'GROUP_DISCUSSION',
  TECHNICAL_INTERVIEW = 'TECHNICAL_INTERVIEW',
  HR_INTERVIEW = 'HR_INTERVIEW',
  MANAGERIAL = 'MANAGERIAL',
  CASE_STUDY = 'CASE_STUDY',
  OTHER = 'OTHER',
}

export enum RoundMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum ApplicationStatus {
  REGISTERED = 'REGISTERED',
  WITHDRAWN = 'WITHDRAWN',
  SHORTLISTED = 'SHORTLISTED',
  SELECTED = 'SELECTED',
  REJECTED = 'REJECTED',
}

export enum NoticeAudience {
  ALL = 'ALL',
  BY_BRANCH = 'BY_BRANCH',
  BY_BATCH_YEAR = 'BY_BATCH_YEAR',
}

export enum NoticeStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ExperienceOutcome {
  SELECTED = 'SELECTED',
  NOT_SELECTED = 'NOT_SELECTED',
  NOT_DISCLOSED = 'NOT_DISCLOSED',
}

export enum ExperienceStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REMOVED = 'REMOVED',
}

export enum ImportJobType {
  HISTORICAL_DRIVES = 'HISTORICAL_DRIVES',
  APPLICATION_RESULTS = 'APPLICATION_RESULTS',
}

export enum ImportJobStatus {
  UPLOADED = 'UPLOADED',
  VALIDATED = 'VALIDATED',
  FAILED = 'FAILED',
  COMMITTING = 'COMMITTING',
  COMPLETED = 'COMPLETED',
}

// =============================================================================
// Zod Enum Schemas
// =============================================================================

export const companyStatusSchema = z.nativeEnum(CompanyStatus);
export type CompanyStatusType = z.infer<typeof companyStatusSchema>;

export const topicCategorySchema = z.nativeEnum(TopicCategory);
export type TopicCategoryType = z.infer<typeof topicCategorySchema>;

export const driveTypeSchema = z.nativeEnum(DriveType);
export type DriveTypeType = z.infer<typeof driveTypeSchema>;

export const driveCategorySchema = z.nativeEnum(DriveCategory);
export type DriveCategoryType = z.infer<typeof driveCategorySchema>;

export const driveStatusSchema = z.nativeEnum(DriveStatus);
export type DriveStatusType = z.infer<typeof driveStatusSchema>;

export const jobTypeSchema = z.nativeEnum(JobType);
export type JobTypeType = z.infer<typeof jobTypeSchema>;

export const roundTypeSchema = z.nativeEnum(RoundType);
export type RoundTypeType = z.infer<typeof roundTypeSchema>;

export const roundModeSchema = z.nativeEnum(RoundMode);
export type RoundModeType = z.infer<typeof roundModeSchema>;

export const applicationStatusSchema = z.nativeEnum(ApplicationStatus);
export type ApplicationStatusType = z.infer<typeof applicationStatusSchema>;

export const noticeAudienceSchema = z.nativeEnum(NoticeAudience);
export type NoticeAudienceType = z.infer<typeof noticeAudienceSchema>;

export const noticeStatusSchema = z.nativeEnum(NoticeStatus);
export type NoticeStatusType = z.infer<typeof noticeStatusSchema>;

export const experienceOutcomeSchema = z.nativeEnum(ExperienceOutcome);
export type ExperienceOutcomeType = z.infer<typeof experienceOutcomeSchema>;

export const experienceStatusSchema = z.nativeEnum(ExperienceStatus);
export type ExperienceStatusType = z.infer<typeof experienceStatusSchema>;

export const importJobTypeSchema = z.nativeEnum(ImportJobType);
export type ImportJobTypeType = z.infer<typeof importJobTypeSchema>;

export const importJobStatusSchema = z.nativeEnum(ImportJobStatus);
export type ImportJobStatusType = z.infer<typeof importJobStatusSchema>;
