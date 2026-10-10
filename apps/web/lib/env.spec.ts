import { describe, it, expect } from 'vitest';
import { validateWebEnv } from './env';

describe('validateWebEnv', () => {
  const validEnv = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://testproject.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_validtestkey1234567890',
    NEXT_PUBLIC_API_URL: 'http://localhost:4000',
  };

  it('accepts valid configuration', () => {
    const result = validateWebEnv(validEnv);
    expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe('https://testproject.supabase.co');
    expect(result.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
      'sb_publishable_validtestkey1234567890',
    );
    expect(result.NEXT_PUBLIC_API_URL).toBe('http://localhost:4000');
  });

  it('rejects bracketed Markdown-link URL', () => {
    const invalidEnv = {
      ...validEnv,
      NEXT_PUBLIC_SUPABASE_URL:
        '[https://testproject.supabase.co](https://testproject.supabase.co)',
    };
    expect(() => validateWebEnv(invalidEnv)).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL must not contain Markdown brackets or parentheses/,
    );
  });

  it('rejects URL with trailing slash', () => {
    const invalidEnv = {
      ...validEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://testproject.supabase.co/',
    };
    expect(() => validateWebEnv(invalidEnv)).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL must not contain a trailing slash/,
    );
  });

  it('rejects missing publishable key', () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://testproject.supabase.co',
      NEXT_PUBLIC_API_URL: 'http://localhost:4000',
    };
    expect(() => validateWebEnv(invalidEnv)).toThrow(
      /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing/,
    );
  });

  it('rejects publishable key not starting with sb_publishable_', () => {
    const invalidEnv = {
      ...validEnv,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'invalid_key_prefix_123',
    };
    expect(() => validateWebEnv(invalidEnv)).toThrow(
      /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must start with "sb_publishable_"/,
    );
  });

  it('rejects URL with quotes', () => {
    const invalidEnv = {
      ...validEnv,
      NEXT_PUBLIC_SUPABASE_URL: '"https://testproject.supabase.co"',
    };
    expect(() => validateWebEnv(invalidEnv)).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL must not include quotes/,
    );
  });
});
