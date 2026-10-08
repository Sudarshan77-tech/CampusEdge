import { Controller, Get, Put, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import {
  CurrentUser as CurrentUserType,
  UpdateStudentProfileDto,
  CreateDataRequestDto,
} from '@campusedge/shared';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me/profile')
  @ApiOperation({ summary: 'Get current student profile and completion status' })
  getMyProfile(@CurrentUser() user: CurrentUserType) {
    return this.studentsService.getMyProfile(user);
  }

  @Put('me/profile')
  @Audit('UPDATE_STUDENT_PROFILE', 'StudentProfile')
  @ApiOperation({ summary: 'Update current student profile and skills' })
  updateMyProfile(@CurrentUser() user: CurrentUserType, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.updateMyProfile(user, dto);
  }

  @Get('skills-catalog')
  @ApiOperation({ summary: 'List all available skills from the global catalog' })
  listSkillsCatalog() {
    return this.studentsService.listSkillsCatalog();
  }

  @Post('me/data-requests')
  @Audit('CREATE_DATA_REQUEST', 'DataRequest')
  @ApiOperation({ summary: 'Submit DPDP data export or account deletion request' })
  createDataRequest(@CurrentUser() user: CurrentUserType, @Body() dto: CreateDataRequestDto) {
    return this.studentsService.createDataRequest(user, dto);
  }

  @Get('me/data-requests')
  @ApiOperation({ summary: 'List all DPDP data requests submitted by current user' })
  listDataRequests(@CurrentUser() user: CurrentUserType) {
    return this.studentsService.listDataRequests(user);
  }
}
