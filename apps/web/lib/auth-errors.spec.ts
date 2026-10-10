import { describe, it, expect } from 'vitest';
import { formatAuthError } from './auth-errors';

describe('formatAuthError', () => {
  it('identifies network failures and returns user-friendly network message', () => {
    const err = new TypeError('Failed to fetch');
    const msg = formatAuthError(err, 'login');
    expect(msg).toBe(
      'We could not reach the server. Check your internet connection and try again.',
    );
  });

  it('masks specific account non-existence errors on login', () => {
    const err = new Error('Invalid login credentials');
    const msg = formatAuthError(err, 'login');
    expect(msg).toBe('Invalid email or password. Please try again.');
  });

  it('handles email not confirmed on login', () => {
    const err = new Error('Email not confirmed');
    const msg = formatAuthError(err, 'login');
    expect(msg).toBe(
      'Your email address has not been verified yet. Please check your inbox for the confirmation email.',
    );
  });

  it('gives clear guidance on duplicate email during signup', () => {
    const err = new Error('User already registered');
    const msg = formatAuthError(err, 'signup');
    expect(msg).toBe('This email address is already registered. Please sign in instead.');
  });

  it('handles rate limiting', () => {
    const err = new Error('Over rate limit: too many requests');
    const msg = formatAuthError(err, 'signup');
    expect(msg).toBe('Too many requests. Please wait a moment before trying again.');
  });

  it('never outputs raw [object Object]', () => {
    const msg = formatAuthError({}, 'login');
    expect(msg).not.toContain('[object');
    expect(msg).toBe('An unexpected authentication error occurred. Please try again.');
  });
});
