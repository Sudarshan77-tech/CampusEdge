# ADR 0005: Immutable Question Versions and Authoritative Server Clock for Assessments

## Status

Accepted

## Context

Assessment integrity is paramount for institutional credibility. Two critical vulnerabilities frequently plague online placement assessment systems:

1. **Content Mutation During/After Attempts**: If a question is edited to fix a typo or answer key while students are taking tests or reviewing results, historical attempts become invalidated, score calculations shift retrospectively, and student grievances escalate.
2. **Client-Side Clock Tampering & Late Submissions**: Relying on client clocks or trusting client-submitted timestamps enables tampering, script injection, and late submissions.

## Decision

1. **Question Version Immutability**:
   - Split question identity from content representation: `Question` holds mutable lifecycle metadata (status, review flags, tags, statistics), while `QuestionVersion` stores actual assessment content (stem, options, explanation, numeric answer).
   - Once inserted, a `QuestionVersion` record is immutable. A PostgreSQL database trigger strictly forbids `UPDATE` and `DELETE` on `question_versions`.
   - Editing a question always creates a new version (`version = n + 1`).
   - Every `AttemptItem` strictly foreign-keys both `question_id` and `version_id`, guaranteeing that every attempt retains exact forensic reproducibility.
2. **Authoritative Server Clock**:
   - The test server sets `deadline_at` at the moment of attempt creation based on `template.duration_minutes`.
   - The server rejects any answers received past `deadline_at + GRACE_PERIOD_MS (5000ms)`.
   - Client countdown timers are display-only and re-synchronize against server `remaining_ms`.
   - Attempts are auto-finalized lazily upon any subsequent access or via scheduled sweeper workers.

## Consequences

- Total auditability and forensic reproducibility for every student assessment and grievance.
- Zero possibility of retroactive answer-key tampering altering existing scores.
- Resilient defense against network latency issues and client-side clock tampering.
