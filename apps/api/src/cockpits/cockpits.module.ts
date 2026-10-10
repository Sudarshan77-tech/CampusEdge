import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';
import { QuestionsModule } from '../questions/questions.module';
import { PlacementCellReadinessService } from './placement-cell-readiness.service';
import { PlacementCellReadinessController } from './placement-cell-readiness.controller';
import { AdminReadinessService } from './admin-readiness.service';
import { AdminReadinessController } from './admin-readiness.controller';

@Module({
  imports: [AuditModule, QuestionsModule],
  controllers: [PlacementCellReadinessController, AdminReadinessController],
  providers: [PrismaService, PlacementCellReadinessService, AdminReadinessService],
  exports: [PlacementCellReadinessService, AdminReadinessService],
})
export class CockpitsModule {}
