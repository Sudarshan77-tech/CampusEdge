import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { type CurrentUser as CurrentUserType, Role } from '@campusedge/shared';
import { PlacementCellReadinessService } from './placement-cell-readiness.service';

@ApiTags('Placement Cell Readiness Cockpit')
@ApiBearerAuth()
@Controller('placement-cell/readiness')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COLLEGE_ADMIN)
export class PlacementCellReadinessController {
  constructor(private readonly readinessService: PlacementCellReadinessService) {}

  @Get('cohort-distribution')
  @ApiOperation({
    summary:
      'Cohort readiness distribution across 4 bands (enforces differential privacy masking for cohorts < 3 students)',
  })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'batchYear', required: false, type: Number })
  getCohortDistribution(
    @CurrentUser() user: CurrentUserType,
    @Query('branchId') branchId?: string,
    @Query('batchYear') batchYear?: number,
  ) {
    return this.readinessService.getCohortDistribution(user, branchId, batchYear);
  }

  @Get('topic-heatmap')
  @ApiOperation({
    summary: 'College topic mastery heatmap with average scores and weak student counts',
  })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'batchYear', required: false, type: Number })
  getTopicHeatmap(
    @CurrentUser() user: CurrentUserType,
    @Query('branchId') branchId?: string,
    @Query('batchYear') batchYear?: number,
  ) {
    return this.readinessService.getTopicHeatmap(user, branchId, batchYear);
  }

  @Get('schedules/:scheduleId/attendance')
  @ApiOperation({
    summary: 'Live test attendance, submissions, average score, and integrity flag counts',
  })
  getScheduleAttendance(
    @CurrentUser() user: CurrentUserType,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
  ) {
    return this.readinessService.getScheduleAttendance(scheduleId, user);
  }

  @Get('schedules/:scheduleId/export-csv')
  @ApiOperation({
    summary: 'Export test results as CSV with mandatory DPDP purpose audit log',
  })
  exportScheduleResultsCsv(
    @CurrentUser() user: CurrentUserType,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
  ) {
    return this.readinessService.exportScheduleResultsCsv(scheduleId, user);
  }
}
