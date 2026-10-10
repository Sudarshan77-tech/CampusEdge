import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser as ReqUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  CurrentUser,
  QueryNotificationsSchema,
  MarkNotificationsReadSchema,
  UpdateNotificationPreferencesSchema,
} from '@campusedge/shared';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notifications and unread counter' })
  async getMyNotifications(@ReqUser() user: CurrentUser, @Query() query: unknown) {
    const parsedQuery = QueryNotificationsSchema.parse(query);
    return this.notificationsService.getMyNotifications(user.userId, parsedQuery);
  }

  @Patch('me/:id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark single notification as read' })
  async markSingleRead(@ReqUser() user: CurrentUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.userId, [id]);
  }

  @Post('me/read-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@ReqUser() user: CurrentUser) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Post('me/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark batch of notifications as read' })
  async markBatchRead(@ReqUser() user: CurrentUser, @Body() body: unknown) {
    const parsed = MarkNotificationsReadSchema.parse(body);
    return this.notificationsService.markAsRead(user.userId, parsed.notificationIds);
  }

  @Get('me/preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification category preferences for current user' })
  async getMyPreferences(@ReqUser() user: CurrentUser) {
    return this.notificationsService.getMyPreferences(user.userId);
  }

  @Put('me/preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification category preferences' })
  async updateMyPreferences(@ReqUser() user: CurrentUser, @Body() body: unknown) {
    const parsed = UpdateNotificationPreferencesSchema.parse(body);
    return this.notificationsService.updateMyPreferences(
      user.userId,
      user.collegeId || undefined,
      parsed.preferences,
    );
  }

  // ---------------------------------------------------------------------------
  // Public Unsubscribe Endpoints
  // ---------------------------------------------------------------------------

  @Public()
  @Get('unsubscribe')
  @ApiOperation({ summary: 'Validate unsubscribe token and render status' })
  async verifyUnsubscribe(@Query('token') token: string) {
    return this.notificationsService.unsubscribeByToken(token);
  }

  @Public()
  @Post('unsubscribe')
  @ApiOperation({ summary: 'Execute one-click email unsubscribe via signed token' })
  async executeUnsubscribe(@Body('token') token: string) {
    return this.notificationsService.unsubscribeByToken(token);
  }
}

@ApiTags('Internal Jobs')
@Controller('internal/notifications')
export class InternalNotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('process-outbox')
  @ApiOperation({ summary: 'Worker endpoint to drain pending transactional emails in DB outbox' })
  @ApiResponse({ status: 200, description: 'Batch execution metrics' })
  async processOutbox(
    @Headers('x-job-secret') headerSecret?: string,
    @Headers('authorization') authHeader?: string,
    @Body('batchSize') batchSize?: number,
  ) {
    const expectedSecret = this.configService.get<string>('INTERNAL_JOB_SECRET');
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const provided = headerSecret || bearerSecret;

    if (!expectedSecret || provided !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing internal job secret');
    }

    const safeBatchSize =
      typeof batchSize === 'number' && batchSize > 0 ? Math.min(batchSize, 100) : 20;
    return this.notificationsService.processOutbox(safeBatchSize);
  }
}
