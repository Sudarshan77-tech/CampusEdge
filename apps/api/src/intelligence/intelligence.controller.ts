import { Controller, Get, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser as ReqUser } from '../auth/current-user.decorator';
import { CurrentUser, Role } from '@campusedge/shared';

@Controller('intelligence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Get('recruiters')
  @Roles(Role.COLLEGE_ADMIN, Role.STUDENT)
  async getRecruiters(@ReqUser() user: CurrentUser, @Query('search') search?: string) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.intelligenceService.getRecruiters(user.collegeId, search);
  }

  @Get('companies/:id')
  @Roles(Role.COLLEGE_ADMIN, Role.STUDENT)
  async getCompanyIntelligence(@Param('id') id: string, @ReqUser() user: CurrentUser) {
    if (!user.collegeId) throw new ForbiddenException('College context required');
    return this.intelligenceService.getCompanyIntelligence(id, user.collegeId);
  }
}
