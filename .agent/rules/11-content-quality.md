# 11 - Question Content Quality, Integrity & Review Standards

## 1. Originality & Intellectual Property

- All starter and catalog questions MUST be 100% original content authored specifically for CampusEdge.
- Verbatim copying, unauthorized paraphrasing, or scraping from commercial question banks, proprietary recruitment test papers, or copyrighted books is strictly prohibited.
- Every question record tracks provenance: `source` (`ORIGINAL_SEED`, `AUTHORED`, `IMPORTED`, `LICENSED`), `license_note`, and normalized text stem hash (`text_hash`) for duplicate suppression.

## 2. Review Gate & Approval Lifecycle

- **Statuses**: `DRAFT` -> `IN_REVIEW` -> `APPROVED` -> `RETIRED` | `FLAGGED`.
- Questions authored with `GLOBAL` scope require explicit human review by a Super Admin (`reviewed_by`, `reviewed_at`) before entering the active assessment pool.
- College Admin questions (`COLLEGE` scope) belong solely to the tenant institution and may be self-approved by the authoring college admin for institutional tests.
- **Production Gate (`REQUIRE_HUMAN_REVIEWED_QUESTIONS`)**: In production mode, the test selection engine only selects questions with `reviewed_by IS NOT NULL`.

## 3. Duplicate Prevention & Quality Audits

- **Exact Hash**: Stems are normalized (lowercase, punctuation stripped, whitespace collapsed) and hashed with SHA-256. Exact duplicates are rejected on create.
- **Trigram Similarity**: A PostgreSQL GIN trigram index on normalized stems provides fuzzy match suggestions during authoring to alert reviewers of highly similar questions (similarity > 0.8).
- **Auto-Flagging Threshold**: If a question receives >= 3 distinct student reports (`QuestionReport`), it is automatically transitioned to `FLAGGED` status and sequestered from new attempt generation until reviewed.
- **Empirical Difficulty Audits**: Periodic statistical jobs monitor attempt accuracy. Questions with accuracy < 10% or > 98% after >= 30 attempts are flagged for author review.

## 4. Rich Content & Mathematical Formatting

- Math formulas and quantitative expressions must be formatted strictly in KaTeX math syntax (`$...$` inline, `$$...$$` display).
- Mathematical notation rendering must enforce `trust: false` with zero raw HTML or unsafe injection.
- Images in questions/explanations must be stored in secure private storage buckets and served via short-lived signed URLs.
