import { z } from 'zod';

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

export const roleSchema = z.nativeEnum(Role);
export type RoleType = z.infer<typeof roleSchema>;

export const collegeStatusSchema = z.nativeEnum(CollegeStatus);
export type CollegeStatusType = z.infer<typeof collegeStatusSchema>;

export const currentUserSchema = z.object({
  userId: z.string().uuid(),
  role: roleSchema,
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
