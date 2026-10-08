import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import {
  CurrentUser as CurrentUserType,
  ChooseCollegeDto,
  RecordConsentDto,
  UpdateStudentProfileDto,
} from '@campusedge/shared';
import { Request } from 'express';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('college')
  @Audit('CHOOSE_COLLEGE', 'UserProfile')
  @ApiOperation({ summary: 'Select college during student onboarding' })
  chooseCollege(@CurrentUser() user: CurrentUserType, @Body() dto: ChooseCollegeDto) {
    return this.onboardingService.chooseCollege(user, dto);
  }

  @Post('consent')
  @Audit('RECORD_CONSENT', 'ConsentRecord')
  @ApiOperation({ summary: 'Record immutable legal consent (Terms, Privacy, DPDP)' })
  recordConsent(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: RecordConsentDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];
    return this.onboardingService.recordConsent(user, dto, {
      ipAddress: ip,
      userAgent,
    });
  }

  @Get('consents')
  @ApiOperation({ summary: 'List recorded legal consents for current user' })
  listConsents(@CurrentUser() user: CurrentUserType) {
    return this.onboardingService.listConsents(user);
  }

  @Post('profile')
  @Audit('COMPLETE_STUDENT_ONBOARDING', 'StudentProfile')
  @ApiOperation({ summary: 'Complete student academic profile and evaluate activation rule' })
  saveStudentProfile(@CurrentUser() user: CurrentUserType, @Body() dto: UpdateStudentProfileDto) {
    return this.onboardingService.saveStudentProfile(user, dto);
  }

  @Post('accept-invitation')
  @Audit('ACCEPT_INVITATION', 'Invitation')
  @ApiOperation({ summary: 'Accept a pending College Admin invitation and elevate role' })
  acceptInvitation(@CurrentUser() user: CurrentUserType) {
    return this.onboardingService.acceptInvitation(user);
  }
}
