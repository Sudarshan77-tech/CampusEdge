import { describe, it, expect } from 'vitest';
import {
  normalizeCompanyName,
  canTransitionDrive,
  evaluateEligibility,
  HISTORICAL_INTELLIGENCE_DISCLAIMER,
  MIN_COHORT_FOR_STATS,
  RECURRING_RECRUITER_MIN_SEASONS,
  DRIVE_CATEGORY_RANK,
  DriveStatus,
  DriveCategory,
  Degree,
  createCompanySchema,
  createDriveRoleSchema,
  createDriveSchema,
  applyDriveSchema,
} from './index';

describe('Phase 2 Shared Logic', () => {
  describe('Constants', () => {
    it('defines mandatory historical intelligence disclaimer', () => {
      expect(HISTORICAL_INTELLIGENCE_DISCLAIMER).toContain('Historical hiring patterns');
      expect(HISTORICAL_INTELLIGENCE_DISCLAIMER).toContain('do not guarantee future hiring');
    });

    it('defines minimum cohort size for aggregated stats', () => {
      expect(MIN_COHORT_FOR_STATS).toBe(3);
    });

    it('defines recurring recruiter rules', () => {
      expect(RECURRING_RECRUITER_MIN_SEASONS).toBe(2);
    });

    it('defines strict tier ordering for one-offer policy', () => {
      expect(DRIVE_CATEGORY_RANK[DriveCategory.MASS_RECRUITER]).toBeLessThan(
        DRIVE_CATEGORY_RANK[DriveCategory.REGULAR],
      );
      expect(DRIVE_CATEGORY_RANK[DriveCategory.REGULAR]).toBeLessThan(
        DRIVE_CATEGORY_RANK[DriveCategory.DREAM],
      );
      expect(DRIVE_CATEGORY_RANK[DriveCategory.DREAM]).toBeLessThan(
        DRIVE_CATEGORY_RANK[DriveCategory.SUPER_DREAM],
      );
    });
  });

  describe('normalizeCompanyName', () => {
    it('normalizes uppercase, punctuation, and legal suffixes', () => {
      expect(normalizeCompanyName('Google India Pvt. Ltd.')).toBe('google');
      expect(normalizeCompanyName('Microsoft Corporation')).toBe('microsoft');
      expect(normalizeCompanyName('Infosys Technologies Limited')).toBe('infosys');
      expect(normalizeCompanyName('Tata Consultancy Services Pvt Ltd')).toBe('tata consultancy');
      expect(normalizeCompanyName('Accenture Solutions Private Limited')).toBe('accenture');
      expect(normalizeCompanyName('Amazon Development Centre (India) Inc.')).toBe(
        'amazon development centre',
      );
      expect(normalizeCompanyName('Goldman Sachs & Co. LLC')).toBe('goldman sachs');
    });

    it('preserves names if noise stripping would empty the string', () => {
      expect(normalizeCompanyName('Tech Co')).toBe('tech co');
    });

    it('handles empty or blank input gracefully', () => {
      expect(normalizeCompanyName('')).toBe('');
      expect(normalizeCompanyName('   ')).toBe('');
    });
  });

  describe('canTransitionDrive', () => {
    const fixedNow = new Date('2026-10-15T10:00:00Z');
    const futureDeadline = new Date('2026-10-20T10:00:00Z');
    const pastDeadline = new Date('2026-10-10T10:00:00Z');

    it('allows same-status transitions (idempotent)', () => {
      expect(canTransitionDrive(DriveStatus.DRAFT, DriveStatus.DRAFT).allowed).toBe(true);
      expect(canTransitionDrive(DriveStatus.PUBLISHED, DriveStatus.PUBLISHED).allowed).toBe(true);
    });

    it('blocks DRAFT to PUBLISHED if prerequisites are missing', () => {
      // Missing roles
      expect(
        canTransitionDrive(DriveStatus.DRAFT, DriveStatus.PUBLISHED, {
          roleCount: 0,
          hasEligibility: true,
          registrationDeadline: futureDeadline,
          now: fixedNow,
        }).allowed,
      ).toBe(false);

      // Missing eligibility
      expect(
        canTransitionDrive(DriveStatus.DRAFT, DriveStatus.PUBLISHED, {
          roleCount: 1,
          hasEligibility: false,
          registrationDeadline: futureDeadline,
          now: fixedNow,
        }).allowed,
      ).toBe(false);

      // Past deadline
      expect(
        canTransitionDrive(DriveStatus.DRAFT, DriveStatus.PUBLISHED, {
          roleCount: 1,
          hasEligibility: true,
          registrationDeadline: pastDeadline,
          now: fixedNow,
        }).allowed,
      ).toBe(false);
    });

    it('allows DRAFT to PUBLISHED when all prerequisites are met', () => {
      const res = canTransitionDrive(DriveStatus.DRAFT, DriveStatus.PUBLISHED, {
        roleCount: 2,
        hasEligibility: true,
        registrationDeadline: futureDeadline,
        now: fixedNow,
      });
      expect(res.allowed).toBe(true);
    });

    it('allows historical drives to bypass future deadline requirement', () => {
      const res = canTransitionDrive(DriveStatus.DRAFT, DriveStatus.PUBLISHED, {
        roleCount: 1,
        hasEligibility: true,
        registrationDeadline: pastDeadline,
        isHistorical: true,
        now: fixedNow,
      });
      expect(res.allowed).toBe(true);
    });

    it('allows progressive forward transitions', () => {
      expect(canTransitionDrive(DriveStatus.PUBLISHED, DriveStatus.REGISTRATION_OPEN).allowed).toBe(
        true,
      );
      expect(
        canTransitionDrive(DriveStatus.REGISTRATION_OPEN, DriveStatus.REGISTRATION_CLOSED).allowed,
      ).toBe(true);
      expect(
        canTransitionDrive(DriveStatus.REGISTRATION_CLOSED, DriveStatus.IN_PROGRESS).allowed,
      ).toBe(true);
      expect(canTransitionDrive(DriveStatus.IN_PROGRESS, DriveStatus.COMPLETED).allowed).toBe(true);
    });

    it('allows reopening registration from closed', () => {
      expect(
        canTransitionDrive(DriveStatus.REGISTRATION_CLOSED, DriveStatus.REGISTRATION_OPEN).allowed,
      ).toBe(true);
    });

    it('allows cancellation from active statuses', () => {
      expect(canTransitionDrive(DriveStatus.DRAFT, DriveStatus.CANCELLED).allowed).toBe(true);
      expect(canTransitionDrive(DriveStatus.PUBLISHED, DriveStatus.CANCELLED).allowed).toBe(true);
      expect(canTransitionDrive(DriveStatus.REGISTRATION_OPEN, DriveStatus.CANCELLED).allowed).toBe(
        true,
      );
      expect(canTransitionDrive(DriveStatus.IN_PROGRESS, DriveStatus.CANCELLED).allowed).toBe(true);
    });

    it('blocks transitions from terminal states', () => {
      expect(canTransitionDrive(DriveStatus.COMPLETED, DriveStatus.IN_PROGRESS).allowed).toBe(
        false,
      );
      expect(canTransitionDrive(DriveStatus.CANCELLED, DriveStatus.DRAFT).allowed).toBe(false);
    });
  });

  describe('evaluateEligibility', () => {
    const fixedNow = new Date('2026-10-15T10:00:00Z');
    const futureDeadline = new Date('2026-10-20T10:00:00Z');
    const pastDeadline = new Date('2026-10-10T10:00:00Z');

    const baseStudent = {
      id: 'student-1',
      status: 'ACTIVE',
      cgpa: 8.5,
      activeBacklogs: 0,
      degree: Degree.BTECH,
      batchYear: 2027,
      branchId: 'branch-cse',
    };

    const baseDrive = {
      id: 'drive-1',
      category: DriveCategory.REGULAR,
      status: DriveStatus.REGISTRATION_OPEN,
      registrationDeadline: futureDeadline,
    };

    it('evaluates an eligible student as fully eligible', () => {
      const criteria = {
        minCgpa: 7.5,
        maxActiveBacklogs: 0,
        allowedDegrees: [Degree.BTECH],
        allowedBatchYears: [2027],
        allowedBranchIds: ['branch-cse', 'branch-ece'],
      };
      const result = evaluateEligibility(baseStudent, baseDrive, criteria, { now: fixedNow });
      expect(result.eligible).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('rejects inactive students', () => {
      const student = { ...baseStudent, status: 'PENDING_APPROVAL' };
      const res = evaluateEligibility(student, baseDrive, {}, { now: fixedNow });
      expect(res.eligible).toBe(false);
      expect(res.reasons).toContain('Student account is not active.');
    });

    it('rejects drives that are not open for registration', () => {
      const closedDrive = { ...baseDrive, status: DriveStatus.REGISTRATION_CLOSED };
      const res = evaluateEligibility(baseStudent, closedDrive, {}, { now: fixedNow });
      expect(res.eligible).toBe(false);
      expect(res.reasons).toContain('Registration for this drive is closed.');
    });

    it('rejects drives whose registration deadline has passed', () => {
      const expiredDrive = { ...baseDrive, registrationDeadline: pastDeadline };
      const res = evaluateEligibility(baseStudent, expiredDrive, {}, { now: fixedNow });
      expect(res.eligible).toBe(false);
      expect(res.reasons).toContain('Registration deadline has passed.');
    });

    it('rejects already registered students', () => {
      const res = evaluateEligibility(
        baseStudent,
        baseDrive,
        {},
        {
          now: fixedNow,
          isRegistered: true,
        },
      );
      expect(res.eligible).toBe(false);
      expect(res.reasons).toContain('Student is already registered for this drive.');
    });

    describe('CGPA and Backlog Boundary Rules', () => {
      it('treats minCgpa as an inclusive boundary', () => {
        const criteria = { minCgpa: 8.5 };
        // Exactly equal to cutoff
        expect(
          evaluateEligibility({ ...baseStudent, cgpa: 8.5 }, baseDrive, criteria, { now: fixedNow })
            .eligible,
        ).toBe(true);

        // Below cutoff
        const fail = evaluateEligibility({ ...baseStudent, cgpa: 8.49 }, baseDrive, criteria, {
          now: fixedNow,
        });
        expect(fail.eligible).toBe(false);
        expect(fail.reasons[0]).toContain('below the required minimum');

        // Null cutoff -> eligible
        expect(
          evaluateEligibility(
            { ...baseStudent, cgpa: 5.0 },
            baseDrive,
            { minCgpa: null },
            { now: fixedNow },
          ).eligible,
        ).toBe(true);
      });

      it('treats maxActiveBacklogs as an inclusive boundary', () => {
        const criteria = { maxActiveBacklogs: 1 };
        // Exactly equal to max
        expect(
          evaluateEligibility({ ...baseStudent, activeBacklogs: 1 }, baseDrive, criteria, {
            now: fixedNow,
          }).eligible,
        ).toBe(true);

        // Above max
        const fail = evaluateEligibility(
          { ...baseStudent, activeBacklogs: 2 },
          baseDrive,
          criteria,
          { now: fixedNow },
        );
        expect(fail.eligible).toBe(false);
        expect(fail.reasons[0]).toContain('exceed maximum allowed');

        // Null max -> eligible
        expect(
          evaluateEligibility(
            { ...baseStudent, activeBacklogs: 5 },
            baseDrive,
            { maxActiveBacklogs: null },
            { now: fixedNow },
          ).eligible,
        ).toBe(true);
      });
    });

    describe('Degree, Batch, and Branch Rules', () => {
      it('rejects disallowed degrees', () => {
        const res = evaluateEligibility(
          { ...baseStudent, degree: Degree.MCA },
          baseDrive,
          { allowedDegrees: [Degree.BTECH] },
          { now: fixedNow },
        );
        expect(res.eligible).toBe(false);
        expect(res.reasons[0]).toContain("Degree 'MCA' is not eligible");
      });

      it('rejects disallowed batch years', () => {
        const res = evaluateEligibility(
          { ...baseStudent, batchYear: 2026 },
          baseDrive,
          { allowedBatchYears: [2027, 2028] },
          { now: fixedNow },
        );
        expect(res.eligible).toBe(false);
        expect(res.reasons[0]).toContain('Batch year (2026) is not eligible');
      });

      it('rejects disallowed branches and allows all branches if array is empty or null', () => {
        const resMismatch = evaluateEligibility(
          { ...baseStudent, branchId: 'branch-mech' },
          baseDrive,
          { allowedBranchIds: ['branch-cse', 'branch-ece'] },
          { now: fixedNow },
        );
        expect(resMismatch.eligible).toBe(false);
        expect(resMismatch.reasons[0]).toContain('Branch is not included');

        const resAll = evaluateEligibility(
          { ...baseStudent, branchId: 'branch-mech' },
          baseDrive,
          { allowedBranchIds: [] },
          { now: fixedNow },
        );
        expect(resAll.eligible).toBe(true);
      });
    });

    describe('Institutional One-Offer Policy', () => {
      it('allows application when one-offer policy is not enforced', () => {
        const res = evaluateEligibility(
          baseStudent,
          { ...baseDrive, category: DriveCategory.REGULAR },
          {},
          {
            now: fixedNow,
            enforceOneOfferPolicy: false,
            existingOffers: [{ driveId: 'other-drive', category: DriveCategory.REGULAR }],
          },
        );
        expect(res.eligible).toBe(true);
      });

      it('enforces tier upgrade requirement when one-offer policy is active', () => {
        // Holding a REGULAR offer, applying to REGULAR -> blocked
        const sameTier = evaluateEligibility(
          baseStudent,
          { ...baseDrive, category: DriveCategory.REGULAR },
          {},
          {
            now: fixedNow,
            enforceOneOfferPolicy: true,
            existingOffers: [{ driveId: 'd1', category: DriveCategory.REGULAR }],
          },
        );
        expect(sameTier.eligible).toBe(false);
        expect(sameTier.reasons[0]).toContain('Under the institutional one-offer policy');

        // Holding a REGULAR offer, applying to MASS_RECRUITER -> blocked
        const lowerTier = evaluateEligibility(
          baseStudent,
          { ...baseDrive, category: DriveCategory.MASS_RECRUITER },
          {},
          {
            now: fixedNow,
            enforceOneOfferPolicy: true,
            existingOffers: [{ driveId: 'd1', category: DriveCategory.REGULAR }],
          },
        );
        expect(lowerTier.eligible).toBe(false);

        // Holding a REGULAR offer, applying to DREAM -> allowed
        const higherTier = evaluateEligibility(
          baseStudent,
          { ...baseDrive, category: DriveCategory.DREAM },
          {},
          {
            now: fixedNow,
            enforceOneOfferPolicy: true,
            existingOffers: [{ driveId: 'd1', category: DriveCategory.REGULAR }],
          },
        );
        expect(higherTier.eligible).toBe(true);

        // Holding a SUPER_DREAM offer cannot apply to anything
        const topTier = evaluateEligibility(
          baseStudent,
          { ...baseDrive, category: DriveCategory.SUPER_DREAM },
          {},
          {
            now: fixedNow,
            enforceOneOfferPolicy: true,
            existingOffers: [{ driveId: 'd1', category: DriveCategory.SUPER_DREAM }],
          },
        );
        expect(topTier.eligible).toBe(false);
      });
    });
  });

  describe('Zod Validation Schemas', () => {
    it('validates HTTPS requirement on company logo URL', () => {
      const valid = createCompanySchema.safeParse({
        name: 'Tech Corp',
        logoUrl: 'https://cdn.example.com/logo.png',
      });
      expect(valid.success).toBe(true);

      const invalidHttp = createCompanySchema.safeParse({
        name: 'Tech Corp',
        logoUrl: 'http://cdn.example.com/logo.png',
      });
      expect(invalidHttp.success).toBe(false);
    });

    it('enforces ctcLpaMin <= ctcLpaMax on DriveRole', () => {
      const valid = createDriveRoleSchema.safeParse({
        title: 'SDE',
        ctcLpaMin: 10,
        ctcLpaMax: 15,
      });
      expect(valid.success).toBe(true);

      const invalid = createDriveRoleSchema.safeParse({
        title: 'SDE',
        ctcLpaMin: 20,
        ctcLpaMax: 15,
      });
      expect(invalid.success).toBe(false);
    });

    it('enforces selectedCount <= registeredCount on Drive', () => {
      const valid = createDriveSchema.safeParse({
        companyId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        seasonId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
        title: 'Campus Drive 2026',
        registeredCount: 100,
        selectedCount: 20,
      });
      expect(valid.success).toBe(true);

      const invalid = createDriveSchema.safeParse({
        companyId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        seasonId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
        title: 'Campus Drive 2026',
        registeredCount: 10,
        selectedCount: 20,
      });
      expect(invalid.success).toBe(false);
    });

    it('requires explicit placement sharing consent on drive application', () => {
      const valid = applyDriveSchema.safeParse({ consentGiven: true });
      expect(valid.success).toBe(true);

      const invalid = applyDriveSchema.safeParse({ consentGiven: false });
      expect(invalid.success).toBe(false);
    });
  });
});
