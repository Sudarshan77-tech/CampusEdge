import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AnalyticsService } from './analytics.service';
import { RoadmapService } from './roadmap.service';
import { MeAnalyticsController } from './me-analytics.controller';

@Module({
  controllers: [MeAnalyticsController],
  providers: [PrismaService, AnalyticsService, RoadmapService],
  exports: [AnalyticsService, RoadmapService],
})
export class AnalyticsModule {}
