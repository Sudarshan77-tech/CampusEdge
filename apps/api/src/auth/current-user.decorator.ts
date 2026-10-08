import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '@campusedge/shared';

export const CurrentUserDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export { CurrentUserDecorator as CurrentUser };
