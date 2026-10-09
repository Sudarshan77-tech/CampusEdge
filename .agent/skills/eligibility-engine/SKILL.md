---
name: eligibility-engine
description: Architecture, multi-factor rules, failure reason aggregation, and institutional one-offer policy enforcement in the CampusEdge eligibility engine.
---

# CampusEdge Eligibility Engine

The Eligibility Engine evaluates whether a student qualifies to register for and participate in a campus recruitment drive. It enforces academic criteria, degree/branch requirements, and institutional placement policies.

## 1. Architecture & Design Principles

### Pure Shared Evaluation

To eliminate discrepancies between what students see in the UI and what the backend enforces at application time:

- The core evaluation function `evaluateEligibility` is implemented in `@campusedge/shared/src/eligibility-engine.ts`.
- It is deterministic, stateless, and has zero external database or network dependencies.
- It is thoroughly unit-tested across all edge cases (missing criteria, partial criteria, exact threshold matches).

### Multi-Factor Evaluation Rules

A student must satisfy all configured criteria on the drive's `DriveEligibility` record:

1. **Academic Cutoff (CGPA)**:
   - If `minCgpa` is configured, student's `cgpa` must be `>= minCgpa`.
   - Floating-point discrepancies are eliminated by converting values to numeric numbers before comparison.
2. **Backlog Clearance**:
   - If `maxActiveBacklogs` is configured, student's `activeBacklogs` must be `<= maxActiveBacklogs`.
3. **Disciplinary & Branch Scoping**:
   - If `eligibleBranchIds` is configured and non-empty, student's `branchId` must be in the allowed list.
4. **Academic Program & Degree**:
   - If `allowedDegrees` is non-empty, student's `degree` must match one of the allowed degrees.
5. **Graduation Year / Batch**:
   - If `allowedBatchYears` is non-empty, student's `batchYear` must match one of the allowed batch years.

### Failure Reason Aggregation

The engine does not fail fast; it evaluates all criteria and accumulates all violation reasons:

```typescript
interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
}
```

This guarantees students receive actionable feedback on why they are ineligible (e.g. `['CGPA 7.20 is below minimum required 8.00', '1 active backlogs exceed maximum allowed 0']`).

---

## 2. Institutional One-Offer Policy

Colleges configure placement policies to balance opportunities among students:

- Field: `College.allowMultipleOffers` (Boolean).
- When `allowMultipleOffers = false` (default standard in Indian campus placements):
  - Students who have already secured an offer (`ApplicationStatus.SELECTED`) in the current season are barred from applying to new drives.
  - Exception: Dream / Super Dream policy upgrade rules (configurable in future phases).
- Backend enforcement:
  - Evaluated in `ApplicationsService.apply()` inside an atomic transaction.
  - Queries existing applications for the student across all drives in the current season with status `SELECTED`.
  - Throws `ConflictException('Student has already secured an offer and institutional policy disallows multiple offers')` if violated.

---

## 3. Consent & DPDP Compliance

Eligibility verification precedes consent collection:

1. Student views drive in `/student/drives`.
2. Eligibility engine renders `Eligible` badge or `Not Eligible` with reason tooltip.
3. If eligible, clicking **Apply** triggers the mandatory DPDP Consent Modal.
4. Student confirms consent for sharing academic and profile data with the specific recruiter.
5. `ConsentRecord` is created (`ConsentType.PLACEMENT_SHARING`, policy version `1.0`, user agent) atomically alongside `DriveApplication`.
