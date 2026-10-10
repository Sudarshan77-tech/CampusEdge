# CampusEdge — Pilot College Operational Runbook

## 1. Objectives & Scope

This runbook governs the deployment, onboarding, operational execution, and monitoring for the initial institutional pilot at Apex Institute of Technology (and subsequent partner institutions).

---

## 2. Onboarding Steps for the Pilot College

### Step 1: College Tenant Creation

- Super Admin registers college record via `POST /api/v1/colleges` or admin UI `/admin/colleges`.
- Configures legal name, institutional code (`APEX`), and default address.

### Step 2: Placement Officer Invitation

- Provision initial College Admin account for Training & Placement Officer (TPO) with authoritative `COLLEGE_ADMIN` role.
- Send invitation token / setup link to official email address (`placement.admin@apex.edu`).

### Step 3: Domain Whitelist & Approval Policy

- Configure permitted email domain whitelist (e.g. `apex.edu`).
- Select student approval policy:
  - Auto-activation for verified `@apex.edu` addresses.
  - Optional manual TPO approval gate before placement drive access.
- Configure institutional One-Offer Policy.

### Step 4: Historical Data Ingestion

- Upload past 2–3 recruitment seasons via `/placement-cell/import`.
- Map past company names using fuzzy resolution engine.
- Verify historical package trends and placement statistics.

### Step 5: Candidate Batch Onboarding

- Bulk ingest candidate roster using standard CSV format (`docs/pilot/sample-student-cohort.csv`).
- Trigger automated student invitation emails.

---

## 3. Internal Dry-Run (5–10 Test Students)

1. Select 5–10 student coordinators across branches (CSE, ECE, MECH).
2. Execute student onboarding and digital DPDP consent acceptance.
3. Test candidates initiate and complete the 60-Minute Diagnostic Baseline Assessment.
4. Verify:
   - Option orders are randomized via PRNG seed.
   - Zero early leakage of answer keys during active test session.
   - Timer auto-finalizes upon expiration.
   - Scores calculate deterministically and update topic masteries.
   - 28-day preparation roadmaps generate with daily task scheduling.

---

## 4. Load Rehearsal & Capacity Benchmarking

- Synthetic concurrency benchmark (`pnpm perf:attempts`) verifies server response times under peak exam load:
  - Attempt submission latency: $< 150\text{ms}$ at p95.
  - Active answer saves: $< 80\text{ms}$ at p95.
  - Background sweeper auto-submits expired tests every 60 seconds without locking the table.

---

## 5. Go-Live Day Checklist

- [ ] **08:00 AM**: Verify database connections and Cloud Run service health (`GET /health`).
- [ ] **09:00 AM**: Issue announcement circular and schedule notification via `/placement-cell/notices`.
- [ ] **10:00 AM**: Diagnostic test window opens.
- [ ] **Live Monitoring**: TPO monitors live attendance and integrity flags at `/placement-cell/tests`.
- [ ] **12:00 PM**: Window closes. Inspect aggregate readiness bands at `/placement-cell/readiness`.
- [ ] **Privacy Check**: Confirm differential privacy masking applies to cohorts $< 3$ students.

---

## 6. Support Channel, Escalation Matrix & SLA

| Tier                            | Contact                          | SLA                          | Scope                                    |
| :------------------------------ | :------------------------------- | :--------------------------- | :--------------------------------------- |
| **L1 (Student Support)**        | `support@campusedge.internal`    | < 15 mins during exam        | Login issues, network disconnects        |
| **L2 (TPO / Institutional)**    | `tpo-desk@campusedge.internal`   | < 1 hour                     | Schedule modifications, candidate roster |
| **L3 (Engineering & Security)** | `eng-oncall@campusedge.internal` | < 5 mins (Critical incident) | Service outages, database failover       |
| **DPO (Data Protection)**       | `dpo@campusedge.internal`        | < 24 hours                   | DPDP compliance, candidate data requests |

---

## 7. Rollback Plan

If critical defects or infrastructure failure occurs:

1. **Frontend / API Rollback**: Instant Google Cloud Run traffic diversion to previous stable revision:
   ```bash
   gcloud run services update-traffic campusedge-api --to-revisions PREVIOUS=100 --region asia-south1
   gcloud run services update-traffic campusedge-web --to-revisions PREVIOUS=100 --region asia-south1
   ```
2. **Student Session Protection**: In-progress candidate answers are saved atomically per question; no candidate answers are lost during rolling restarts.

---

## 8. Known Limitations List (Pilot Scope)

1. **AI Simulation Layer**: Google Gemini interview simulations and resume parsing are scheduled for Phase 6; Phase 3 pilot scoring is 100% deterministic rule-based algorithms.
2. **Coding Sandbox**: Multi-language code compiler (Judge0) is scheduled for Phase 5; technical items currently cover conceptual CS MCQs and code analysis.
3. **Differential Privacy Masking**: Demographic breakdowns for $< 3$ candidates are masked under ADR 0004 to preserve privacy.

---

## 9. Success Metrics & KPIs

- **Diagnostic Completion Rate**: $\ge 85\%$ of enrolled candidates complete the diagnostic within 14 days of invitation.
- **Weekly Practice Engagement**: $\ge 3$ practice sessions per active candidate per week.
- **Readiness Score Coverage**: $100\%$ of active candidates receive an authoritative readiness band and 28-day preparation roadmap.
- **System Uptime & Reliability**: $99.9\%$ platform availability during scheduled testing windows.
