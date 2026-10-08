import { describe, it, expect } from 'vitest';
import { Role, roleSchema, currentUserSchema } from './index';

describe('Shared Schemas & Enums', () => {
  it('should validate valid roles', () => {
    expect(roleSchema.parse(Role.STUDENT)).toBe('STUDENT');
    expect(roleSchema.parse(Role.COLLEGE_ADMIN)).toBe('COLLEGE_ADMIN');
    expect(roleSchema.parse(Role.SUPER_ADMIN)).toBe('SUPER_ADMIN');
  });

  it('should reject invalid roles', () => {
    expect(() => roleSchema.parse('GUEST')).toThrow();
  });

  it('should validate a valid current user payload', () => {
    const validUser = {
      userId: '11111111-1111-1111-1111-111111111111',
      role: Role.STUDENT,
      collegeId: '22222222-2222-2222-2222-222222222222',
      email: 'student@example.com',
    };
    const parsed = currentUserSchema.parse(validUser);
    expect(parsed.userId).toBe(validUser.userId);
    expect(parsed.role).toBe(Role.STUDENT);
  });
});
