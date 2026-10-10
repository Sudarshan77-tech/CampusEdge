# CampusEdge — Placement Officer Quick Start Guide (One-Page)

## 1. Initial College Setup

1. Log in with your institutional administrator email at `/login`.
2. Navigate to `/placement-cell/settings` and verify:
   - Permitted student email domains (e.g. `apex.edu`).
   - One-Offer policy preference.
   - Student approval workflow (auto-activate or manual gate).

---

## 2. Onboarding Student Cohorts

1. Go to `/placement-cell/import`.
2. Prepare candidate data using the standard CSV template (`docs/pilot/sample-student-cohort.csv`).
3. Upload and commit the batch. The system auto-validates emails, branches, CGPA, and blocks CSV formula injection.
4. Track student activation and DPDP consent acceptance at `/placement-cell/audit`.

---

## 3. Monitoring Diagnostic Assessments

1. Announce testing dates via `/placement-cell/notices`.
2. Diagnostic assessments feature:
   - 45 items, 60 minutes.
   - PRNG option shuffling and zero answer key leakage on student clients.
   - Tab blur / fullscreen exit proctoring event logger.
3. Monitor real-time completion status and integrity flags at `/placement-cell/tests`.

---

## 4. Reading Cohort Readiness Intelligence

1. Access `/placement-cell/readiness` to view:
   - **4 Readiness Bands**: Strong (80–100), Competitive (60–79), Building (40–59), Getting Started (<40).
   - **Curriculum Heatmap**: Average topic scores across batches and branches to spot weak areas for workshops.
   - **Privacy Shield (ADR 0004)**: Automatic masking of sub-cohorts $< 3$ students to comply with the DPDP Act.

---

## 5. Candidate Shortlisting & DPDP Export

1. View candidate rankings for scheduled drives.
2. At `/placement-cell/tests`, click **Download Results CSV**.
3. Specify your institutional purpose (e.g., _"TCS Digital Shortlisting"_).
4. System downloads a cryptographic CSV with candidate scores and logs the audit purpose into the immutable ledger.

---

## 6. Escalation & Contact

- Institutional TPO Helpline: `tpo-desk@campusedge.internal`
- Data Protection Officer: `dpo@campusedge.internal`
