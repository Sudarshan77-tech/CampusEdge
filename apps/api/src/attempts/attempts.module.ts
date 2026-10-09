import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController, InternalAttemptsController } from './attempts.controller';
import { PrismaService } from '../prisma.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [AttemptsController, InternalAttemptsController],
  providers: [AttemptsService, PrismaService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
