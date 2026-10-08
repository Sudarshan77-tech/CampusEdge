---
name: add-rls-policy
description: Production SQL templates for PostgreSQL Row Level Security (RLS) policies covering student-owned records, college tenant scoping, and super admin bypass.
---

# Add RLS Policy Templates

## When to Use

Use inside Prisma migration SQL scripts whenever creating or altering tables in the `public` schema.

## Standard Helper Functions

Supabase provides `auth.uid()` and `auth.jwt()`. We extract custom claims via:

```sql
-- Helper to extract current user role from JWT claims
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text AS $$
  SELECT coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper to extract current user college_id from JWT claims
CREATE OR REPLACE FUNCTION public.auth_college_id()
RETURNS uuid AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'college_id')::uuid,
    (auth.jwt() -> 'user_metadata' ->> 'college_id')::uuid,
    NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## Policy Templates

### 1. Student Own Row Policy (Self Access)

```sql
-- Users can only read and update their own row
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_profile"
ON "public"."user_profiles"
FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

### 2. College Tenant Scoped Policy

```sql
-- Students and College Admins can only access data belonging to their institution
ALTER TABLE "public"."placement_drives" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "college_tenant_access_policy"
ON "public"."placement_drives"
FOR ALL
USING (
  college_id = public.auth_college_id()
  OR
  public.auth_user_role() = 'SUPER_ADMIN'
)
WITH CHECK (
  college_id = public.auth_college_id()
  OR
  public.auth_user_role() = 'SUPER_ADMIN'
);
```

### 3. Super Admin Full Access Policy

```sql
CREATE POLICY "super_admin_full_access"
ON "public"."colleges"
FOR ALL
USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');
```

### 4. Audit Log (Insert Only / Read for Admins)

```sql
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

-- Service/system or users insert audit records
CREATE POLICY "audit_logs_insert"
ON "public"."audit_logs"
FOR INSERT
WITH CHECK (true);

-- Admins read logs of their own college
CREATE POLICY "audit_logs_college_admin_read"
ON "public"."audit_logs"
FOR SELECT
USING (
  college_id = public.auth_college_id()
  OR
  public.auth_user_role() = 'SUPER_ADMIN'
);
```
