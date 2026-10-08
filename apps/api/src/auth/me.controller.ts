import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { type CurrentUser as CurrentUserType } from '@campusedge/shared';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  @Get()
  @ApiOperation({ summary: 'Get current authenticated user identity and tenant context' })
  @ApiResponse({ status: 200, description: 'Current user profile details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: CurrentUserType) {
    return {
      success: true,
      data: user,
    };
  }
}
