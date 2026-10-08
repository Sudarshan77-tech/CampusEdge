---
name: supabase-prisma-migrations
description: Step-by-step guide and templates for generating, customizing with RLS, and executing Prisma migrations against local and remote Supabase PostgreSQL instances.
---

# Supabase + Prisma Migration Pipeline

## When to Use

Use this skill whenever:

- Adding, updating, or deleting Prisma models in `packages/database/prisma/schema.prisma`.
- Writing custom SQL triggers, functions, or Row Level Security policies.
- Applying migrations to local Docker Supabase or deploying to remote Supabase.

## Workflow Instructions

### Step 1: Update Prisma Schema

Edit `packages/database/prisma/schema.prisma`. Ensure:

- Model has `@@map("table_names")` in snake_case.
- Tenant tables include `collegeId String @map("college_id") @db.Uuid`.
- Timestamps include `createdAt` and `updatedAt`.

### Step 2: Create Migration Draft (Without Applying)

Run the `--create-only` command:

```powershell
pnpm --filter @campusedge/database exec prisma migrate dev --create-only --name <feature_name>
```

### Step 3: Append Custom SQL (RLS & Triggers)

Open the generated `migration.sql` in `packages/database/prisma/migrations/<timestamp>_<feature_name>/`.
Append Row Level Security policies and triggers at the bottom:

```sql
-- 1. Enable RLS
ALTER TABLE "public"."your_table_name" ENABLE ROW LEVEL SECURITY;

-- 2. Tenant Isolation Policy (College Scope)
CREATE POLICY "tenant_college_isolation_policy"
ON "public"."your_table_name"
FOR ALL
USING (
  college_id = (auth.jwt() -> 'app_metadata' ->> 'college_id')::uuid
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPER_ADMIN'
);

-- 3. Automatic updated_at Trigger
CREATE TRIGGER update_your_table_updated_at
BEFORE UPDATE ON "public"."your_table_name"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

### Step 4: Apply to Local Database

Execute the local migration:

```powershell
pnpm db:migrate:dev
```

### Step 5: Verify RLS Compliance

Run the RLS verification script:

```powershell
pnpm db:verify-rls
```

### Step 6: Deploy to Remote Supabase (Requires Human Approval)

Once verified locally and reviewed:

```powershell
pnpm db:migrate:deploy:remote
pnpm db:verify-rls:remote
```
