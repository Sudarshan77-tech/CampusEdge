import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollegesService } from './colleges.service';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import {
  Role,
  CurrentUser as CurrentUserType,
  UpdateCollegeSettingsDto,
  CreateBranchDto,
  UpdateBranchDto,
  StudentDecisionDto,
  UserStatus,
} from '@campusedge/shared';

@ApiTags('Colleges')
@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  // --- Public Discovery ---

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Search active colleges for onboarding (Public, Throttled)' })
  searchPublicColleges(@Query('q') query?: string) {
    return this.collegesService.searchPublicColleges(query);
  }

  // --- College Admin Tenant-Scoped Endpoints ---

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Get('my-college')
  @ApiOperation({ summary: 'Get own college settings and details' })
  getMyCollege(@CurrentUser() user: CurrentUserType) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.getMyCollege(user.collegeId);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Patch('my-college')
  @Audit('UPDATE_COLLEGE_SETTINGS', 'College')
  @ApiOperation({ summary: 'Update own college settings' })
  updateMyCollege(@CurrentUser() user: CurrentUserType, @Body() dto: UpdateCollegeSettingsDto) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.updateMyCollegeSettings(user.collegeId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Get('my-college/branches')
  @ApiOperation({ summary: 'List branches of own college' })
  listBranches(@CurrentUser() user: CurrentUserType) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.listBranches(user.collegeId);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Post('my-college/branches')
  @Audit('CREATE_BRANCH', 'Branch')
  @ApiOperation({ summary: 'Create a new branch in own college' })
  createBranch(@CurrentUser() user: CurrentUserType, @Body() dto: CreateBranchDto) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.createBranch(user.collegeId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Patch('my-college/branches/:branchId')
  @Audit('UPDATE_BRANCH', 'Branch')
  @ApiOperation({ summary: 'Update a branch in own college' })
  updateBranch(
    @CurrentUser() user: CurrentUserType,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: UpdateBranchDto,
  ) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.updateBranch(user.collegeId, branchId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Delete('my-college/branches/:branchId')
  @Audit('DEACTIVATE_BRANCH', 'Branch')
  @ApiOperation({ summary: 'Deactivate a branch in own college' })
  deactivateBranch(
    @CurrentUser() user: CurrentUserType,
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.deactivateBranch(user.collegeId, branchId);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Get('my-college/students')
  @ApiOperation({ summary: 'List and filter students belonging to own college' })
  listStudents(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
    @Query('batchYear') batchYear?: string,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.listCollegeStudents(
      user.collegeId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      {
        branchId,
        batchYear: batchYear ? parseInt(batchYear, 10) : undefined,
        status,
        search,
      },
    );
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Patch('my-college/students/:userId/decision')
  @Audit('DECIDE_STUDENT_STATUS', 'StudentProfile')
  @ApiOperation({ summary: 'Approve, reject, or suspend a student registration' })
  decideStudent(
    @CurrentUser() user: CurrentUserType,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() dto: StudentDecisionDto,
  ) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.decideStudent(user.collegeId, targetUserId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Get('my-college/audit')
  @ApiOperation({ summary: 'View own college immutable audit logs' })
  listAudit(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.listCollegeAuditLogs(
      user.collegeId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Get('my-college/stats')
  @ApiOperation({ summary: 'Get student breakdown statistics for own college' })
  getStats(@CurrentUser() user: CurrentUserType) {
    if (!user.collegeId) throw new ForbiddenException('User is not associated with any college');
    return this.collegesService.getCollegeStats(user.collegeId);
  }
}
