import { Controller, Get, Post, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { type CurrentUser as CurrentUserType, Role } from '@campusedge/shared';
import { AdminReadinessService } from './admin-readiness.service';

@ApiTags('Super Admin Cockpit & Moderation')
@ApiBearerAuth()
@Controller('admin/readiness')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminReadinessController {
  constructor(private readonly adminReadinessService: AdminReadinessService) {}

  @Get('multi-institution-overview')
  @ApiOperation({
    summary: 'Multi-institution readiness benchmarking overview across all colleges on CampusEdge',
  })
  getMultiInstitutionOverview() {
    return this.adminReadinessService.getMultiInstitutionOverview();
  }

  @Get('question-bank-health')
  @ApiOperation({
    summary:
      'Question bank health breakdown by status, pending reports count, and top flagged questions',
  })
  getQuestionBankHealth() {
    return this.adminReadinessService.getQuestionBankHealth();
  }

  @Post('questions/:id/approve')
  @ApiOperation({
    summary: 'Approve a question from moderation queue (Super Admin)',
  })
  approveQuestion(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.adminReadinessService.approveQuestion(id, user);
  }

  @Post('questions/:id/reject')
  @ApiOperation({
    summary: 'Reject a question with an official moderator note (Super Admin)',
  })
  rejectQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('note') note: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.adminReadinessService.rejectQuestion(id, note, user);
  }
}
