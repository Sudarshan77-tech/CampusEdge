# CampusEdge — Production Deployment & Smoke Testing Runbook

## 1. Overview & Cloud Run Architecture

CampusEdge is architected for deployment on Google Cloud Run in the `asia-south1` (Mumbai, India) region to ensure ultra-low latency across Indian campuses and statutory compliance with the **Digital Personal Data Protection (DPDP) Act 2023**.

---

## 2. Remote Safety Guardrails

To prevent accidental data corruption or schema mutations on live databases:

1. **Ad-hoc Remote Scripts Restriction**:
   - Remote maintenance scripts check `ALLOWED_REMOTE_PROJECT_REFS`.
   - The production Supabase project ref must **NEVER** be listed in `ALLOWED_REMOTE_PROJECT_REFS`.
   - Ad-hoc scripts targeting the production reference immediately terminate with exit code 1.
2. **Authorized Deployment Pathway**:
   - Production database migrations run **only** through the automated GitHub Actions CI/CD deployment pipeline.
   - Deployments to the `production` environment require explicit manual reviewer approval via the GitHub Actions environment gate.

---

## 3. GitHub Actions Continuous Deployment Workflow

The deployment workflow (`.github/workflows/deploy.yml`):

1. **Trigger**: Push to `main` branch or manual `workflow_dispatch`.
2. **Build & Test Stage**:
   - Lints, typechecks, and runs all 191+ test suites.
   - Builds containerized Docker images for `apps/web` and `apps/api`.
3. **Manual Approval Gate**:
   - Pauses execution until designated administrators approve the deployment in GitHub's environment settings.
4. **Migration Stage**:
   - Runs `prisma migrate deploy` from terminal against the managed database pooler.
5. **Rollout Stage**:
   - Deploys new revisions to Google Cloud Run with zero downtime blue/green traffic shifting.
6. **Synthetic Smoke Stage**:
   - Executes `scripts/production-smoke-test.ts` against the live URLs.

---

## 4. Post-Deployment Smoke Verification Protocol

Run the synthetic verification suite from terminal:

```bash
API_URL=https://api.campusedge.internal WEB_URL=https://campusedge.internal tsx scripts/production-smoke-test.ts
```

### 4.1 Automated Health Checks

- [ ] `GET /health`: API returns HTTP 200 with `{ "status": "ok" }`.
- [ ] `GET /`: Next.js web application renders homepage within 500ms.
- [ ] `GET /privacy`: DPDP Privacy Policy renders with statutory disclosures.
- [ ] `GET /terms`: Terms of Service renders with institutional guidelines.
- [ ] `GET /status`: System uptime dashboard indicates operational components.
- [ ] `GET /login`: Supabase Auth client initializes without client-side exceptions.

### 4.2 Core Feature Smoke Walkthrough

- [ ] **Student Diagnostic Flow**:
  - Authenticate as demo candidate.
  - Verify `/student/diagnostics` presents the 45-question blueprint.
  - Verify in-progress attempt payloads contain zero answer keys (`assertNoAnswerLeakage`).
  - Submit attempt; verify readiness score updates and 28-day roadmap generates.
- [ ] **Placement Cell Monitoring**:
  - Authenticate as college admin.
  - Inspect `/placement-cell/readiness`; verify cohort distribution renders.
  - Verify cohorts with fewer than 3 students display differential privacy masking (ADR 0004).
  - Verify results CSV export functions with purpose logging.
- [ ] **Super Admin Moderation**:
  - Authenticate as platform admin.
  - Verify `/admin/readiness` displays multi-institution benchmarking.
  - Verify `/admin/moderation` displays question bank health and review queue.

---

## 5. Rollback Procedures

If critical anomalies or high error rates are detected post-deployment:

1. **Cloud Run Instant Traffic Rollback**:
   ```bash
   gcloud run services update-traffic campusedge-api --to-revisions PREVIOUS_REVISION=100 --region asia-south1
   gcloud run services update-traffic campusedge-web --to-revisions PREVIOUS_REVISION=100 --region asia-south1
   ```
2. **Database Rollback Note**:
   - Schema migrations must maintain backward compatibility (expand-contract pattern) to ensure previous revisions operate without breaking during rollbacks.
