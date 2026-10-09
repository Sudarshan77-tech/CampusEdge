# 10 - Assessment Integrity & Test Security Architecture

## 1. Zero Early Information Leakage

- **Core Invariant**: Answer keys (`is_correct`), correct option selections, numeric answers, and question explanations are **NEVER** transmitted to a student client before the attempt is submitted and the schedule's `results_release` policy permits it.
- In-attempt API endpoints (`GET /attempts/:id`, `GET /attempts/:id/questions/:pos`, `PUT /attempts/:id/answers/:pos`) MUST use sanitized response DTOs that physically omit:
  - `is_correct`
  - `explanation`
  - `correctOptionIds`
  - `numericAnswer`
  - `numericTolerance`
- **Practice Exception**: In self-paced `PRACTICE` mode only, immediate feedback (`is_correct`, `explanation`) is returned upon individual answer submission for rapid learning, but NEVER in `DIAGNOSTIC`, `MOCK`, or `COLLEGE_TEST` modes.
- **Automated Contract Enforcement**: CI and the test suite must execute an automated contract test scanning every student-facing response payload during an ongoing attempt to guarantee zero leakage.

## 2. Authoritative Server Clock & Deadline Enforcement

- **Clock Authority**: All attempt durations, deadlines, and submission timestamps are determined strictly by the backend server clock (`deadline_at = started_at + duration_minutes`).
- **Client Countdown**: The frontend timer is display-only, initialized and re-synchronized from the server-calculated `remaining_ms`.
- **Grace Period**: Answers received after `deadline_at + 5 seconds` grace period are rejected with HTTP 409 Conflict.
- **Lazy Finalization**: Any read or write request against an `IN_PROGRESS` attempt past its deadline + grace period automatically transitions the attempt to `AUTO_SUBMITTED` under a database transaction lock (`SELECT ... FOR UPDATE`).
- **Sweeper Worker**: A secure background sweep endpoint (`POST /internal/attempts/finalize-expired`) finalizes any abandoned attempts whose grace period has expired.

## 3. Question Versioning & Immutability

- Questions are versioned (`QuestionVersion`). Once created, a `QuestionVersion` record is **IMMUTABLE**.
- A PostgreSQL database trigger strictly blocks `UPDATE` and `DELETE` operations on `QuestionVersion` rows.
- Edits to question stems, options, or explanations produce a new version (`version + 1`). Ongoing and submitted attempts reference the exact immutable `version_id` served to the student.

## 4. Deterministic Scoring & No AI in Evaluation

- Scoring (`scoreItem`, `scoreAttempt`), topic mastery (`computeMastery`), and readiness score (`computeReadiness`) are **100% deterministic pure functions** located in `packages/shared`.
- Evaluation NEVER involves AI or probabilistic models.
- Formula versions (`FORMULA_VERSION = '1.0.0'`) and calculation parameters are version-tracked in database records for auditability and reproducibility.
- Every student readiness score must display the legal disclaimer emphasizing preparation metrics over placement guarantees.
