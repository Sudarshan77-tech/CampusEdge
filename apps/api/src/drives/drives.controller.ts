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
import { DrivesService } from './drives.service';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import {
  Role,
  CurrentUser as CurrentUserType,
  CreateDriveDto,
  UpdateDriveDto,
  TransitionDriveStatusDto,
  DriveQueryDto,
} from '@campusedge/shared';

@ApiTags('Placement Drives')
@ApiBearerAuth()
@UseGuards(RolesGuard, TenantGuard)
@Controller('drives')
export class DrivesController {
  constructor(private readonly drivesService: DrivesService) {}

  @Get()
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'List drives with filters (students cannot view drafts)' })
  list(@CurrentUser() user: CurrentUserType, @Query() query: DriveQueryDto) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.drivesService.list(user.collegeId, user, query);
  }

  @Get(':id')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'Get drive detail with roles, eligibility, rounds' })
  findById(@CurrentUser() user: CurrentUserType, @Param('id', ParseUUIDPipe) id: string) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.drivesService.findById(user.collegeId, id, user);
  }

  @Get(':id/eligible-count')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get count of active students matching drive criteria' })
  getEligibleCount(@CurrentUser() user: CurrentUserType, @Param('id', ParseUUIDPipe) id: string) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.drivesService.getEligibleCount(user.collegeId, id);
  }

  @Post()
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('CREATE_DRIVE', 'Drive')
  @ApiOperation({ summary: 'Create placement drive with nested roles, eligibility, rounds' })
  create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateDriveDto) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.drivesService.create(user.collegeId, user.userId, dto);
  }

  @Patch(':id')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('UPDATE_DRIVE', 'Drive')
  @ApiOperation({ summary: 'Update placement drive with optimistic locking' })
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriveDto,
  ) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.drivesService.update(user.collegeId, id, dto);
  }

  @Post(':id/transition')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('TRANSITION_DRIVE_STATUS', 'Drive')
  @ApiOperation({ summary: 'Transition drive lifecycle status' })
  transitionStatus(
    @CurrentUser() user: CurrentUserType,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionDriveStatusDto,
  ) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.drivesService.transitionStatus(user.collegeId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('DELETE_DRIVE', 'Drive')
  @ApiOperation({ summary: 'Delete drive (only allowed if DRAFT with 0 applications)' })
  delete(@CurrentUser() user: CurrentUserType, @Param('id', ParseUUIDPipe) id: string) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.drivesService.delete(user.collegeId, id);
  }
}
