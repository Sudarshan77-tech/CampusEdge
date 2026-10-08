# Workflow: /db-migrate

## Description

Safe, verified database migration flow ensuring schema integrity, RLS compliance, and developer approval before remote execution.

## Execution Sequence

### 1. Pre-Migration Sanity

- Ensure local Supabase stack is running (`pnpm supabase:start`).
- Validate Prisma schema syntax:
  ```powershell
  pnpm --filter @campusedge/database exec prisma validate
  ```

### 2. Generate Draft Migration

```powershell
pnpm --filter @campusedge/database exec prisma migrate dev --create-only --name <migration_name>
```

### 3. Review & Append Custom SQL

- Review the generated SQL in `packages/database/prisma/migrations/`.
- Ensure RLS is enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- Add policies for student-own-row, college scoping, and super admin access.
- Add triggers for timestamps or user sync.

### 4. Apply & Verify Locally

- Apply to local PostgreSQL:
  ```powershell
  pnpm db:migrate:dev
  ```
- Run RLS audit check:
  ```powershell
  pnpm db:verify-rls
  ```

### 5. Remote Push Gate (STRICT CHECKPOINT)

- **PAUSE**: Request explicit human confirmation before pushing to remote production/staging.
- Present summary of migration SQL changes.
- Once approved, deploy using `DIRECT_URL`:
  ```powershell
  pnpm db:migrate:deploy:remote
  ```
- Audit remote RLS coverage:
  ```powershell
  pnpm db:verify-rls:remote
  ```
