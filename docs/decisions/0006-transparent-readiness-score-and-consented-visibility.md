# ADR 0006: Transparent Deterministic Readiness Scoring and Consented Performance Visibility

## Status

Accepted

## Context

Placement readiness calculations are often opaque "black-box" predictions or AI hallucinated numbers that lack defensibility, confuse students, and generate false expectations. Furthermore, institutional placement cells demand visibility into student preparation, yet privacy regulations (DPDP Act 2023) mandate explicit consent before student diagnostic profiles are exposed to institutional authorities.

## Decision

1. **100% Deterministic Transparent Scoring**:
   - Readiness score is explicitly defined as a **preparation and mastery indicator**, NOT a prediction or guarantee of placement.
   - All formulas for scoring (`scoreItem`, `scoreAttempt`), topic mastery (`computeMastery`), and overall readiness (`computeReadiness`) are implemented as pure, deterministic functions in `packages/shared`.
   - AI is strictly prohibited from score evaluation or formula adjustments.
   - Every score is accompanied by a plain-language explanation of components (Aptitude, Technical, Mocks, Consistency), weights, confidence bands, and a mandatory legal disclaimer.
2. **Consented Performance Visibility**:
   - Institutional placement cells may only view individual diagnostic and readiness details if the student has explicitly granted `ConsentType.PERFORMANCE_SHARING`.
   - If consent is not granted, placement cell aggregate dashboards include the student only within anonymized batch statistics (with k-anonymity cohort suppression for cohorts < 5), while individual student records display "Not Shared".
   - Students can grant or withdraw this consent at any time through their settings dashboard.

## Consequences

- High trust and defensibility: students understand exactly why their score changed and which topics need remediation.
- Full compliance with India DPDP Act 2023 data processing and purpose limitation mandates.
- Institutional placement cells gain deep actionable batch analytics without violating student consent boundaries.
