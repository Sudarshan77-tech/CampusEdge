import { z } from 'zod';
import {
  ContentScope,
  QuestionReportReason,
  QuestionSource,
  QuestionStatus,
  QuestionType,
  ResultsReleasePolicy,
  TechnicalTrack,
  TestGenerationMode,
  TestScheduleAudience,
  TestTemplateKind,
  TestTrack,
  AttemptEventType,
  RoadmapTaskStatus,
} from './phase3-enums';

// -------------------------------------------------------------
// Question & Content Schemas
// -------------------------------------------------------------

export const QuestionOptionInputSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(5),
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
  sort: z.number().int().default(0),
});

export const CreateQuestionSchema = z
  .object({
    scope: z.nativeEnum(ContentScope).default(ContentScope.COLLEGE),
    collegeId: z.string().uuid().optional().nullable(),
    topicId: z.string().uuid('Valid topic ID is required'),
    subtopicId: z.string().uuid().optional().nullable(),
    type: z.nativeEnum(QuestionType),
    difficulty: z.number().int().min(1).max(5).default(3),
    groupId: z.string().uuid().optional().nullable(),
    stem: z.string().min(5, 'Question stem must be at least 5 characters'),
    explanation: z.string().min(5, 'Explanation must be at least 5 characters'),
    numericAnswer: z.number().optional().nullable(),
    numericTolerance: z.number().min(0).default(0),
    expectedTimeSeconds: z.number().int().min(10).max(600).default(60),
    tags: z.array(z.string()).default([]),
    source: z.nativeEnum(QuestionSource).default(QuestionSource.AUTHORED),
    licenseNote: z.string().optional().nullable(),
    options: z.array(QuestionOptionInputSchema).default([]),
  })
  .refine(
    (data) => {
      if (data.type === QuestionType.NUMERIC) {
        return (
          data.numericAnswer !== undefined &&
          data.numericAnswer !== null &&
          data.options.length === 0
        );
      }
      if (data.type === QuestionType.MCQ_SINGLE) {
        const correctCount = data.options.filter((o) => o.isCorrect).length;
        return data.options.length >= 2 && data.options.length <= 6 && correctCount === 1;
      }
      if (data.type === QuestionType.MCQ_MULTI) {
        const correctCount = data.options.filter((o) => o.isCorrect).length;
        return data.options.length >= 2 && data.options.length <= 6 && correctCount >= 1;
      }
      return true;
    },
    {
      message:
        'Option constraints violated: MCQ_SINGLE requires exactly 1 correct option (2-6 options total); MCQ_MULTI requires >= 1 correct option; NUMERIC requires numericAnswer and zero options.',
    },
  );

export type CreateQuestionDto = z.infer<typeof CreateQuestionSchema>;

export const QuestionReportSchema = z.object({
  reason: z.nativeEnum(QuestionReportReason),
  note: z.string().max(500).optional().default(''),
});

export type QuestionReportDto = z.infer<typeof QuestionReportSchema>;

export const UpdateQuestionSchema = z.object({
  topicId: z.string().uuid().optional(),
  subtopicId: z.string().uuid().optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional(),
  groupId: z.string().uuid().optional().nullable(),
  stem: z.string().min(5).optional(),
  explanation: z.string().min(5).optional(),
  numericAnswer: z.number().optional().nullable(),
  numericTolerance: z.number().min(0).optional(),
  expectedTimeSeconds: z.number().int().min(10).max(600).optional(),
  tags: z.array(z.string()).optional(),
  options: z.array(QuestionOptionInputSchema).optional(),
});

export type UpdateQuestionDto = z.infer<typeof UpdateQuestionSchema>;

export const CreateQuestionGroupSchema = z.object({
  scope: z.nativeEnum(ContentScope).default(ContentScope.COLLEGE),
  collegeId: z.string().uuid().optional().nullable(),
  title: z.string().min(3).max(255),
  body: z.string().min(10),
  imagePath: z.string().max(500).optional().nullable(),
});

export type CreateQuestionGroupDto = z.infer<typeof CreateQuestionGroupSchema>;

export const QuestionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  topicId: z.string().uuid().optional(),
  subtopicId: z.string().uuid().optional(),
  type: z.nativeEnum(QuestionType).optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  status: z.nativeEnum(QuestionStatus).optional(),
  scope: z.nativeEnum(ContentScope).optional(),
  tag: z.string().optional(),
});

export type QuestionQueryDto = z.infer<typeof QuestionQuerySchema>;

export const ResolveReportSchema = z.object({
  action: z.enum(['APPROVE', 'RETIRE']),
  note: z.string().max(500).optional().default(''),
});

export type ResolveReportDto = z.infer<typeof ResolveReportSchema>;

// -------------------------------------------------------------
// In-Attempt Sanitized DTOs (Zero Answer Key Leakage Contract)
// -------------------------------------------------------------

export const SanitizedOptionSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  text: z.string(),
  sort: z.number().int(),
});

export type SanitizedOptionDto = z.infer<typeof SanitizedOptionSchema>;

export const InAttemptQuestionSchema = z.object({
  position: z.number().int().min(1),
  questionId: z.string().uuid(),
  versionId: z.string().uuid(),
  type: z.nativeEnum(QuestionType),
  difficulty: z.number().int().min(1).max(5),
  stem: z.string(),
  imagePath: z.string().nullable().optional(),
  passageText: z.string().nullable().optional(),
  options: z.array(SanitizedOptionSchema),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  numericResponse: z.number().nullable().optional(),
  markedForReview: z.boolean().default(false),
  timeSpentMs: z.number().int().min(0).default(0),
});

export type InAttemptQuestionDto = z.infer<typeof InAttemptQuestionSchema>;

export const FORBIDDEN_LEAKAGE_KEYS = [
  'is_correct',
  'isCorrect',
  'explanation',
  'correctOptionIds',
  'correctOptionId',
  'numeric_answer',
  'numericAnswer',
  'numeric_tolerance',
  'numericTolerance',
] as const;

/**
 * Recursive contract verification that throws if any student-facing payload
 * contains answer keys or explanations during an active attempt.
 */
export function assertNoAnswerLeakage(payload: unknown, path = '$'): void {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i++) {
      assertNoAnswerLeakage(payload[i], `${path}[${i}]`);
    }
    return;
  }

  const record = payload as Record<string, unknown>;
  for (const forbidden of FORBIDDEN_LEAKAGE_KEYS) {
    if (forbidden in record && record[forbidden] !== undefined) {
      throw new Error(
        `CRITICAL SECURITY VIOLATION: Forbidden field "${forbidden}" detected in in-attempt student response at path "${path}.${forbidden}"!`,
      );
    }
  }

  for (const [k, v] of Object.entries(record)) {
    assertNoAnswerLeakage(v, `${path}.${k}`);
  }
}

// -------------------------------------------------------------
// Attempt Lifecycle DTOs
// -------------------------------------------------------------

export const StartAttemptSchema = z
  .object({
    templateId: z.string().uuid().optional(),
    scheduleId: z.string().uuid().optional(),
  })
  .refine((data) => data.templateId || data.scheduleId, {
    message: 'Either templateId or scheduleId must be provided to start an attempt.',
  });

export type StartAttemptDto = z.infer<typeof StartAttemptSchema>;

export const StartPracticeSchema = z.object({
  topicId: z.string().uuid('Topic ID is required'),
  subtopicId: z.string().uuid().optional(),
  count: z.union([z.literal(10), z.literal(20), z.literal(30)]).default(10),
  difficulty: z
    .union([
      z.literal('auto'),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ])
    .default('auto'),
});

export type StartPracticeDto = z.infer<typeof StartPracticeSchema>;

export const SaveAnswerSchema = z.object({
  selectedOptionIds: z.array(z.string().uuid()).optional(),
  numericResponse: z.number().nullable().optional(),
  markedForReview: z.boolean().optional(),
  timeSpentDeltaMs: z.number().int().min(0).max(600000).default(0),
});

export type SaveAnswerDto = z.infer<typeof SaveAnswerSchema>;

export const LogAttemptEventSchema = z.object({
  type: z.nativeEnum(AttemptEventType),
  occurredAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  meta: z.record(z.unknown()).optional(),
});

export type LogAttemptEventDto = z.infer<typeof LogAttemptEventSchema>;

// -------------------------------------------------------------
// Test Template & Schedule DTOs
// -------------------------------------------------------------

export const TestSectionRuleSchema = z.object({
  topicId: z.string().uuid(),
  subtopicId: z.string().uuid().optional().nullable(),
  count: z.number().int().min(1),
  difficultyMin: z.number().int().min(1).max(5).default(1),
  difficultyMax: z.number().int().min(1).max(5).default(5),
});

export const TestSectionInputSchema = z.object({
  sequence: z.number().int().min(1),
  title: z.string().min(1),
  marksPerQuestion: z.number().positive(),
  negativeMarks: z.number().min(0).default(0),
  sectionTimeLimitMinutes: z.number().int().positive().optional().nullable(),
  questionCount: z.number().int().min(1),
  rules: z.array(TestSectionRuleSchema).default([]),
  questionIds: z.array(z.string().uuid()).default([]),
});

export const CreateTestTemplateSchema = z.object({
  scope: z.nativeEnum(ContentScope).default(ContentScope.COLLEGE),
  collegeId: z.string().uuid().optional().nullable(),
  kind: z.nativeEnum(TestTemplateKind),
  title: z.string().min(3),
  description: z.string().default(''),
  companyId: z.string().uuid().optional().nullable(),
  durationMinutes: z.number().int().min(5).max(300),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  generationMode: z.nativeEnum(TestGenerationMode).default(TestGenerationMode.GENERATED),
  track: z.nativeEnum(TestTrack).default(TestTrack.ALL),
  sections: z.array(TestSectionInputSchema).min(1, 'At least 1 test section is required'),
});

export type CreateTestTemplateDto = z.infer<typeof CreateTestTemplateSchema>;

export const CreateTestScheduleSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().min(3),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  audience: z.nativeEnum(TestScheduleAudience).default(TestScheduleAudience.ALL),
  targetBranchIds: z.array(z.string().uuid()).default([]),
  targetBatchYears: z.array(z.number().int()).default([]),
  resultsRelease: z.nativeEnum(ResultsReleasePolicy).default(ResultsReleasePolicy.IMMEDIATE),
});

export type CreateTestScheduleDto = z.infer<typeof CreateTestScheduleSchema>;

// -------------------------------------------------------------
// Roadmap & Preferences DTOs
// -------------------------------------------------------------

export const UpdateRoadmapPreferencesSchema = z.object({
  studyHoursPerDay: z.number().min(0.5).max(8.0).optional(),
  targetDate: z.string().datetime().nullable().optional(),
  technicalTrack: z.nativeEnum(TechnicalTrack).optional(),
});

export type UpdateRoadmapPreferencesDto = z.infer<typeof UpdateRoadmapPreferencesSchema>;

export const RegenerateRoadmapSchema = z.object({
  studyHoursPerDay: z.number().min(0.5).max(8.0).optional(),
  targetDate: z.string().optional().nullable(),
});

export type RegenerateRoadmapDto = z.infer<typeof RegenerateRoadmapSchema>;

export const UpdateRoadmapTaskStatusSchema = z.object({
  status: z.nativeEnum(RoadmapTaskStatus),
});

export type UpdateRoadmapTaskStatusDto = z.infer<typeof UpdateRoadmapTaskStatusSchema>;
