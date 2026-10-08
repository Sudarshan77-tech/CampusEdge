# Rule 08: Authentication, Authorization, and Role Governance

## 1. Principles

- **Deny by default**: All API endpoints require authentication unless explicitly decorated with `@Public()`.
- **Authoritative Identity**: The NestJS API extracts user identity from the validated JWT via `JwtStrategy` and queries the authoritative `user_profiles` table with a short 30s in-memory TTL.
- **No Client Metadata Trust**: Role (`Role`) and Tenant ID (`college_id`) MUST NEVER be read from client request bodies or JWT unverified claims for authorization.

## 2. Role Boundaries

1. **`SUPER_ADMIN`**:
   - Cross-tenant institutional oversight.
   - Onboards colleges (`POST /admin/colleges`) and invites college admins (`POST /admin/colleges/:id/admins`).
   - Can suspend/reactivate any college or user.
   - Bypasses tenant scoping via `TenantGuard`.

2. **`COLLEGE_ADMIN`**:
   - Bound strictly to a single `college_id`.
   - Access to other colleges' data is strictly prohibited at both API and database RLS levels.
   - Manages student roster approval (`decision: APPROVE | REJECT | SUSPEND`), academic branches, and college settings.

3. **`STUDENT`**:
   - Bound to a single `college_id` selected during onboarding.
   - Academic records and applications are strictly student-owned.
   - Student auto-activation occurs if and only if their verified email domain matches their college's `email_domains` configuration AND `require_student_approval` is `false`.

## 3. Route Guard Hierarchy

Every protected NestJS controller endpoint must apply:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles(Role.COLLEGE_ADMIN)
```

- `JwtAuthGuard`: Validates bearer token signature, expiration, and user status (`ACTIVE` or `ONBOARDING`).
- `RolesGuard`: Verifies role permission using `@Roles(...)`.
- `TenantGuard`: Enforces college tenant boundary matching `@CurrentUser()`.
