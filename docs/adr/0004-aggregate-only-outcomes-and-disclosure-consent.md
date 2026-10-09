# ADR 0004: Aggregate-Only Outcomes, Small Cohort Masking, and DPDP Disclosure Consent

## Status

Accepted

## Context

Under India's Digital Personal Data Protection Act, 2023 (DPDP Act) and international data protection standards, academic performance, placement outcomes, and compensation packages constitute personal data.

In university environments, two major privacy vulnerabilities occur:

1. **Re-Identification from Small Cohort Statistics**: When a recruiter hires only 1 or 2 students from a batch, displaying "minimum, maximum, or average CTC" directly reveals the exact compensation of known individuals, creating peer pressure and violating confidential compensation non-disclosure clauses.
2. **Unconsented Third-Party Data Transmission**: Sharing student resumes, academic transcripts, and contact details with visiting recruiters without verifiable, affirmative, unbundled consent exposes the university to significant statutory liability under DPDP 2023.

## Decision

1. **Small Cohort Privacy Threshold (`MIN_COHORT_FOR_STATS = 3`)**:
   - In all placement intelligence endpoints (`GET /intelligence/recruiters`, `GET /intelligence/recruiters/:id`), salary metrics are dynamically masked when the total number of placed students is less than 3.
   - When `placedCount < 3`:
     - `salaryMetrics.masked = true`
     - `minCtcLpa = null`, `maxCtcLpa = null`, `avgCtcLpa = null`
     - Response includes explicit disclosure message: `"Salary statistics hidden to preserve student privacy (cohort size < 3)"`.
   - General hiring facts (e.g. appearance in season, round pattern count, selection rate) are retained while individual-identifiable financial information is shielded.

2. **Mandatory DPDP Consent on Application (`ConsentType.PLACEMENT_SHARING`)**:
   - Applying to a recruitment drive requires student affirmative consent via an interactive modal before submission.
   - System records the consent in the immutable `consent_records` table:
     - `userId`: Authoritative student ID
     - `driveId`: Target recruitment drive
     - `consentType`: `PLACEMENT_SHARING`
     - `policyVersion`: `'1.0'`
     - `userAgent` / `ipAddress`: Captured for audit verification
   - Enforced inside an atomic transaction alongside `DriveApplication` creation.

3. **Anonymized Peer Experience Archives**:
   - Senior students sharing interview retrospectives can toggle `isAnonymous = true`.
   - For all peer student readers, the backend strips the student's name, email, and enrollment number, projecting them as `"Anonymous Senior"`.
   - Only non-identifying institutional facts (branch name, batch year, interview round breakdown, difficulty rating) are published.

## Consequences

- **Positive**: Complete legal compliance with DPDP 2023 consent mandates; zero leakage of individual student CTC figures; safe peer-to-peer knowledge sharing.
- **Trade-off**: Placement cells cannot view granular compensation percentiles for boutique or low-intake recruiters in public aggregate dashboards (though administrators retain access to individual application offer records).
