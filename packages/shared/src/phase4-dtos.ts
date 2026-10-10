import { z } from 'zod';
import {
  CollegeFeatureType,
  CompanySizeBand,
  DriveEventKind,
  EventAudience,
  CollegeEventAudience,
  EventMode,
  EventStatus,
  InterviewQuestionCategory,
  InterviewQuestionProgressStatus,
  NotificationCategory,
  PrepResourceStatus,
  PrepResourceType,
  RoleFamily,
} from './phase4-enums';

// ---------------------------------------------------------------------------
// 1. Company Profile & Notes
// ---------------------------------------------------------------------------

export const UpdateCompanyProfileSchema = z.object({
  sizeBand: z.nativeEnum(CompanySizeBand).optional(),
  primaryRoleFamily: z.nativeEnum(RoleFamily).optional(),
  overview: z.string().max(5000).optional(),
  websiteUrl: z.string().url().max(500).optional().or(z.literal('')),
  logoUrl: z.string().url().max(500).optional().or(z.literal('')),
  hqCity: z.string().max(100).optional(),
  hqCountry: z.string().max(100).optional(),
  glassdoorRating: z.number().min(1).max(5).optional(),
  techStack: z.array(z.string().max(50)).max(50).optional(),
  selectionProcessSummary: z.string().max(5000).optional(),
  typicalRoundsCount: z.number().int().min(1).max(10).optional(),
  ctcBreakupNote: z.string().max(5000).optional(),
});

export type UpdateCompanyProfileDto = z.infer<typeof UpdateCompanyProfileSchema>;

export const UpsertCollegeCompanyNoteSchema = z.object({
  note: z.string().min(1).max(5000),
});

export type UpsertCollegeCompanyNoteDto = z.infer<typeof UpsertCollegeCompanyNoteSchema>;

export const FollowCompanySchema = z.object({
  companyId: z.string().uuid(),
});

export type FollowCompanyDto = z.infer<typeof FollowCompanySchema>;

// ---------------------------------------------------------------------------
// 2. Preparation Resources
// ---------------------------------------------------------------------------

export const CreatePrepResourceSchema = z.object({
  scope: z.enum(['GLOBAL', 'COLLEGE']).default('COLLEGE'),
  companyId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  title: z.string().min(2).max(255),
  description: z.string().max(5000).optional().nullable(),
  type: z.nativeEnum(PrepResourceType).default(PrepResourceType.LINK),
  url: z.string().url().max(1000).optional().nullable(),
  storagePath: z.string().max(500).optional().nullable(),
  content: z.string().max(20000).optional().nullable(),
  status: z.nativeEnum(PrepResourceStatus).default(PrepResourceStatus.APPROVED),
});

export type CreatePrepResourceDto = z.infer<typeof CreatePrepResourceSchema>;

export const QueryPrepResourcesSchema = z.object({
  companyId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  type: z.nativeEnum(PrepResourceType).optional(),
  status: z.nativeEnum(PrepResourceStatus).optional(),
});

export type QueryPrepResourcesDto = z.infer<typeof QueryPrepResourcesSchema>;

// ---------------------------------------------------------------------------
// 3. Interview Question Bank
// ---------------------------------------------------------------------------

export const CreateInterviewQuestionSchema = z.object({
  scope: z.enum(['GLOBAL', 'COLLEGE']).default('COLLEGE'),
  companyId: z.string().uuid().optional().nullable(),
  roleFamily: z.nativeEnum(RoleFamily).default(RoleFamily.SOFTWARE_DEV),
  category: z.nativeEnum(InterviewQuestionCategory).default(InterviewQuestionCategory.TECHNICAL),
  question: z.string().min(10).max(10000),
  answerGuide: z.string().max(10000).optional().nullable(),
  difficulty: z.number().int().min(1).max(5).default(3),
  tags: z.array(z.string().max(50)).default([]),
  status: z.enum(['DRAFT', 'APPROVED', 'RETIRED']).default('APPROVED'),
  sourceExperienceId: z.string().uuid().optional().nullable(),
});

export type CreateInterviewQuestionDto = z.infer<typeof CreateInterviewQuestionSchema>;

export const UpdateInterviewQuestionProgressSchema = z.object({
  status: z.nativeEnum(InterviewQuestionProgressStatus),
  studentNotes: z.string().max(5000).optional().nullable(),
});

export type UpdateInterviewQuestionProgressDto = z.infer<
  typeof UpdateInterviewQuestionProgressSchema
>;

export const QueryInterviewQuestionsSchema = z.object({
  companyId: z.string().uuid().optional(),
  roleFamily: z.nativeEnum(RoleFamily).optional(),
  category: z.nativeEnum(InterviewQuestionCategory).optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().max(100).optional(),
  progressStatus: z.nativeEnum(InterviewQuestionProgressStatus).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type QueryInterviewQuestionsDto = z.infer<typeof QueryInterviewQuestionsSchema>;

// ---------------------------------------------------------------------------
// 4. Calendar & Events
// ---------------------------------------------------------------------------

export const CreateDriveEventSchema = z
  .object({
    driveId: z.string().uuid(),
    roundId: z.string().uuid().optional().nullable(),
    kind: z.nativeEnum(DriveEventKind),
    title: z.string().min(2).max(255),
    description: z.string().max(5000).optional().nullable(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    mode: z.nativeEnum(EventMode).default(EventMode.OFFLINE),
    location: z.string().max(255).optional().nullable(),
    meetingUrl: z.string().url().max(500).optional().nullable(),
    audience: z.nativeEnum(EventAudience).default(EventAudience.ALL_ELIGIBLE),
    status: z.nativeEnum(EventStatus).default(EventStatus.SCHEDULED),
    notifyOnCreate: z.boolean().default(true),
  })
  .refine((data) => new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime(), {
    message: 'Event end time must be after or equal to start time',
    path: ['endsAt'],
  });

export type CreateDriveEventDto = z.infer<typeof CreateDriveEventSchema>;

export const CreateCollegeEventSchema = z
  .object({
    title: z.string().min(2).max(255),
    description: z.string().max(5000).optional().nullable(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    mode: z.nativeEnum(EventMode).default(EventMode.OFFLINE),
    location: z.string().max(255).optional().nullable(),
    meetingUrl: z.string().url().max(500).optional().nullable(),
    audience: z.nativeEnum(CollegeEventAudience).default(CollegeEventAudience.ALL),
    targetBranchIds: z.array(z.string().uuid()).default([]),
    targetBatchYears: z.array(z.number().int()).default([]),
    status: z.nativeEnum(EventStatus).default(EventStatus.SCHEDULED),
  })
  .refine((data) => new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime(), {
    message: 'Event end time must be after or equal to start time',
    path: ['endsAt'],
  });

export type CreateCollegeEventDto = z.infer<typeof CreateCollegeEventSchema>;

export const QueryCalendarSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  driveId: z.string().uuid().optional(),
});

export type QueryCalendarDto = z.infer<typeof QueryCalendarSchema>;

// ---------------------------------------------------------------------------
// 5. Notifications & Preferences
// ---------------------------------------------------------------------------

export const UpdateNotificationPreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      category: z.nativeEnum(NotificationCategory),
      inAppEnabled: z.boolean(),
      emailEnabled: z.boolean(),
    }),
  ),
});

export type UpdateNotificationPreferencesDto = z.infer<typeof UpdateNotificationPreferencesSchema>;

export const MarkNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).max(100),
});

export type MarkNotificationsReadDto = z.infer<typeof MarkNotificationsReadSchema>;

export const QueryNotificationsSchema = z.object({
  unreadOnly: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type QueryNotificationsDto = z.infer<typeof QueryNotificationsSchema>;

// ---------------------------------------------------------------------------
// 6. College Features
// ---------------------------------------------------------------------------

export const ToggleCollegeFeatureSchema = z.object({
  feature: z.nativeEnum(CollegeFeatureType),
  isEnabled: z.boolean(),
});

export type ToggleCollegeFeatureDto = z.infer<typeof ToggleCollegeFeatureSchema>;
