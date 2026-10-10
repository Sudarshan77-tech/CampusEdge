import { describe, it, expect } from 'vitest';
import { resolveOnboardingStep } from './onboarding-helpers';
import { UserStatus } from '@campusedge/shared';

describe('resolveOnboardingStep', () => {
  it('maps CHOOSE_COLLEGE or missing collegeId to step 1', () => {
    expect(resolveOnboardingStep('CHOOSE_COLLEGE', UserStatus.ONBOARDING, null)).toEqual({
      stepNumber: 1,
    });
    expect(resolveOnboardingStep(undefined, UserStatus.ONBOARDING, null)).toEqual({
      stepNumber: 1,
    });
    expect(resolveOnboardingStep('CHOOSE_COLLEGE', UserStatus.ONBOARDING, 'college-123')).toEqual({
      stepNumber: 1,
    });
  });

  it('maps CONSENT to step 2', () => {
    expect(resolveOnboardingStep('CONSENT', UserStatus.ONBOARDING, 'college-123')).toEqual({
      stepNumber: 2,
    });
  });

  it('maps PROFILE_WIZARD to step 3', () => {
    expect(resolveOnboardingStep('PROFILE_WIZARD', UserStatus.ONBOARDING, 'college-123')).toEqual({
      stepNumber: 3,
    });
  });

  it('maps WAITING_APPROVAL or PENDING_APPROVAL to step 4', () => {
    expect(resolveOnboardingStep('WAITING_APPROVAL', UserStatus.ONBOARDING, 'college-123')).toEqual(
      {
        stepNumber: 4,
      },
    );
    expect(resolveOnboardingStep('ANY_STEP', UserStatus.PENDING_APPROVAL, 'college-123')).toEqual({
      stepNumber: 4,
    });
  });

  it('redirects to /student/dashboard for ACTIVE or COMPLETED', () => {
    expect(resolveOnboardingStep('COMPLETED', UserStatus.ONBOARDING, 'college-123')).toEqual({
      redirect: '/student/dashboard',
    });
    expect(resolveOnboardingStep('CHOOSE_COLLEGE', UserStatus.ACTIVE, 'college-123')).toEqual({
      redirect: '/student/dashboard',
    });
  });

  it('flags SUSPENDED accounts', () => {
    expect(resolveOnboardingStep('CHOOSE_COLLEGE', UserStatus.SUSPENDED, null)).toEqual({
      specialState: 'SUSPENDED',
    });
  });

  it('flags DEACTIVATED accounts', () => {
    expect(resolveOnboardingStep('CHOOSE_COLLEGE', UserStatus.DEACTIVATED, null)).toEqual({
      specialState: 'DEACTIVATED',
    });
  });

  it('flags UNKNOWN for unexpected step values', () => {
    expect(
      resolveOnboardingStep('SOME_WEIRD_UNEXPECTED_STEP', UserStatus.ONBOARDING, 'col-1'),
    ).toEqual({
      specialState: 'UNKNOWN',
    });
  });
});
