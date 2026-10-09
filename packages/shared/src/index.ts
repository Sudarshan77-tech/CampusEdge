import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export enum Role {
  STUDENT = 'STUDENT',
  COLLEGE_ADMIN = 'COLLEGE_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum CollegeStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum UserStatus {
  ONBOARDING = 'ONBOARDING',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum Degree {
  BTECH = 'BTECH',
  MTECH = 'MTECH',
  MCA = 'MCA',
  MBA = 'MBA',
  OTHER = 'OTHER',
}

export enum SkillCategory {
  LANGUAGE = 'LANGUAGE',
  FRAMEWORK = 'FRAMEWORK',
  DATABASE = 'DATABASE',
  CS_FUNDAMENTAL = 'CS_FUNDAMENTAL',
  TOOL = 'TOOL',
}

export enum Proficiency {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum ConsentType {
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY',
  DATA_PROCESSING = 'DATA_PROCESSING',
  PLACEMENT_SHARING = 'PLACEMENT_SHARING',
}

export enum DataRequestType {
  EXPORT = 'EXPORT',
  DELETE = 'DELETE',
}

export enum DataRequestStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
}

// =============================================================================
// Policy Version Constants
// =============================================================================

export const POLICY_VERSIONS = {
  TERMS: '1.0',
  PRIVACY: '1.0',
  DATA_PROCESSING: '1.0',
  PLACEMENT_SHARING: '1.0',
} as const;

// =============================================================================
// Zod Enum Schemas & Types
// =============================================================================

export const roleSchema = z.nativeEnum(Role);
export type RoleType = z.infer<typeof roleSchema>;

export const collegeStatusSchema = z.nativeEnum(CollegeStatus);
export type CollegeStatusType = z.infer<typeof collegeStatusSchema>;

export const userStatusSchema = z.nativeEnum(UserStatus);
export type UserStatusType = z.infer<typeof userStatusSchema>;

export const degreeSchema = z.nativeEnum(Degree);
export type DegreeType = z.infer<typeof degreeSchema>;

export const skillCategorySchema = z.nativeEnum(SkillCategory);
export type SkillCategoryType = z.infer<typeof skillCategorySchema>;

export const proficiencySchema = z.nativeEnum(Proficiency);
export type ProficiencyType = z.infer<typeof proficiencySchema>;

export const invitationStatusSchema = z.nativeEnum(InvitationStatus);
export type InvitationStatusType = z.infer<typeof invitationStatusSchema>;

export const consentTypeSchema = z.nativeEnum(ConsentType);
export type ConsentTypeType = z.infer<typeof consentTypeSchema>;

export const dataRequestTypeSchema = z.nativeEnum(DataRequestType);
export type DataRequestTypeType = z.infer<typeof dataRequestTypeSchema>;

export const dataRequestStatusSchema = z.nativeEnum(DataRequestStatus);
export type DataRequestStatusType = z.infer<typeof dataRequestStatusSchema>;

// =============================================================================
// Auth & Context Schemas
// =============================================================================

export const currentUserSchema = z.object({
  userId: z.string().uuid(),
  role: roleSchema,
  status: userStatusSchema,
  collegeId: z.string().uuid().nullable(),
  email: z.string().email().optional(),
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

export const apiErrorResponseSchema = z.object({
  statusCode: z.number(),
  timestamp: z.string(),
  path: z.string(),
  method: z.string(),
  requestId: z.string(),
  message: z.string(),
  error: z.string().optional(),
});
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  uptime: z.number(),
  database: z.enum(['connected', 'disconnected']),
  version: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

// =============================================================================
// Pagination Schema
// =============================================================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// =============================================================================
// Super Admin DTO Schemas
// =============================================================================

export const createCollegeSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  emailDomains: z.array(z.string().toLowerCase().trim()).default([]).optional(),
  requireStudentApproval: z.boolean().default(false).optional(),
  contactEmail: z.string().email().optional().nullable(),
});
export type CreateCollegeDto = z.infer<typeof createCollegeSchema>;

export const updateCollegeSchema = createCollegeSchema.partial().extend({
  status: collegeStatusSchema.optional(),
});
export type UpdateCollegeDto = z.infer<typeof updateCollegeSchema>;

export const inviteCollegeAdminSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});
export type InviteCollegeAdminDto = z.infer<typeof inviteCollegeAdminSchema>;

export const updateUserStatusSchema = z.object({
  status: userStatusSchema,
});
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;

// =============================================================================
// College Admin DTO Schemas
// =============================================================================

export const updateCollegeSettingsSchema = z.object({
  emailDomains: z.array(z.string().toLowerCase().trim()).optional(),
  requireStudentApproval: z.boolean().optional(),
  allowMultipleOffers: z.boolean().optional(),
  contactEmail: z.string().email().optional().nullable(),
});
export type UpdateCollegeSettingsDto = z.infer<typeof updateCollegeSettingsSchema>;

export const createBranchSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(20).toUpperCase().trim(),
  isActive: z.boolean().default(true).optional(),
});
export type CreateBranchDto = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema.partial();
export type UpdateBranchDto = z.infer<typeof updateBranchSchema>;

export const studentDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'SUSPEND']),
});
export type StudentDecisionDto = z.infer<typeof studentDecisionSchema>;

// =============================================================================
// Student DTO Schemas
// =============================================================================

export const chooseCollegeSchema = z.object({
  collegeId: z.string().uuid(),
});
export type ChooseCollegeDto = z.infer<typeof chooseCollegeSchema>;

export const recordConsentSchema = z.object({
  consentType: consentTypeSchema,
  policyVersion: z.string().min(1).max(20),
});
export type RecordConsentDto = z.infer<typeof recordConsentSchema>;

export const studentSkillItemSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: proficiencySchema.default(Proficiency.BEGINNER),
});
export type StudentSkillItemDto = z.infer<typeof studentSkillItemSchema>;

export const updateStudentProfileSchema = z.object({
  branchId: z.string().uuid(),
  degree: degreeSchema,
  batchYear: z.number().int().min(2000).max(2100),
  cgpa: z.number().min(0.0).max(10.0),
  activeBacklogs: z.number().int().min(0).default(0),
  enrollmentNumber: z.string().max(50).optional().nullable(),
  targetRole: z.string().max(100).optional().nullable(),
  skills: z.array(studentSkillItemSchema).optional(),
});
export type UpdateStudentProfileDto = z.infer<typeof updateStudentProfileSchema>;

export const createDataRequestSchema = z.object({
  type: dataRequestTypeSchema,
});
export type CreateDataRequestDto = z.infer<typeof createDataRequestSchema>;

// =============================================================================
// Phase 2 Exports
// =============================================================================

export * from './constants';
export * from './phase2-enums';
export * from './company-utils';
export * from './drive-state-machine';
export * from './eligibility-engine';
export * from './phase2-dtos';
