# Workflow: /new-module

## Description

End-to-end implementation workflow for building a new CampusEdge feature vertical across the stack.

## Step-by-Step Execution Order

### 1. Database Schema

- Open `packages/database/prisma/schema.prisma`.
- Define models with snake_case mapping (`@@map`, `@map`), UUID IDs, timestamps, and `college_id`.

### 2. Migration & RLS

- Generate migration draft:
  ```powershell
  pnpm --filter @campusedge/database exec prisma migrate dev --create-only --name <module_name>
  ```
- Append RLS enabling and tenant isolation policies to `migration.sql`.
- Apply locally: `pnpm db:migrate:dev`.
- Run RLS verification: `pnpm db:verify-rls`.

### 3. Shared Contracts

- In `packages/shared/src/`, export Zod schemas, DTOs, and TypeScript interfaces.
- Rebuild shared package: `pnpm --filter @campusedge/shared build`.

### 4. NestJS Backend Module

- In `apps/api/src/<module>/`, create DTOs, Service, Controller, and Module.
- Bind `JwtAuthGuard`, `RolesGuard`, and `TenantGuard`.
- Scope all database operations to `req.user.collegeId`.
- Write controller and service unit tests (`.spec.ts`).

### 5. Web Frontend Page

- In `apps/web/app/<module>/`, create Server Component `page.tsx`, `loading.tsx`, and `error.tsx`.
- Fetch data from NestJS API `/api/v1/<module>`.
- Build UI using shadcn components and Tailwind CSS.

### 6. Verification Sweep

- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
