import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TestsService, CreateTestTemplateDto, CreateTestScheduleDto } from './tests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser as ReqUser } from '../auth/current-user.decorator';
import { CurrentUser, Role, TestTemplateKind } from '@campusedge/shared';

@Controller('tests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get('templates')
  async listTemplates(@ReqUser() user: CurrentUser, @Query('kind') kind?: TestTemplateKind) {
    return this.testsService.listTemplates(kind, user);
  }

  @Get('templates/:id')
  async getTemplate(@ReqUser() user: CurrentUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.testsService.getTemplateById(id, user);
  }

  @Post('templates')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  async createTemplate(@ReqUser() user: CurrentUser, @Body() dto: CreateTestTemplateDto) {
    return this.testsService.createTemplate(dto, user);
  }

  @Get('schedules')
  async listSchedules(@ReqUser() user: CurrentUser) {
    return this.testsService.listSchedules(user);
  }

  @Get('schedules/:id')
  async getSchedule(@ReqUser() user: CurrentUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.testsService.getScheduleById(id, user);
  }

  @Post('schedules')
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  async createSchedule(@ReqUser() user: CurrentUser, @Body() dto: CreateTestScheduleDto) {
    return this.testsService.createSchedule(dto, user);
  }
}
