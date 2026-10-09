import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ApplicationsService } from './applications.service';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import {
  Role,
  CurrentUser as CurrentUserType,
  ApplyDriveDto,
  UpdateApplicationStatusDto,
  BulkUpdateApplicationStatusDto,
  ApplicationQueryDto,
} from '@campusedge/shared';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(RolesGuard, TenantGuard)
@Controller()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // --- Student Endpoints ---

  @Post('drives/:id/apply')
  @Roles(Role.STUDENT)
  @Audit('APPLY_DRIVE', 'DriveApplication')
  @ApiOperation({ summary: 'Register for a drive with placement data sharing consent' })
  apply(
    @CurrentUser() user: CurrentUserType,
    @Param('id', ParseUUIDPipe) driveId: string,
    @Body() dto: ApplyDriveDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';
    return this.applicationsService.apply(user, driveId, dto, ipAddress, userAgent);
  }

  @Post('drives/:id/withdraw')
  @Roles(Role.STUDENT)
  @Audit('WITHDRAW_APPLICATION', 'DriveApplication')
  @ApiOperation({ summary: 'Withdraw registration before deadline' })
  withdraw(@CurrentUser() user: CurrentUserType, @Param('id', ParseUUIDPipe) driveId: string) {
    return this.applicationsService.withdraw(user, driveId);
  }

  @Get('student/my-applications')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'List current student applications' })
  myApplications(@CurrentUser() user: CurrentUserType) {
    return this.applicationsService.myApplications(user);
  }

  // --- Placement Cell Endpoints ---

  @Get('drives/:id/applications')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List applicants for a drive with filters' })
  list(
    @CurrentUser() user: CurrentUserType,
    @Param('id', ParseUUIDPipe) driveId: string,
    @Query() query: ApplicationQueryDto,
  ) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.applicationsService.list(user.collegeId, { ...query, driveId });
  }

  @Patch('applications/:id/status')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('UPDATE_APPLICATION_STATUS', 'DriveApplication')
  @ApiOperation({ summary: 'Update applicant status (with optimistic locking)' })
  updateStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.applicationsService.updateStatus(user.collegeId, user.userId, applicationId, dto);
  }

  @Post('drives/:id/applications/bulk-status')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('BULK_UPDATE_APPLICATION_STATUS', 'DriveApplication')
  @ApiOperation({ summary: 'Bulk update applicant statuses' })
  bulkUpdateStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('id', ParseUUIDPipe) driveId: string,
    @Body() dto: BulkUpdateApplicationStatusDto,
  ) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.applicationsService.bulkUpdateStatus(user.collegeId, user.userId, driveId, dto);
  }

  @Get('drives/:id/applications/export')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('EXPORT_APPLICANTS_CSV', 'DriveApplication')
  @ApiOperation({ summary: 'Export applicant CSV with verified consent and formula sanitization' })
  async exportCsv(
    @CurrentUser() user: CurrentUserType,
    @Param('id', ParseUUIDPipe) driveId: string,
    @Res() res: Response,
  ) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    const result = await this.applicationsService.exportCsv(user.collegeId, driveId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="drive-${driveId}-applicants.csv"`);
    return res.send(result.csv);
  }
}
