import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  providers: [AuditService, AuditInterceptor, PrismaService],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
