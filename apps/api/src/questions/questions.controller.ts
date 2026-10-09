import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser as ReqUser } from '../auth/current-user.decorator';
import {
  CurrentUser,
  Role,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionQueryDto,
  QuestionReportDto,
  ResolveReportDto,
  CreateQuestionGroupDto,
} from '@campusedge/shared';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async create(@Body() dto: CreateQuestionDto, @ReqUser() user: CurrentUser) {
    return this.questionsService.create(dto, user);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async list(@Query() query: QuestionQueryDto, @ReqUser() user: CurrentUser) {
    return this.questionsService.list(query, user);
  }

  @Get('review-queue')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async getReviewQueue(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @ReqUser() user: CurrentUser,
  ) {
    return this.questionsService.getReviewQueue(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      user,
    );
  }

  @Post('check-duplicate')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async checkDuplicate(
    @Body('stem') stem: string,
    @Body('excludeQuestionId') excludeQuestionId?: string,
  ) {
    return this.questionsService.checkStemSimilarity(stem, excludeQuestionId);
  }

  @Get('groups')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN, Role.STUDENT)
  async listGroups(@ReqUser() user: CurrentUser) {
    return this.questionsService.listGroups(user);
  }

  @Post('groups')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async createGroup(@Body() dto: CreateQuestionGroupDto, @ReqUser() user: CurrentUser) {
    return this.questionsService.createGroup(dto, user);
  }

  @Get('bookmarks')
  @Roles(Role.STUDENT)
  async listBookmarks(@ReqUser() user: CurrentUser) {
    return this.questionsService.listBookmarks(user);
  }

  @Post(':id/bookmark')
  @Roles(Role.STUDENT)
  async bookmark(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: CurrentUser) {
    return this.questionsService.bookmark(id, user);
  }

  @Delete(':id/bookmark')
  @Roles(Role.STUDENT)
  async removeBookmark(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: CurrentUser) {
    return this.questionsService.removeBookmark(id, user);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async findById(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: CurrentUser) {
    return this.questionsService.findById(id, user);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
    @ReqUser() user: CurrentUser,
  ) {
    return this.questionsService.update(id, dto, user);
  }

  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async approve(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: CurrentUser) {
    return this.questionsService.approve(id, user);
  }

  @Post(':id/retire')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async retire(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: CurrentUser) {
    return this.questionsService.retire(id, user);
  }

  @Post(':id/report')
  @Roles(Role.STUDENT, Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QuestionReportDto,
    @ReqUser() user: CurrentUser,
  ) {
    return this.questionsService.report(id, dto, user);
  }

  @Post(':id/resolve-report')
  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  async resolveReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReportDto,
    @ReqUser() user: CurrentUser,
  ) {
    return this.questionsService.resolveReport(id, dto, user);
  }
}
