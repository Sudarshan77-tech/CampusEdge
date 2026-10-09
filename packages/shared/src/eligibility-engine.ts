import { Degree } from './index';
import { DriveCategory, DriveStatus } from './phase2-enums';
import { DRIVE_CATEGORY_RANK } from './constants';

export interface StudentEligibilityProfile {
  id?: string;
  status: string; // e.g. UserStatus.ACTIVE
  cgpa: number;
  activeBacklogs: number;
  degree: Degree | string;
  batchYear: number;
  branchId: string;
}

export interface DriveEligibilityCriteria {
  minCgpa?: number | null;
  maxActiveBacklogs?: number | null;
  allowedDegrees?: string[] | null;
  allowedBatchYears?: number[] | null;
  allowedBranchIds?: string[] | null; // null or empty array indicates all branches eligible
}

export interface DriveDetails {
  id: string;
  category: DriveCategory;
  status: DriveStatus;
  registrationDeadline?: Date | string | null;
}

export interface ExistingOffer {
  driveId: string;
  category: DriveCategory;
}

export interface EligibilityContext {
  now?: Date;
  isRegistered?: boolean;
  enforceOneOfferPolicy?: boolean;
  existingOffers?: ExistingOffer[];
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

/**
 * Authoritative, pure eligibility evaluation engine for CampusEdge placement drives.
 * Evaluates academic thresholds, degree/batch/branch constraints, deadlines,
 * registration status, and the institutional one-offer policy.
 */
export function evaluateEligibility(
  student: StudentEligibilityProfile,
  drive: DriveDetails,
  eligibility: DriveEligibilityCriteria = {},
  context: EligibilityContext = {},
): EligibilityResult {
  const reasons: string[] = [];
  const now = context.now ?? new Date();

  // 1. Student account status
  if (student.status !== 'ACTIVE') {
    reasons.push('Student account is not active.');
  }

  // 2. Drive status
  if (drive.status !== DriveStatus.REGISTRATION_OPEN) {
    if (drive.status === DriveStatus.REGISTRATION_CLOSED) {
      reasons.push('Registration for this drive is closed.');
    } else {
      reasons.push(`Drive is not open for registration (current status: ${drive.status}).`);
    }
  }

  // 3. Registration deadline
  if (drive.registrationDeadline) {
    const deadline = new Date(drive.registrationDeadline);
    if (!isNaN(deadline.getTime()) && deadline < now) {
      reasons.push('Registration deadline has passed.');
    }
  }

  // 4. Duplicate registration check
  if (context.isRegistered) {
    reasons.push('Student is already registered for this drive.');
  }

  // 5. CGPA threshold (inclusive boundary: student.cgpa >= minCgpa)
  if (eligibility.minCgpa !== null && eligibility.minCgpa !== undefined) {
    if (student.cgpa < eligibility.minCgpa) {
      reasons.push(
        `CGPA (${student.cgpa.toFixed(2)}) is below the required minimum (${eligibility.minCgpa.toFixed(2)}).`,
      );
    }
  }

  // 6. Active backlogs threshold (inclusive: student.activeBacklogs <= maxActiveBacklogs)
  if (eligibility.maxActiveBacklogs !== null && eligibility.maxActiveBacklogs !== undefined) {
    if (student.activeBacklogs > eligibility.maxActiveBacklogs) {
      reasons.push(
        `Active backlogs (${student.activeBacklogs}) exceed maximum allowed (${eligibility.maxActiveBacklogs}).`,
      );
    }
  }

  // 7. Degree restriction
  if (eligibility.allowedDegrees && eligibility.allowedDegrees.length > 0) {
    if (!eligibility.allowedDegrees.includes(student.degree)) {
      reasons.push(`Degree '${student.degree}' is not eligible for this drive.`);
    }
  }

  // 8. Batch year restriction
  if (eligibility.allowedBatchYears && eligibility.allowedBatchYears.length > 0) {
    if (!eligibility.allowedBatchYears.includes(student.batchYear)) {
      reasons.push(`Batch year (${student.batchYear}) is not eligible for this drive.`);
    }
  }

  // 9. Branch restriction
  if (eligibility.allowedBranchIds && eligibility.allowedBranchIds.length > 0) {
    if (!eligibility.allowedBranchIds.includes(student.branchId)) {
      reasons.push('Branch is not included in the eligible branches for this drive.');
    }
  }

  // 10. Institutional one-offer policy
  if (
    context.enforceOneOfferPolicy &&
    context.existingOffers &&
    context.existingOffers.length > 0
  ) {
    // Find highest tier among existing selected offers
    let highestTierRank = 0;
    let highestTierCategory: DriveCategory = DriveCategory.MASS_RECRUITER;

    for (const offer of context.existingOffers) {
      const rank = DRIVE_CATEGORY_RANK[offer.category] ?? 0;
      if (rank > highestTierRank) {
        highestTierRank = rank;
        highestTierCategory = offer.category;
      }
    }

    const currentDriveRank = DRIVE_CATEGORY_RANK[drive.category] ?? 0;
    if (currentDriveRank <= highestTierRank) {
      reasons.push(
        `Under the institutional one-offer policy, students with an offer in tier '${highestTierCategory}' may only apply to strictly higher-tier drives.`,
      );
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
