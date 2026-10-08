import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UserStatus } from '@campusedge/shared';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector?: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (this.reflector) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) {
        return true;
      }
    }
    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown): TUser {
    if (err || !user) {
      const message =
        err instanceof Error
          ? err.message
          : info instanceof Error
            ? info.message
            : (info as { message?: string })?.message || 'Unauthorized access';
      throw new UnauthorizedException(message);
    }

    // Double check account status
    const u = user as { status?: UserStatus };
    if (u.status === UserStatus.SUSPENDED || u.status === UserStatus.DEACTIVATED) {
      throw new UnauthorizedException('User account is suspended or deactivated.');
    }

    return user;
  }
}
