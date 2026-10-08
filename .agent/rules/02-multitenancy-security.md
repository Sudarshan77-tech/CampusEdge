# 02 - Multi-Tenancy & Security Rules

## 1. Multi-Tenant Isolation

1. **Tenant Anchor**:
   - Every tenant-owned table in PostgreSQL MUST include a `college_id UUID` column with a foreign key to `colleges(id)`.
2. **Primary Enforcement (Application Layer)**:
   - Prisma connects using the standard connection string (bypassing RLS by default). Therefore, **NestJS Guards and Services are the PRIMARY enforcement boundary**.
   - Every service query mutating or selecting tenant records MUST explicitly filter by `college_id` derived directly from `req.user.collegeId`.
   - NEVER accept or trust `college_id` from the request body or client query string for non-Super Admin callers.
3. **Secondary Defense (Row Level Security)**:
   - RLS is enabled on ALL tables in the `public` schema without exception.
   - Policies ensure that if direct SQL access or Supabase client access is ever attempted, users can never read foreign tenant data.

## 2. Roles & Permissions (RBAC)

- **`STUDENT`**:
  - Bound strictly to one `college_id`. Can access own submissions, practice metrics, and drives published for their college.
- **`COLLEGE_ADMIN` (Placement Cell / TPO)**:
  - Scoped to their institution's `college_id`. Manages college drives, approves interview experiences, views student readiness.
- **`SUPER_ADMIN`**:
  - Null `college_id`. Can inspect, onboard, and manage across institutions.

## 3. Input Validation & Secret Protection

- Every endpoint payload must be validated with class-validator / Zod DTOs with `forbidNonWhitelisted: true`.
- Never commit, log, or send secrets (`SUPABASE_SECRET_KEY`, `DATABASE_URL`, AI keys) to client code.
- Production error responses must never expose stack traces or raw database exceptions.

## 4. Audit Logging & Compliance (DPDP Act India)

- **Audit Logging**: Every mutation on student records, placement eligibility, or drive results MUST write an entry to `audit_logs` (actor, action, target entity, timestamp).
- **DPDP Act (Digital Personal Data Protection Act 2023)**:
  - Collect minimal student data required for placement eligibility.
  - Student consent must be captured upon onboarding.
  - Provide complete account and placement submission erasure capability upon verified request.
