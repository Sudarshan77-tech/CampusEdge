# CampusEdge Product & Engineering Roadmap

## Phases Overview

| Phase       | Milestone                                                   | Target Duration | Status                      |
| :---------- | :---------------------------------------------------------- | :-------------- | :-------------------------- |
| **Phase 0** | Production Foundation & Architecture                        | Week 1          | 🟡 In Progress (Completing) |
| **Phase 1** | Core Platform, Auth UI & College Onboarding                 | Weeks 2–3       | ⚪ Planned                  |
| **Phase 2** | Placement Cell Cockpit & Campus Intelligence                | Weeks 4–5       | ⚪ Planned                  |
| **Phase 3** | Diagnostic Engine & Transparent Readiness Score (MVP Pilot) | Weeks 6–7       | ⚪ Planned                  |
| **Phase 4** | Company Intelligence & Preparation Blueprints               | Week 8          | ⚪ Planned                  |
| **Phase 5** | Coding Practice Module & Judge0 Sandbox                     | Weeks 9–10      | ⚪ Planned                  |
| **Phase 6** | AI Intelligence Layer (Resume & Mock Interviews)            | Weeks 11–12     | ⚪ Planned                  |
| **Phase 7** | Personalization, Engagement & Streaks                       | Week 13         | ⚪ Planned                  |
| **Phase 8** | Super Admin, Hardening, Security & Launch                   | Weeks 14–15     | ⚪ Planned                  |

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

- [ ] Supabase Auth UI integration (Email/Password, Magic Link, College SSO)
- [ ] Role-based route middleware in Next.js (Student, TPO, Super Admin)
- [ ] College onboarding workflow (domain whitelist, student batch registration)
- [ ] Comprehensive Student Profile schema (academics, branch, CGPA, backlogs, skills)
- [ ] Dynamic multi-tenant scoping in all queries
- [ ] DPDP consent capture and audit log persistence on onboarding

## Phase 2: Placement Cell Cockpit & Intelligence Data

- [ ] Company directory & recruiter profiles
- [ ] Placement drive management (eligibility rules, branches, CGPA cutoffs, deadlines)
- [ ] Student drive registration and application tracking
- [ ] Bulk CSV student import with format validation
- [ ] Official campus placement noticeboard and circulars
- [ ] Senior interview experience submission workflow with TPO approval moderation
- [ ] Historical package analytics and placement statistics aggregation

## Phase 3: Diagnostics & Readiness Engine (MVP Pilot Target)

- [ ] Question bank architecture (Aptitude, Logical Reasoning, Technical MCQs)
- [ ] Timed diagnostic test evaluation engine (100% deterministic scoring)
- [ ] Transparent Readiness Score calculation formula (Aptitude + Core + Academic weightage)
- [ ] Student performance radar charts and breakdown analytics
- [ ] Company-specific benchmark comparison ("Am I ready for Company X?")
- [ ] Pilot readiness launch for cohort testing

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
- **2026-10-09**: Mandated deterministic algorithms for all score calculations and test cases; AI restricted strictly to qualitative evaluation and simulation.
- **2026-10-09**: Selected Google Cloud Run (asia-south1, Mumbai) as deployment target for DPDP Act data residency compliance.
