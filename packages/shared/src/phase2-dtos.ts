import { z } from 'zod';
import {
  CompanyStatus,
  companyStatusSchema,
  topicCategorySchema,
  DriveType,
  driveTypeSchema,
  DriveCategory,
  driveCategorySchema,
  DriveStatus,
  driveStatusSchema,
  JobType,
  jobTypeSchema,
  roundTypeSchema,
  RoundMode,
  roundModeSchema,
  applicationStatusSchema,
  NoticeAudience,
  noticeAudienceSchema,
  NoticeStatus,
  noticeStatusSchema,
  experienceOutcomeSchema,
  experienceStatusSchema,
  importJobTypeSchema,
  importJobStatusSchema,
} from './phase2-enums';
import { degreeSchema } from './index';

// =============================================================================
// Company DTOs
// =============================================================================

export const createCompanySchema = z.object({
  name: z.string().min(1).max(255).trim(),
  website: z.string().url().max(255).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  logoUrl: z
    .string()
    .url()
    .max(500)
    .refine((url) => url.startsWith('https://'), {
      message: 'Logo URL must use HTTPS',
    })
    .optional()
    .nullable(),
});
export type CreateCompanyDto = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial();
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;

export const verifyCompanySchema = z.object({
  status: z.enum([CompanyStatus.VERIFIED, CompanyStatus.REJECTED]),
  reviewNote: z.string().max(500).optional(),
});
export type VerifyCompanyDto = z.infer<typeof verifyCompanySchema>;

export const mergeCompanySchema = z.object({
  targetCompanyId: z.string().uuid(),
});
export type MergeCompanyDto = z.infer<typeof mergeCompanySchema>;

export const companyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: companyStatusSchema.optional(),
});
export type CompanyQueryDto = z.infer<typeof companyQuerySchema>;

// =============================================================================
// Placement Season DTOs
// =============================================================================

export const createSeasonSchema = z.object({
  label: z.string().min(4).max(50).trim(), // e.g. "2026-27"
  batchYear: z.number().int().min(2000).max(2100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isCurrent: z.boolean().default(false).optional(),
});
export type CreateSeasonDto = z.infer<typeof createSeasonSchema>;

export const updateSeasonSchema = createSeasonSchema.partial().extend({
  rowVersion: z.number().int().min(1).optional(),
});
export type UpdateSeasonDto = z.infer<typeof updateSeasonSchema>;

export const seasonQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
export type SeasonQueryDto = z.infer<typeof seasonQuerySchema>;

// =============================================================================
// Drive Nested & Main DTOs
// =============================================================================

export const createDriveRoleSchema = z
  .object({
    title: z.string().min(2).max(100).trim(),
    jobType: jobTypeSchema.default(JobType.FULL_TIME),
    ctcLpaMin: z.number().min(0).max(999.99),
    ctcLpaMax: z.number().min(0).max(999.99),
    stipendMonthly: z.number().int().min(0).optional().nullable(),
    location: z.string().max(100).optional().nullable(),
    openings: z.number().int().min(1).optional().nullable(),
    bondMonths: z.number().int().min(0).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    skillIds: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => data.ctcLpaMin <= data.ctcLpaMax, {
    message: 'ctcLpaMin cannot exceed ctcLpaMax',
    path: ['ctcLpaMin'],
  });
export type CreateDriveRoleDto = z.infer<typeof createDriveRoleSchema>;

export const createDriveRoundSchema = z.object({
  sequence: z.number().int().min(1),
  roundType: roundTypeSchema,
  title: z.string().min(2).max(100).trim(),
  durationMinutes: z.number().int().min(1).optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
  mode: roundModeSchema.default(RoundMode.ONLINE),
  platformNote: z.string().max(255).optional().nullable(),
  topicIds: z.array(z.string().uuid()).optional(),
});
export type CreateDriveRoundDto = z.infer<typeof createDriveRoundSchema>;

export const createDriveEligibilitySchema = z.object({
  minCgpa: z.number().min(0).max(10).optional().nullable(),
  maxActiveBacklogs: z.number().int().min(0).optional().nullable(),
  allowedDegrees: z.array(degreeSchema).optional().nullable(),
  allowedBatchYears: z.array(z.number().int().min(2000).max(2100)).optional().nullable(),
  branchIds: z.array(z.string().uuid()).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export type CreateDriveEligibilityDto = z.infer<typeof createDriveEligibilitySchema>;

export const createDriveBaseSchema = z.object({
  companyId: z.string().uuid(),
  seasonId: z.string().uuid(),
  title: z.string().min(2).max(255).trim(),
  description: z.string().max(5000).optional().nullable(),
  driveType: driveTypeSchema.default(DriveType.ON_CAMPUS),
  category: driveCategorySchema.default(DriveCategory.REGULAR),
  status: driveStatusSchema.default(DriveStatus.DRAFT),
  isHistorical: z.boolean().default(false).optional(),
  visitDate: z.string().datetime().optional().nullable(),
  registrationOpensAt: z.string().datetime().optional().nullable(),
  registrationDeadline: z.string().datetime().optional().nullable(),
  venue: z.string().max(255).optional().nullable(),
  roles: z.array(createDriveRoleSchema).optional(),
  eligibility: createDriveEligibilitySchema.optional().nullable(),
  rounds: z.array(createDriveRoundSchema).optional(),
  registeredCount: z.number().int().min(0).optional().nullable(),
  shortlistedCount: z.number().int().min(0).optional().nullable(),
  selectedCount: z.number().int().min(0).optional().nullable(),
});

export const createDriveSchema = createDriveBaseSchema.refine(
  (data) => {
    if (
      data.selectedCount !== null &&
      data.selectedCount !== undefined &&
      data.registeredCount !== null &&
      data.registeredCount !== undefined
    ) {
      return data.selectedCount <= data.registeredCount;
    }
    return true;
  },
  {
    message: 'selectedCount cannot exceed registeredCount',
    path: ['selectedCount'],
  },
);
export type CreateDriveDto = z.infer<typeof createDriveSchema>;

export const updateDriveSchema = createDriveBaseSchema
  .partial()
  .extend({
    rowVersion: z.number().int().min(1).optional(),
  })
  .refine(
    (data) => {
      if (
        data.selectedCount !== null &&
        data.selectedCount !== undefined &&
        data.registeredCount !== null &&
        data.registeredCount !== undefined
      ) {
        return data.selectedCount <= data.registeredCount;
      }
      return true;
    },
    {
      message: 'selectedCount cannot exceed registeredCount',
      path: ['selectedCount'],
    },
  );
export type UpdateDriveDto = z.infer<typeof updateDriveSchema>;

export const transitionDriveStatusSchema = z.object({
  status: driveStatusSchema,
  rowVersion: z.number().int().min(1),
});
export type TransitionDriveStatusDto = z.infer<typeof transitionDriveStatusSchema>;

export const driveQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  seasonId: z.string().uuid().optional(),
  status: driveStatusSchema.optional(),
  companyId: z.string().uuid().optional(),
  search: z.string().optional(),
});
export type DriveQueryDto = z.infer<typeof driveQuerySchema>;

// =============================================================================
// Application DTOs
// =============================================================================

export const applyDriveSchema = z.object({
  consentGiven: z.literal(true, {
    errorMap: () => ({
      message: 'You must grant placement data sharing consent to register for this drive.',
    }),
  }),
  policyVersion: z.string().default('1.0'),
});
export type ApplyDriveDto = z.infer<typeof applyDriveSchema>;

export const updateApplicationStatusSchema = z.object({
  status: applicationStatusSchema,
  offeredRoleId: z.string().uuid().optional().nullable(),
  offeredCtcLpa: z.number().min(0).max(999.99).optional().nullable(),
  rowVersion: z.number().int().min(1),
});
export type UpdateApplicationStatusDto = z.infer<typeof updateApplicationStatusSchema>;

export const bulkUpdateApplicationStatusSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1),
  status: applicationStatusSchema,
});
export type BulkUpdateApplicationStatusDto = z.infer<typeof bulkUpdateApplicationStatusSchema>;

export const applicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  driveId: z.string().uuid().optional(),
  status: applicationStatusSchema.optional(),
  branchId: z.string().uuid().optional(),
  search: z.string().optional(),
});
export type ApplicationQueryDto = z.infer<typeof applicationQuerySchema>;

// =============================================================================
// Topic DTOs
// =============================================================================

export const createTopicSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  category: topicCategorySchema,
});
export type CreateTopicDto = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = createTopicSchema.partial();
export type UpdateTopicDto = z.infer<typeof updateTopicSchema>;

export const topicQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category: topicCategorySchema.optional(),
  search: z.string().optional(),
});
export type TopicQueryDto = z.infer<typeof topicQuerySchema>;

// =============================================================================
// Notice DTOs
// =============================================================================

export const createNoticeSchema = z.object({
  title: z.string().min(2).max(255).trim(),
  body: z.string().min(1).max(5000),
  audience: noticeAudienceSchema.default(NoticeAudience.ALL),
  targetBranchIds: z.array(z.string().uuid()).optional(),
  targetBatchYears: z.array(z.number().int().min(2000).max(2100)).optional(),
  driveId: z.string().uuid().optional().nullable(),
  isPinned: z.boolean().default(false).optional(),
  status: noticeStatusSchema.default(NoticeStatus.DRAFT).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});
export type CreateNoticeDto = z.infer<typeof createNoticeSchema>;

export const updateNoticeSchema = createNoticeSchema.partial().extend({
  rowVersion: z.number().int().min(1).optional(),
});
export type UpdateNoticeDto = z.infer<typeof updateNoticeSchema>;

export const noticeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: noticeStatusSchema.optional(),
  audience: noticeAudienceSchema.optional(),
  search: z.string().optional(),
});
export type NoticeQueryDto = z.infer<typeof noticeQuerySchema>;

// =============================================================================
// Interview Experience DTOs
// =============================================================================

export const createExperienceRoundSchema = z.object({
  sequence: z.number().int().min(1),
  roundType: roundTypeSchema,
  description: z.string().min(1).max(2000),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
  topicIds: z.array(z.string().uuid()).optional(),
});
export type CreateExperienceRoundDto = z.infer<typeof createExperienceRoundSchema>;

export const createExperienceSchema = z.object({
  companyId: z.string().uuid(),
  driveId: z.string().uuid().optional().nullable(),
  roleTitle: z.string().min(2).max(100).trim(),
  seasonLabel: z.string().min(2).max(50).trim(),
  difficulty: z.number().int().min(1).max(5),
  outcome: experienceOutcomeSchema,
  overallSummary: z.string().min(10).max(3000),
  tips: z.string().max(1500).optional().nullable(),
  isAnonymous: z.boolean().default(true),
  rounds: z.array(createExperienceRoundSchema).min(1).optional(),
});
export type CreateExperienceDto = z.infer<typeof createExperienceSchema>;

export const updateExperienceSchema = createExperienceSchema.partial().extend({
  rowVersion: z.number().int().min(1).optional(),
});
export type UpdateExperienceDto = z.infer<typeof updateExperienceSchema>;

export const moderateExperienceSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'REMOVE']),
    reviewNote: z.string().max(1000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (
        (data.decision === 'REQUEST_CHANGES' || data.decision === 'REJECT') &&
        (!data.reviewNote || data.reviewNote.trim().length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'A review note is required when requesting changes or rejecting.',
      path: ['reviewNote'],
    },
  );
export type ModerateExperienceDto = z.infer<typeof moderateExperienceSchema>;

export const reportExperienceSchema = z.object({
  reason: z.string().min(5).max(500).trim(),
});
export type ReportExperienceDto = z.infer<typeof reportExperienceSchema>;

export const experienceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  companyId: z.string().uuid().optional(),
  status: experienceStatusSchema.optional(),
  outcome: experienceOutcomeSchema.optional(),
  search: z.string().optional(),
});
export type ExperienceQueryDto = z.infer<typeof experienceQuerySchema>;

// =============================================================================
// Import Job DTOs
// =============================================================================

export const companyMappingItemSchema = z.object({
  rawName: z.string().min(1),
  resolvedCompanyId: z.string().uuid().optional().nullable(),
  createNew: z.boolean().default(false).optional(),
});
export type CompanyMappingItem = z.infer<typeof companyMappingItemSchema>;

export const commitImportSchema = z.object({
  onDuplicate: z.enum(['SKIP', 'UPDATE']).default('SKIP'),
  companyMappings: z.array(companyMappingItemSchema).optional(),
});
export type CommitImportDto = z.infer<typeof commitImportSchema>;

export const importJobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: importJobTypeSchema.optional(),
  status: importJobStatusSchema.optional(),
});
export type ImportJobQueryDto = z.infer<typeof importJobQuerySchema>;
