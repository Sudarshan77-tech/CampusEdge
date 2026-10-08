import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from './audit.interceptor';

export const AUDIT_METADATA_KEY = 'audit_metadata';

export interface AuditMetadata {
  action: string;
  entityType: string;
}

export function Audit(action: string, entityType: string) {
  return applyDecorators(
    SetMetadata(AUDIT_METADATA_KEY, { action, entityType }),
    UseInterceptors(AuditInterceptor),
  );
}
