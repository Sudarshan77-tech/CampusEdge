# CampusEdge — Training & Placement Officer (TPO) Playbook

## 1. Executive Summary

CampusEdge is an institutional placement intelligence and readiness platform engineered to elevate campus recruitment outcomes through data-driven diagnostic assessments, deterministic mastery modeling, and automated preparation roadmaps.

This playbook provides step-by-step operating procedures for Training and Placement Officers (TPOs), Faculty Placement Coordinators, and Institutional Administrators during the campus pilot phase.

---

## 2. Institutional Setup & Configuration

### 2.1 Accessing the Placement Cell Portal

1. Navigate to `/login` and authenticate with your institutional administrator credentials.
2. Ensure your account is provisioned with the `COLLEGE_ADMIN` role.
3. Access the primary administration cockpit at `/placement-cell/dashboard`.

### 2.2 College Policies & Safeguards

From the `/placement-cell/settings` view:

- **Authorized Domain Whitelist**: Specify allowed student institutional email domains (e.g. `@apex.edu`). Registrations from unapproved domains are rejected.
- **One-Offer Policy**: Configure whether students with an accepted job offer are automatically disqualified from subsequent recruitment drives.
- **Student Approval Gate**: Enable manual TPO verification before newly registered students can access company drives.

---

## 3. Student Cohort Onboarding & CSV Import

### 3.1 Bulk Import Workflow

1. Navigate to `/placement-cell/import`.
2. Prepare candidate cohort data using the standard CSV template (`docs/pilot/sample-student-cohort.csv`).
3. Upload the file through the drag-and-drop import pipeline.
4. The system validates:
   - Institutional email domain match.
   - CGPA within scale (0.00 – 10.00).
   - Valid branch code (e.g. `CSE`, `ECE`, `MECH`).
   - Formula injection defense (cells starting with `=`, `+`, `-`, or `@` are sanitized).
5. Review the validation summary and commit the batch.

### 3.2 DPDP Act 2023 Consent Verification

- Each enrolled student must digitally execute the statutory DPDP consent agreement upon initial login (`TERMS`, `PRIVACY`, `DATA_PROCESSING`, and `PLACEMENT_SHARING`).
- Unverified students cannot have their candidate records exported to third-party recruiters.

---

## 4. Administering Diagnostic Assessments

### 4.1 Test Blueprint Architecture

The baseline diagnostic evaluation evaluates students across core placement competencies:

- **Engineering / Software Track (45 items, 60 minutes)**:
  - Quantitative Aptitude: 10 items
  - Logical Reasoning: 10 items
  - Verbal Ability: 10 items
  - CS Fundamentals (DSA, DBMS, OS, Networks): 15 items
- **General / Non-Engineering Track (45 items, 60 minutes)**:
  - Quantitative Aptitude: 15 items
  - Logical Reasoning: 15 items
  - Verbal Ability: 15 items

### 4.2 Proctoring Controls & Anti-Cheat Safeguards

- **PRNG Option Randomization**: Question choice orders are pseudo-randomly permuted per attempt using a deterministic seed.
- **Zero Early Leakage**: Correct answer keys and explanations are stripped at the API layer until test submission.
- **Integrity Event Logging**: Browser tab switches (`TAB_BLUR`) and fullscreen exits are logged with microsecond timestamps.
- **Server-Authoritative Clock**: Attempts auto-finalize at deadline expiry regardless of local client clock tampering.

---

## 5. Interpreting the Readiness Cockpit

Navigate to `/placement-cell/readiness` to inspect real-time cohort distribution:

### 5.1 The Four Readiness Bands

- **Strong (80 – 100)**: Consistently high mastery across aptitude and core technical domains. Ready for premium/Tier-1 recruiter drives.
- **Competitive (60 – 79)**: Solid foundational grasp with moderate speed. High probability of clearing standard mass and dream drive rounds.
- **Building (40 – 59)**: Developing competencies; requires structured practice in identified weak topics.
- **Getting Started (< 40)**: Baseline diagnostic incomplete or fundamental conceptual gaps present.

### 5.2 Differential Privacy Safeguards (ADR 0004)

- When filtering cohorts by branch or graduation batch, cohorts with **fewer than 3 students** are automatically masked.
- This prevents identifying individual student scores through demographic deduction, ensuring strict compliance with institutional privacy standards.

---

## 6. Placement Drive Management & Candidate Export

### 6.1 Creating a Company Drive

1. Navigate to `/placement-cell/drives/new`.
2. Select target recruiter, minimum CGPA cutoff, permitted branches, and maximum active backlogs.
3. Schedule interview rounds and attach test schedules.

### 6.2 Attendance Monitoring & DPDP CSV Export

1. Navigate to `/placement-cell/tests`.
2. Enter the active schedule UUID to monitor live completion rates.
3. Click **Download Results CSV**.
4. Enter the explicit institutional purpose (e.g., _"Shortlisting for TCS Digital Campus Drive"_).
5. The download generates a cryptographically audited CSV with candidate rankings while logging the purpose into the immutable audit ledger.

---

## 7. Pilot Support & Escalation Matrix

- **Platform Technical Support**: `support@campusedge.internal`
- **Data Protection Officer (DPO)**: `dpo@campusedge.internal`
- **Grievance Redressal**: Accessible at `/grievance` for statutory candidate dispute filings.
