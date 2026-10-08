# ADR 0002: Authoritative Role and Tenant Assignment via API Only

## Status

Accepted

## Context

CampusEdge is a multi-tenant B2B platform where students, placement cell administrators (`COLLEGE_ADMIN`), and platform operators (`SUPER_ADMIN`) access institutional data protected by PostgreSQL Row Level Security (RLS).

In naive Supabase implementations, roles or institutional affiliations (`college_id`) are frequently passed in `raw_user_meta_data` during client-side signups (`supabase.auth.signUp({ options: { data: { role: 'SUPER_ADMIN' } } })`) or modified via direct PostgREST client updates. This creates a critical privilege escalation vector where malicious actors can self-elevate to administrative roles or switch college tenancy.

Additionally, trusting client tokens or claims without server-side validation risks confused-deputy attacks and algorithm confusion vulnerabilities.

## Decision

1. **Zero Trust for Signup Metadata**:
   - The PostgreSQL `auth.users` trigger (`handle_new_user`) explicitly assigns every new signup the role `STUDENT` and status `ONBOARDING`, setting `college_id = NULL`.
   - Any client-provided `raw_user_meta_data.role` or `raw_user_meta_data.college_id` is discarded by the trigger.

2. **Privilege Elevation Strictly via Authenticated API Endpoints**:
   - `COLLEGE_ADMIN` status can ONLY be granted by accepting a cryptographically signed institutional invitation issued by `SUPER_ADMIN` via `POST /onboarding/accept-invitation`.
   - `SUPER_ADMIN` accounts can NEVER be created via web signups. They must be provisioned via the secure CLI script `pnpm admin:create-super-admin` with direct database connectivity.
   - Student affiliation with a college is assigned solely through `POST /onboarding/college`, validated against verified active colleges.

3. **RLS Shielding & Schema Hardening**:
   - Helper functions `auth_user_role()` and `auth_college_id()` are marked `SECURITY DEFINER SET search_path = ''` to prevent search path hijacking.
   - All table access for `anon` and `authenticated` roles is revoked at the PostgreSQL level (`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated`).
   - The NestJS API acts as the sole authoritative data boundary, executing business logic and audit logging.

4. **Audit Immutability**:
   - `audit_logs` and `consent_records` tables have trigger-enforced append-only constraints (`trg_prevent_audit_log_mutation`, `trg_prevent_consent_mutation`) raising PostgreSQL exceptions on any `UPDATE` or `DELETE` attempt.

## Consequences

- **Positive**: Complete mitigation of client-side privilege escalation, cross-tenant data leakage, and unauthorized role tampering. Full compliance with DPDP 2023 auditability requirements.
- **Trade-off**: Requires dedicated API orchestration for institutional onboarding rather than relying on direct Supabase client mutations.
