import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { AUDIT_METADATA_KEY, AuditMetadata } from './audit.decorator';
import { CurrentUser } from '@campusedge/shared';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditMeta = this.reflector.getAllAndOverride<AuditMetadata>(AUDIT_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!auditMeta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const user = request.user;
    const ip = request.ip || (request.headers['x-forwarded-for'] as string);
    const requestId =
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string);

    return next.handle().pipe(
      tap({
        next: (responseData: unknown) => {
          if (!user) return;

          // Attempt to extract entityId from params, response, or body
          const entityId =
            request.params?.['id'] ||
            (responseData as { id?: string })?.id ||
            request.body?.['id'] ||
            null;

          const metadata: Record<string, unknown> = {
            method: request.method,
            path: request.originalUrl || request.url,
            body: request.body,
            params: request.params,
            query: request.query,
          };

          void this.auditService.log({
            actorId: user.userId,
            collegeId: user.collegeId,
            action: auditMeta.action,
            entityType: auditMeta.entityType,
            entityId: entityId ? String(entityId) : null,
            metadata,
            ipAddress: ip,
            requestId,
          });
        },
      }),
    );
  }
}
