import { Role, UserStatus } from '@campusedge/shared';

export type OnboardingStepNumber = 1 | 2 | 3 | 4;

export interface BranchOption {
  id: string;
  code?: string;
  name?: string;
  branchCode?: string;
  branchName?: string;
}

export interface CollegeOption {
  id: string;
  name: string;
  code?: string;
  slug?: string;
  branches?: BranchOption[];
}

export interface SkillCatalogItem {
  id?: string;
  name: string;
  category: string;
}

export interface MeProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  collegeId?: string | null;
  college?: CollegeOption | null;
  onboardingStep?: string;
  profileCompletion?: number;
}

export type SpecialAccountState = 'SUSPENDED' | 'DEACTIVATED' | 'UNKNOWN' | null;

/**
 * Pure helper function to resolve current onboarding step number or routing destination
 * based on backend API profile state.
 */
export function resolveOnboardingStep(
  apiStep?: string,
  status?: UserStatus,
  collegeId?: string | null,
): {
  stepNumber?: OnboardingStepNumber;
  redirect?: string;
  specialState?: SpecialAccountState;
} {
  // 1. Account lifecycle states
  if (status === UserStatus.SUSPENDED) {
    return { specialState: 'SUSPENDED' };
  }
  if (status === UserStatus.DEACTIVATED) {
    return { specialState: 'DEACTIVATED' };
  }
  if (status === UserStatus.ACTIVE || apiStep === 'COMPLETED') {
    return { redirect: '/student/dashboard' };
  }

  // 2. Explicit API onboarding steps
  if (apiStep === 'CHOOSE_COLLEGE' || !collegeId) {
    return { stepNumber: 1 };
  }
  if (apiStep === 'CONSENT') {
    return { stepNumber: 2 };
  }
  if (apiStep === 'PROFILE_WIZARD') {
    return { stepNumber: 3 };
  }
  if (apiStep === 'WAITING_APPROVAL' || status === UserStatus.PENDING_APPROVAL) {
    return { stepNumber: 4 };
  }
  if (apiStep === 'ONBOARDING') {
    return { stepNumber: collegeId ? 2 : 1 };
  }

  // Fallback for unhandled/unknown step string
  return { specialState: 'UNKNOWN' };
}
