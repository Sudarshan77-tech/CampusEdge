import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CurrentUser, Role } from '@campusedge/shared';
import { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    // Super admin can access cross-tenant data
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // For tenant-scoped users, collegeId must exist
    if (!user.collegeId) {
      throw new ForbiddenException('User is not associated with any college tenant');
    }

    // Extract target collegeId from route parameters, query, or headers
    const targetCollegeId =
      request.params?.['collegeId'] ||
      (request.query?.['collegeId'] as string) ||
      (request.headers?.['x-college-id'] as string);

    // If an explicit collegeId was targeted in the request, it MUST match user's collegeId
    if (targetCollegeId && targetCollegeId !== user.collegeId) {
      throw new ForbiddenException('Cross-college tenant access denied');
    }

    return true;
  }
}
