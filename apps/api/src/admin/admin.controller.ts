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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import {
  Role,
  CurrentUser as CurrentUserType,
  CreateCollegeDto,
  UpdateCollegeDto,
  InviteCollegeAdminDto,
  UpdateUserStatusDto,
  UserStatus,
} from '@campusedge/shared';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Colleges ---

  @Get('colleges')
  @ApiOperation({ summary: 'List all colleges (Super Admin)' })
  listColleges(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listColleges(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Post('colleges')
  @Audit('CREATE_COLLEGE', 'College')
  @ApiOperation({ summary: 'Create a new college (Super Admin)' })
  createCollege(@Body() dto: CreateCollegeDto) {
    return this.adminService.createCollege(dto);
  }

  @Get('colleges/:id')
  @ApiOperation({ summary: 'Get college details (Super Admin)' })
  getCollege(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getCollege(id);
  }

  @Patch('colleges/:id')
  @Audit('UPDATE_COLLEGE', 'College')
  @ApiOperation({ summary: 'Update college details or status (Super Admin)' })
  updateCollege(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollegeDto) {
    return this.adminService.updateCollege(id, dto);
  }

  // --- Invitations ---

  @Post('colleges/:id/admins')
  @Audit('INVITE_COLLEGE_ADMIN', 'Invitation')
  @ApiOperation({ summary: 'Invite a college admin via server-side Admin API' })
  inviteAdmin(
    @Param('id', ParseUUIDPipe) collegeId: string,
    @Body() dto: InviteCollegeAdminDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.adminService.inviteCollegeAdmin(collegeId, dto.email, user.userId);
  }

  @Get('colleges/:id/admins')
  @ApiOperation({ summary: 'List admins and pending invitations for a college' })
  listAdmins(@Param('id', ParseUUIDPipe) collegeId: string) {
    return this.adminService.listCollegeAdmins(collegeId);
  }

  @Delete('colleges/:id/admins/:inviteId')
  @Audit('REVOKE_INVITATION', 'Invitation')
  @ApiOperation({ summary: 'Revoke a pending college admin invitation' })
  revokeInvite(
    @Param('id', ParseUUIDPipe) collegeId: string,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
  ) {
    return this.adminService.revokeInvitation(collegeId, inviteId);
  }

  // --- Users ---

  @Get('users')
  @ApiOperation({ summary: 'List users with filters (Super Admin)' })
  listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('collegeId') collegeId?: string,
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      { collegeId, role, status, search },
    );
  }

  @Patch('users/:id/status')
  @Audit('UPDATE_USER_STATUS', 'UserProfile')
  @ApiOperation({ summary: 'Suspend or reactivate a user account' })
  updateUserStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto);
  }

  // --- Audit ---

  @Get('audit')
  @ApiOperation({ summary: 'View global immutable audit logs' })
  listAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.listAuditLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
