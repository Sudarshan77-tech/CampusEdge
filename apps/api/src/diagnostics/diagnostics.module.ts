import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AttemptsModule } from '../attempts/attempts.module';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsController } from './diagnostics.controller';

@Module({
  imports: [AttemptsModule],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService, PrismaService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
