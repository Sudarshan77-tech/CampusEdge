import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser as ReqUser } from '../auth/current-user.decorator';
import {
  CurrentUser,
  Role,
  createExperienceSchema,
  updateExperienceSchema,
  moderateExperienceSchema,
  reportExperienceSchema,
  experienceQuerySchema,
} from '@campusedge/shared';

@Controller('experiences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Post()
  @Roles(Role.STUDENT)
  async create(@ReqUser() user: CurrentUser, @Body() body: unknown) {
    const parsed = createExperienceSchema.parse(body);
    return this.experiencesService.create(user, parsed);
  }

  @Get()
  @Roles(Role.STUDENT, Role.COLLEGE_ADMIN)
  async list(@ReqUser() user: CurrentUser, @Query() query: unknown) {
    const parsed = experienceQuerySchema.parse(query);
    return this.experiencesService.list(user, parsed);
  }

  @Get('mine')
  @Roles(Role.STUDENT)
  async findMine(@ReqUser() user: CurrentUser) {
    return this.experiencesService.findMine(user);
  }

  @Get('moderation')
  @Roles(Role.COLLEGE_ADMIN)
  async listModerationQueue(@ReqUser() user: CurrentUser, @Query() query: unknown) {
    const parsed = experienceQuerySchema.parse(query);
    return this.experiencesService.listModerationQueue(user, parsed);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  async findById(@Param('id') id: string, @ReqUser() user: CurrentUser) {
    return this.experiencesService.findById(id, user);
  }

  @Patch(':id')
  @Roles(Role.STUDENT)
  async update(@Param('id') id: string, @ReqUser() user: CurrentUser, @Body() body: unknown) {
    const parsed = updateExperienceSchema.parse(body);
    return this.experiencesService.update(id, user, parsed);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  async submit(@Param('id') id: string, @ReqUser() user: CurrentUser) {
    return this.experiencesService.submit(id, user);
  }

  @Post(':id/moderate')
  @Roles(Role.COLLEGE_ADMIN)
  async moderate(@Param('id') id: string, @ReqUser() user: CurrentUser, @Body() body: unknown) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    const parsed = moderateExperienceSchema.parse(body);
    return this.experiencesService.moderate(id, user.collegeId, user.userId, parsed);
  }

  @Post(':id/report')
  @Roles(Role.STUDENT)
  async report(@Param('id') id: string, @ReqUser() user: CurrentUser, @Body() body: unknown) {
    const parsed = reportExperienceSchema.parse(body);
    return this.experiencesService.report(id, user, parsed);
  }

  @Patch(':id/takedown')
  @Roles(Role.SUPER_ADMIN)
  async takedown(
    @Param('id') id: string,
    @ReqUser() user: CurrentUser,
    @Body() body: { reason: string },
  ) {
    if (!body?.reason) throw new BadRequestException('Takedown reason is required');
    return this.experiencesService.takedown(id, user.userId, body.reason);
  }
}
