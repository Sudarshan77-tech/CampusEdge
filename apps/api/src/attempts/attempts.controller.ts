import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Headers,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AttemptsService,
  StartAttemptDto,
  SaveAnswerDto,
  RecordEventDto,
} from './attempts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser as ReqUser } from '../auth/current-user.decorator';
import { CurrentUser, Role } from '@campusedge/shared';

@Controller('attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  @Roles(Role.STUDENT)
  async startAttempt(@Body() dto: StartAttemptDto, @ReqUser() user: CurrentUser) {
    return this.attemptsService.startAttempt(dto, user);
  }

  @Get('active')
  @Roles(Role.STUDENT)
  async getActiveAttempt(@ReqUser() user: CurrentUser) {
    return this.attemptsService.getActiveAttempt(user);
  }

  @Get(':id')
  async getAttempt(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: CurrentUser) {
    return this.attemptsService.getAttempt(id, user);
  }

  @Get(':id/questions/:pos')
  @Roles(Role.STUDENT)
  async getQuestionAtPosition(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('pos', ParseIntPipe) pos: number,
    @ReqUser() user: CurrentUser,
  ) {
    return this.attemptsService.getQuestionAtPosition(id, pos, user);
  }

  @Put(':id/answers/:pos')
  @Roles(Role.STUDENT)
  async saveAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('pos', ParseIntPipe) pos: number,
    @Body() dto: SaveAnswerDto,
    @ReqUser() user: CurrentUser,
  ) {
    return this.attemptsService.saveAnswer(id, pos, dto, user);
  }

  @Post(':id/events')
  @Roles(Role.STUDENT)
  async recordEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordEventDto,
    @ReqUser() user: CurrentUser,
  ) {
    return this.attemptsService.recordEvent(id, dto, user);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  async submitAttempt(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: CurrentUser) {
    return this.attemptsService.submitAttempt(id, user);
  }

  @Post(':id/abandon')
  @Roles(Role.STUDENT)
  async abandonAttempt(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: CurrentUser) {
    return this.attemptsService.abandonAttempt(id, user);
  }

  @Get(':id/review')
  async getAttemptReview(@Param('id', ParseUUIDPipe) id: string, @ReqUser() user: CurrentUser) {
    return this.attemptsService.getAttemptReview(id, user);
  }

  @Post('admin/finalize-expired')
  @Roles(Role.SUPER_ADMIN)
  async finalizeExpiredAdmin() {
    return this.attemptsService.finalizeExpiredAttempts();
  }
}

@Controller('internal/attempts')
export class InternalAttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('finalize-expired')
  async finalizeExpired(@Headers('x-internal-secret') internalSecret?: string) {
    const expectedSecret = process.env.INTERNAL_SWEEPER_SECRET || 'dev-internal-secret';
    if (!internalSecret || internalSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing internal sweeper secret');
    }
    return this.attemptsService.finalizeExpiredAttempts();
  }
}
