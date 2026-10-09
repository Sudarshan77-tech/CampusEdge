import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Audit } from '../audit/audit.decorator';
import {
  Role,
  CurrentUser as CurrentUserType,
  CreateCompanyDto,
  UpdateCompanyDto,
  VerifyCompanyDto,
  MergeCompanyDto,
  CompanyQueryDto,
} from '@campusedge/shared';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'List companies with visibility restrictions' })
  list(@CurrentUser() user: CurrentUserType, @Query() query: CompanyQueryDto) {
    return this.companiesService.list(user, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search companies for auto-complete' })
  search(@CurrentUser() user: CurrentUserType, @Query('q') q: string) {
    return this.companiesService.search(q || '', user);
  }

  @Post()
  @Roles(Role.COLLEGE_ADMIN, Role.SUPER_ADMIN)
  @Audit('CREATE_COMPANY', 'Company')
  @ApiOperation({ summary: 'Create company (with duplicate and similarity check)' })
  create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user, dto);
  }

  @Get('pending')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List companies pending review (Super Admin only)' })
  listPending(@Query() query: CompanyQueryDto) {
    return this.companiesService.listPending(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company details' })
  findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserType) {
    return this.companiesService.findById(id, user);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @Audit('UPDATE_COMPANY', 'Company')
  @ApiOperation({ summary: 'Update company details (Super Admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @Post(':id/verify')
  @Roles(Role.SUPER_ADMIN)
  @Audit('VERIFY_COMPANY', 'Company')
  @ApiOperation({ summary: 'Verify or reject company (Super Admin only)' })
  verify(@Param('id', ParseUUIDPipe) id: string, @Body() dto: VerifyCompanyDto) {
    return this.companiesService.verify(id, dto);
  }

  @Post(':id/merge')
  @Roles(Role.SUPER_ADMIN)
  @Audit('MERGE_COMPANY', 'Company')
  @ApiOperation({ summary: 'Merge company A into company B (Super Admin only)' })
  merge(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MergeCompanyDto) {
    return this.companiesService.merge(id, dto);
  }
}
