import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  type CurrentUser as CurrentUserType,
  RegenerateRoadmapDto,
  UpdateRoadmapTaskStatusDto,
} from '@campusedge/shared';
import { AnalyticsService } from './analytics.service';
import { RoadmapService } from './roadmap.service';

@ApiTags('Student Analytics & Readiness')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeAnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly roadmapService: RoadmapService,
  ) {}

  @Get('analytics/summary')
  @ApiOperation({
    summary: 'High-level practice time, questions answered, accuracy, and diagnostic status',
  })
  getSummary(@CurrentUser() user: CurrentUserType) {
    return this.analyticsService.getSummary(user);
  }

  @Get('analytics/topics')
  @ApiOperation({
    summary: 'Topic mastery levels, accuracy, and scored item counts across all syllabus topics',
  })
  getTopicAnalytics(@CurrentUser() user: CurrentUserType) {
    return this.analyticsService.getTopicAnalytics(user);
  }

  @Get('analytics/accuracy-trend')
  @ApiOperation({
    summary: 'Daily accuracy and practice velocity over past 30 days',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getAccuracyTrend(@CurrentUser() user: CurrentUserType, @Query('days') days?: number) {
    return this.analyticsService.getAccuracyTrend(user, days);
  }

  @Get('readiness')
  @ApiOperation({
    summary:
      'Placement Readiness Score calculation, component breakdown, confidence, and disclaimer',
  })
  getReadiness(@CurrentUser() user: CurrentUserType) {
    return this.analyticsService.getReadiness(user);
  }

  @Get('roadmap')
  @ApiOperation({
    summary: 'Active 4-week personalized preparation roadmap plan and daily scheduled tasks',
  })
  getRoadmap(@CurrentUser() user: CurrentUserType) {
    return this.roadmapService.getActivePlan(user);
  }

  @Post('roadmap/regenerate')
  @ApiOperation({
    summary: 'Force regeneration of 4-week roadmap with updated study hours and target date',
  })
  regenerateRoadmap(@CurrentUser() user: CurrentUserType, @Body() dto: RegenerateRoadmapDto) {
    if (!user.collegeId) {
      throw new Error('College context required');
    }
    return this.roadmapService.generateAndSaveRoadmap(user.userId, user.collegeId, dto);
  }

  @Patch('roadmap/tasks/:taskId')
  @ApiOperation({
    summary: 'Update status of a roadmap task (mark DONE or SKIPPED)',
  })
  updateRoadmapTask(
    @CurrentUser() user: CurrentUserType,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateRoadmapTaskStatusDto,
  ) {
    return this.roadmapService.updateTaskStatus(taskId, dto.status, user);
  }
}
