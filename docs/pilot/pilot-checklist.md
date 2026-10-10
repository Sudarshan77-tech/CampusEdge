# CampusEdge — 14-Day Institutional Pilot Runbook & Checklist

## Pre-Launch Setup (Days T-3 to T-1)

- [ ] Verify College Admin account provisioned with authoritative `COLLEGE_ADMIN` role.
- [ ] Configure college institutional settings (email domain whitelist, one-offer policy).
- [ ] Ingest historical placement data (last 2–3 seasons) via the CSV import pipeline.
- [ ] Bulk import candidate batch via `docs/pilot/sample-student-cohort.csv`.
- [ ] Confirm baseline question bank contains >= 400 active, verified questions across aptitude and CS fundamentals.

## Phase 1: Candidate Activation & Diagnostic Administration (Days 1–4)

- [ ] Send activation invitation emails with login instructions and DPDP consent link.
- [ ] Monitor student onboarding and DPDP Act consent executions at `/placement-cell/audit`.
- [ ] Administer the 60-Minute Diagnostic Baseline Assessment across the cohort.
- [ ] Monitor live completion and proctoring events at `/placement-cell/tests`.
- [ ] Verify all student in-attempt responses have zero answer key leakage.

## Phase 2: Readiness Intelligence & TPO Review (Days 5–7)

- [ ] Inspect aggregate readiness distribution at `/placement-cell/readiness`.
- [ ] Verify ADR 0004 differential privacy masking for sub-cohorts < 3 students.
- [ ] Review curriculum topic heatmap to identify college-wide weak areas.
- [ ] Schedule targeted faculty workshops or remedial sessions for topics with < 40% mastery.

## Phase 3: Personalized 28-Day Roadmap Sprints (Days 8–12)

- [ ] Students commence daily deliberate practice routines at `/student/roadmap`.
- [ ] Track task completion rates and consistency scores.
- [ ] Students participate in timed practice sets to boost topic mastery levels.

## Phase 4: Mock Placement Drive & Shortlisting (Days 13–14)

- [ ] Create a simulated company campus recruitment drive at `/placement-cell/drives/new`.
- [ ] Evaluate candidate eligibility based on branch, CGPA, and one-offer status.
- [ ] Administer company-specific mock assessment.
- [ ] Download DPDP-compliant ranked candidate shortlisting CSV with logged institutional purpose.
- [ ] Conduct pilot retrospective with institutional leadership and student coordinators.
