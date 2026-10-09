import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser as ReqUser } from '../auth/current-user.decorator';
import {
  CurrentUser,
  Role,
  ImportJobType,
  commitImportSchema,
  companyMappingItemSchema,
  importJobQuerySchema,
} from '@campusedge/shared';

@Controller('imports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('upload')
  @Roles(Role.COLLEGE_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @ReqUser() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type?: string,
  ) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    if (!file) throw new BadRequestException('File is required');

    const jobType = (type as ImportJobType) || ImportJobType.HISTORICAL_DRIVES;
    return this.importsService.uploadAndParse(
      user.collegeId,
      user.userId,
      {
        originalname: file.originalname,
        size: file.size,
        buffer: file.buffer,
      },
      jobType,
    );
  }

  @Get()
  @Roles(Role.COLLEGE_ADMIN)
  async list(@ReqUser() user: CurrentUser, @Query() query: unknown) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    const parsed = importJobQuerySchema.parse(query);
    return this.importsService.listJobs(user.collegeId, parsed);
  }

  @Get(':id/preview')
  @Roles(Role.COLLEGE_ADMIN)
  async preview(@Param('id') id: string, @ReqUser() user: CurrentUser) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    return this.importsService.getPreview(id, user.collegeId);
  }

  @Post(':id/resolve-company')
  @Roles(Role.COLLEGE_ADMIN)
  async resolveCompany(
    @Param('id') id: string,
    @ReqUser() user: CurrentUser,
    @Body() body: unknown,
  ) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    const parsed = companyMappingItemSchema.parse(body);
    return this.importsService.resolveCompany(id, user.collegeId, parsed);
  }

  @Post(':id/commit')
  @Roles(Role.COLLEGE_ADMIN)
  async commit(@Param('id') id: string, @ReqUser() user: CurrentUser, @Body() body: unknown) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    const parsed = commitImportSchema.parse(body);
    return this.importsService.commit(id, user.collegeId, user.userId, parsed);
  }

  @Get(':id/errors.csv')
  @Roles(Role.COLLEGE_ADMIN)
  async downloadErrors(
    @Param('id') id: string,
    @ReqUser() user: CurrentUser,
    @Res() res: Response,
  ) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    const { fileName, csvContent } = await this.importsService.getErrorsCsv(id, user.collegeId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(csvContent);
  }
}
