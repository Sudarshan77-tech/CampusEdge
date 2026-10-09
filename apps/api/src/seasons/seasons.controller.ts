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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeasonsService } from './seasons.service';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import {
  Role,
  CurrentUser as CurrentUserType,
  CreateSeasonDto,
  UpdateSeasonDto,
  SeasonQueryDto,
} from '@campusedge/shared';

@ApiTags('Placement Seasons')
@ApiBearerAuth()
@UseGuards(RolesGuard, TenantGuard)
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get()
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'List placement seasons for current college' })
  list(@CurrentUser() user: CurrentUserType, @Query() query: SeasonQueryDto) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.seasonsService.list(user.collegeId, query);
  }

  @Get('current')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'Get current active placement season for college' })
  getCurrent(@CurrentUser() user: CurrentUserType) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.seasonsService.getCurrent(user.collegeId);
  }

  @Get(':id')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'Get season detail' })
  findById(@CurrentUser() user: CurrentUserType, @Param('id', ParseUUIDPipe) id: string) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.seasonsService.findById(user.collegeId, id);
  }

  @Post()
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('CREATE_SEASON', 'PlacementSeason')
  @ApiOperation({ summary: 'Create placement season' })
  create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateSeasonDto) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.seasonsService.create(user.collegeId, dto);
  }

  @Patch(':id')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('UPDATE_SEASON', 'PlacementSeason')
  @ApiOperation({ summary: 'Update placement season (optimistic lock with rowVersion)' })
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSeasonDto,
  ) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.seasonsService.update(user.collegeId, id, dto);
  }

  @Post(':id/set-current')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('SET_CURRENT_SEASON', 'PlacementSeason')
  @ApiOperation({ summary: 'Set season as current active placement season' })
  setCurrent(@CurrentUser() user: CurrentUserType, @Param('id', ParseUUIDPipe) id: string) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.seasonsService.setCurrent(user.collegeId, id);
  }
}
