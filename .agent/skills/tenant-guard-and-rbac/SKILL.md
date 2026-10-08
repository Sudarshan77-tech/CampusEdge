---
name: tenant-guard-and-rbac
description: Guide on protecting NestJS endpoints using JwtAuthGuard, RolesGuard, TenantGuard, and extracting authoritative tenant context via @CurrentUser.
---

# Tenant Guard & RBAC Enforcement

## When to Use

Use whenever securing an API route, enforcing role-based permissions (`STUDENT`, `COLLEGE_ADMIN`, `SUPER_ADMIN`), or preventing cross-tenant leakage.

## Architecture

1. **`JwtAuthGuard`**:
   - Intercepts incoming `Authorization: Bearer <token>`.
   - Validates signature against Supabase JWKS (`/.well-known/jwks.json`) or secret.
   - Executes server-side query to `user_profiles` to fetch authoritative `role` and `college_id`.
   - Attaches `req.user: CurrentUser`.
2. **`RolesGuard`**:
   - Inspects metadata set by `@Roles(...)`.
   - Allows request only if `req.user.role` matches.
3. **`TenantGuard`**:
   - Prevents users from querying foreign college data.
   - If route specifies `collegeId` in params/query/headers, verifies `req.user.collegeId === collegeId`.
   - Bypassed cleanly for `SUPER_ADMIN`.

## Usage Patterns

### Securing a Controller or Route

```typescript
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('placements')
export class PlacementController {
  // 1. Any authenticated user in their own college
  @Get()
  @Roles(Role.STUDENT, Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  getPlacements(@CurrentUser() user: CurrentUser) {
    return this.placementService.findByCollege(user.collegeId);
  }

  // 2. Only Placement Cell Administrators
  @Post('drives')
  @Roles(Role.COLLEGE_ADMIN)
  createDrive(@CurrentUser() user: CurrentUser, @Body() dto: CreateDriveDto) {
    return this.placementService.create(user.collegeId!, dto);
  }

  // 3. Super Admin Only
  @Get('platform-analytics')
  @Roles(Role.SUPER_ADMIN)
  getGlobalAnalytics() {
    return this.placementService.getGlobalMetrics();
  }
}
```

## Golden Rule

Never trust a `college_id` provided in the HTTP request payload (`req.body`). Always supply `user.collegeId` directly from the authenticated session context.
