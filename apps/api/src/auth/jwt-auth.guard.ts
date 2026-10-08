import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser, info: unknown): TUser {
    if (err || !user) {
      const message =
        err instanceof Error
          ? err.message
          : info instanceof Error
            ? info.message
            : (info as { message?: string })?.message || 'Unauthorized access';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
