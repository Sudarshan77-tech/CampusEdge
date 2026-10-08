---
name: auth-flows
description: Guide to user onboarding, authentication flows, magic link sign in, and role-based routing across Next.js and NestJS.
---

# Auth Flows & Onboarding Operations

## 1. Authentication Lifecycle

```
[Student Signs Up]
       │
       ▼
Supabase Auth (auth.users)
       │ (trg_on_auth_user_created)
       ▼
user_profiles: role = STUDENT, status = ONBOARDING, college_id = NULL
       │
       ▼
Redirect to /student/onboarding:
  Step 1: Choose College -> POST /onboarding/college
  Step 2: DPDP Consents -> POST /onboarding/consent (x3)
  Step 3: Academic Profile -> POST /onboarding/profile
       │
       ├── Domain Matches College & require_student_approval == false
       │     └── status = ACTIVE -> Redirect to /student/dashboard
       │
       └── Domain Does Not Match OR require_student_approval == true
             └── status = PENDING_APPROVAL -> Awaiting Placement Cell
```

## 2. Institutional Invitation Lifecycle

```
[Super Admin] -> POST /admin/colleges/:id/admins
       │
       ▼
invitations table: status = PENDING, token generated, email sent
       │
       ▼
Placement Officer clicks link -> Signs up or Signs in
       │
       ▼
POST /onboarding/accept-invitation { token }
       │
       ▼
Transactional Update:
  - user_profiles.role = COLLEGE_ADMIN
  - user_profiles.college_id = invitation.college_id
  - user_profiles.status = ACTIVE
  - invitations.status = ACCEPTED
```

## 3. Web Cookie Session Management

- Next.js App Router uses `@supabase/ssr` with `createServerClient`.
- `apps/web/middleware.ts` runs on all route hits, refreshing cookies and redirecting unauthenticated requests to `/login?redirectTo=...`.
- `apps/web/lib/api.ts` attaches the Supabase `access_token` automatically for client requests.
