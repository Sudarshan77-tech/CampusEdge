# 01 - Architecture & System Boundaries

## 1. Monorepo Stack Overview

- **apps/web**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui. Handles user interface, client state, and SSR session forwarding.
- **apps/api**: NestJS 11 + Express, TypeScript. Central business logic, authorization guards, multi-tenant scoping, and external integrations.
- **packages/database**: Single source of truth for Prisma schema, migrations, seed pipelines, and DB client wrapper.
- **packages/shared**: Shared Zod schemas, data contracts, enums, DTOs, and constants consumed across web and api.
- **packages/config**: Shared TypeScript, ESLint, and Prettier configurations.
- **Supabase**: Managed PostgreSQL database, Supabase Auth (JWTs/JWKS), and Supabase Storage.
- **Queues & Compute (Upcoming Phases)**: Redis + BullMQ for async jobs (AI analysis, digest emails), Judge0 sandbox for code evaluation.
- **AI Integrations**: Google Gemini models consumed EXCLUSIVELY through backend NestJS services.

## 2. Strict Boundary Rules

1. **Zero Direct DB Access from Web**:
   - The web application must NEVER import `@campusedge/database` or connect to PostgreSQL directly.
   - All business entities, mutations, and domain logic MUST flow through `apps/api` endpoints (`/api/v1/*`).
2. **Supabase Client Usage in Web**:
   - Web uses `@supabase/ssr` solely for session cookie synchronization and client auth state.
   - Business tables are NEVER queried via Supabase JS client from frontend components.
3. **Layered API Design**:
   - NestJS modules follow strict layering: `Controller -> Service -> Repository (PrismaService)`.
   - Controllers handle HTTP routing, Swagger docs, and guard bindings.
   - Services contain pure business rules, tenant scoping, and validation.
4. **Shared Package Protocol**:
   - Every contract shared between frontend and backend must live in `packages/shared`.
   - All external request bodies and URL parameters must be validated with Zod/class-validator before touching services.
