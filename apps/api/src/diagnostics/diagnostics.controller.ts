import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { type CurrentUser as CurrentUserType } from '@campusedge/shared';
import { DiagnosticsService } from './diagnostics.service';

@ApiTags('Diagnostics Assessment')
@ApiBearerAuth()
@Controller('diagnostics')
@UseGuards(JwtAuthGuard)
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post('start')
  @ApiOperation({
    summary:
      'Start a 45-question diagnostic baseline test (enforces 14-day cooldown and single attempt limit)',
  })
  startDiagnostic(@CurrentUser() user: CurrentUserType) {
    return this.diagnosticsService.startDiagnostic(user);
  }
}
