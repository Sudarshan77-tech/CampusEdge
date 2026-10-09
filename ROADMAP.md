# CampusEdge Product & Engineering Roadmap

## Phases Overview

| Phase       | Milestone                                                   | Target Duration | Status         |
| :---------- | :---------------------------------------------------------- | :-------------- | :------------- |
| **Phase 0** | Production Foundation & Architecture                        | Week 1          | 🟢 Completed   |
| **Phase 1** | Core Platform, Auth UI & College Onboarding                 | Weeks 2–3       | 🟢 Completed   |
| **Phase 2** | Placement Cell Cockpit & Campus Intelligence                | Weeks 4–5       | 🟡 Next Target |
| **Phase 3** | Diagnostic Engine & Transparent Readiness Score (MVP Pilot) | Weeks 6–7       | ⚪ Planned     |
| **Phase 4** | Company Intelligence & Preparation Blueprints               | Week 8          | ⚪ Planned     |
| **Phase 5** | Coding Practice Module & Judge0 Sandbox                     | Weeks 9–10      | ⚪ Planned     |
| **Phase 6** | AI Intelligence Layer (Resume & Mock Interviews)            | Weeks 11–12     | ⚪ Planned     |
| **Phase 7** | Personalization, Engagement & Streaks                       | Week 13         | ⚪ Planned     |
| **Phase 8** | Super Admin, Hardening, Security & Launch                   | Weeks 14–15     | ⚪ Planned     |

---

## Phase 0: Production Foundation

- [x] Monorepo scaffold with pnpm workspaces + Turborepo
- [x] Strict TypeScript configuration across all packages
- [x] `.agent/` architecture rules, skills, and execution workflows
- [x] Secure environment variable segregation (web vs api)
- [x] NestJS API bootstrap with Zod env validation, helmet, CORS, Pino logger, and Swagger
- [x] Next.js 15 Web App Router with Tailwind CSS, shadcn/ui, and Status page
- [x] Unit test suites with Jest (api) and Vitest (web & shared)
- [x] Auth groundwork: `JwtAuthGuard`, `RolesGuard`, `TenantGuard`, `@CurrentUser`
- [x] Database initial schema v1 (`College`, `UserProfile`, `AuditLog`) with RLS and trigger migration
- [x] Idempotent database seed script (`prisma/seed.ts`)
- [x] Automated RLS auditing script (`prisma/verify-rls.ts`)
- [x] Multi-stage Dockerfiles and `docker-compose.yml`
- [x] GitHub Actions CI pipeline with isolated PostgreSQL test container

## Phase 1: Core Platform & College Onboarding

- [x] Supabase Auth UI integration (Email/Password, Magic Link, Password Recovery)
- [x] Role-based route middleware in Next.js (Student, Placement Cell, Super Admin)
- [x] College onboarding workflow (domain whitelist, student batch registration, branch management)
- [x] Comprehensive Student Profile schema (academics, branch, CGPA, backlogs, skills catalog)
- [x] Dynamic multi-tenant scoping in all queries with PostgreSQL RLS & TenantGuard
- [x] DPDP consent capture and audit log persistence with append-only database triggers

## Phase 2: Placement Cell Cockpit & Intelligence Data

- [x] Company directory & recruiter profiles
- [x] Placement drive management (eligibility rules, branches, CGPA cutoffs, deadlines)
- [x] Student drive registration and application tracking
- [x] Bulk CSV student import with format validation
- [x] Official campus placement noticeboard and circulars
- [x] Senior interview experience submission workflow with TPO approval moderation
- [x] Historical package analytics and placement statistics aggregation

## Phase 3: Diagnostics & Readiness Engine (MVP Pilot Target)

- [x] Part 3A: Schema, RLS, Pure Domain Logic in `packages/shared`, ADRs, and Readiness Documentation
- [x] Part 3B: Content Pipeline & Starter Question Bank (455 questions, review gate, CSV import)
- [ ] Part 3C: Test Engine, Attempt Lifecycle, Leakage Defense, Synthetic Load Test (CHECKPOINT 3)
- [ ] Part 3D: Diagnostic Test, Readiness Engine API & Roadmap Generation
- [ ] Part 3E: Placement Cell & Super Admin Cockpits
- [ ] Part 3F: Web UI Pages & Student Assessment Experience
- [ ] Part 3G: Testing Suite (Leakage Contract, E2E, Load Tests)
- [ ] Part 3H: Pilot Launch Kit (Manual, Cohort CSVs, TPO Playbook)
- [ ] Part 3I: Deployment & Production Smoke Tests

## Phase 4: Company Intelligence & Preparation Blueprints

- [ ] College-specific company recruitment profile pages
- [ ] Hiring trend visualizer (past packages, hiring numbers by branch)
- [ ] Company-specific preparation blueprints
- [ ] Rule-based student-to-company match score
- [ ] Placement calendar and interview scheduling notifications

## Phase 5: Coding Module & Sandbox Execution

- [ ] Coding problem bank (DSA, SQL, problem tags, test cases)
- [ ] Integration with Judge0 code execution engine
- [ ] Multi-language support (Java, C++, Python, JavaScript)
- [ ] Submission evaluation and execution metrics (memory, time)
- [ ] College coding leaderboard

## Phase 6: AI Layer (Google Gemini Integration)

- [ ] `AiProvider` interface and Gemini client integration in NestJS
- [ ] Resume analysis and ATS keyword gap detection against company job descriptions
- [ ] Interactive conversational AI mock interview simulator
- [ ] Post-submission code optimization suggestions
- [ ] Per-user token quotas and BullMQ async worker queues

## Phase 7: Personalization & Engagement

- [ ] Adaptive question recommendation based on student weak areas
- [ ] Daily practice streaks and engagement badges
- [ ] Student peer benchmarking (anonymous percentiles within college)
- [ ] Weekly progress digests via email

## Phase 8: Hardening, Security, DPDP Compliance & Launch

- [ ] Super Admin multi-institution analytics cockpit
- [ ] AI token cost and quota monitoring dashboard
- [ ] DPDP Act full data export and user deletion capabilities
- [ ] Load testing with k6 (target 2,000 concurrent students)
- [ ] Production security audit and penetration testing
- [ ] Production deployment to Google Cloud Run (asia-south1)

---

## Production Checklist

- [ ] Automated database backups with Point-in-Time Recovery (PITR)
- [ ] Sentry error monitoring integration (web and api)
- [ ] Uptime monitoring and synthetic heartbeat alerts
- [ ] Staging environment matching production architecture
- [ ] API rate limiting verified under load
- [ ] Transactional email provider verified (Resend / AWS SES)
- [ ] Terms of Service, Privacy Policy, and DPDP Consent agreements in place

---

## Decisions Log

- **2026-10-09**: [ADR 0001] Adopted Prisma Migrate as sole schema authority with manual SQL for Row Level Security (RLS).
- **2026-10-09**: [ADR 0002] Authoritative role and tenant assignment via API only; zero trust for signup metadata.
- **2026-10-09**: [ADR 0003] Global recruiter catalog with tenant-scoped operational facts via composite primary and foreign keys.
- **2026-10-09**: [ADR 0004] Differential privacy with small cohort masking (< 3 students) and purpose-bound DPDP consent capture.
- **2026-10-09**: Mandated deterministic algorithms for all score calculations and test cases; AI restricted strictly to qualitative evaluation and simulation.
- **2026-10-09**: Selected Google Cloud Run (asia-south1, Mumbai) as deployment target for DPDP Act data residency compliance.
