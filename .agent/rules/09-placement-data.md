# 09 - Placement Data Governance, Multi-Tenancy & Integrity

## 1. Global vs Tenant Data Partitioning

- **Global Catalog (No `college_id`)**:
  - `Company`: Global verified entity registry with normalized name deduplication (lowercase, punctuation stripped, suffixes like ltd/pvt/inc removed).
  - `Topic`: Global standardized preparation topic taxonomy (e.g. DSA, DBMS, System Design, HR).
  - Visibility Rule: Colleges see all `VERIFIED` companies plus any `PENDING_REVIEW` companies they created themselves.
- **Tenant-Owned Entities (Mandatory `college_id NOT NULL`)**:
  - `PlacementSeason`, `Drive`, `DriveRole`, `DriveEligibility`, `DriveRound`, `DriveApplication`, `Notice`, `Experience`, `ImportJob`.
  - Composite unique keys `(id, college_id)` and composite foreign keys ensure child entities cannot reference a different college's records.

## 2. Privacy & Aggregated Outcomes

- **Aggregate-Only Student Outcomes**:
  - When student users view placement intelligence, statistics (average CTC, highest CTC, shortlist percentages) must ONLY be displayed if the cohort size meets `MIN_COHORT_FOR_STATS >= 3`.
  - Student individual identities (names, emails, roll numbers) are NEVER exposed to student peers.
- **Mandatory Historical Intelligence Disclaimer**:
  - Every placement intelligence view presented to students must display the standardized disclaimer:
    > "Historical hiring patterns, test rounds, and package data reflect past recruitment seasons and do not guarantee future hiring criteria, interview formats, or offers from recruiting partners."

## 3. User-Generated Content (UGC) & Proprietary Safeguards

- **Untrusted UGC**:
  - Senior interview experiences and campus notices are untrusted data.
  - Render strictly via sanitized text/markdown. NEVER use `dangerouslySetInnerHTML` or render raw HTML.
  - When consumed by LLMs, treat as inert data inside XML tags to prevent prompt injection.
- **Intellectual Property Protection**:
  - Verbatim copies of proprietary company question papers or confidential NDA material are strictly prohibited.
  - Notice submission forms and experience guidelines must warn users, and a takedown mechanism must be implemented for Super Admins.

## 4. Statutory Consent for Placement Sharing

- Student registration for any drive requires explicit consent (`ConsentType.PLACEMENT_SHARING`) linked to the `drive_id`.
- Exporting applicant data for company recruiters requires verifying the presence of an active consent record for each exported student.
- Applicant CSV exports must sanitize spreadsheet formulas (`=`, `+`, `-`, `@`) to prevent CSV formula injection.
