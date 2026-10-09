import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NoticesService } from './notices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser as ReqUser } from '../auth/current-user.decorator';
import {
  CurrentUser,
  Role,
  createNoticeSchema,
  updateNoticeSchema,
  noticeQuerySchema,
} from '@campusedge/shared';

@Controller('notices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @Roles(Role.COLLEGE_ADMIN)
  async create(@ReqUser() user: CurrentUser, @Body() body: unknown) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    const parsed = createNoticeSchema.parse(body);
    return this.noticesService.create(user.collegeId, user.userId, parsed);
  }

  @Get()
  @Roles(Role.COLLEGE_ADMIN, Role.STUDENT)
  async list(@ReqUser() user: CurrentUser, @Query() query: unknown) {
    const parsed = noticeQuerySchema.parse(query);
    return this.noticesService.list(user, parsed);
  }

  @Get(':id')
  @Roles(Role.COLLEGE_ADMIN, Role.STUDENT)
  async findById(@Param('id') id: string, @ReqUser() user: CurrentUser) {
    return this.noticesService.findById(id, user);
  }

  @Patch(':id')
  @Roles(Role.COLLEGE_ADMIN)
  async update(@Param('id') id: string, @ReqUser() user: CurrentUser, @Body() body: unknown) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    const parsed = updateNoticeSchema.parse(body);
    return this.noticesService.update(id, user.collegeId, parsed);
  }

  @Delete(':id')
  @Roles(Role.COLLEGE_ADMIN)
  async delete(@Param('id') id: string, @ReqUser() user: CurrentUser) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    return this.noticesService.delete(id, user.collegeId);
  }

  @Post(':id/publish')
  @Roles(Role.COLLEGE_ADMIN)
  async publish(@Param('id') id: string, @ReqUser() user: CurrentUser) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    return this.noticesService.publish(id, user.collegeId);
  }

  @Post(':id/archive')
  @Roles(Role.COLLEGE_ADMIN)
  async archive(@Param('id') id: string, @ReqUser() user: CurrentUser) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    return this.noticesService.archive(id, user.collegeId);
  }

  @Post(':id/attachments')
  @Roles(Role.COLLEGE_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @ReqUser() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user.collegeId) throw new BadRequestException('College context required');
    if (!file) throw new BadRequestException('No file provided');
    return this.noticesService.uploadAttachment(id, user.collegeId, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });
  }

  @Get(':id/attachments/:attachmentId/signed-url')
  @Roles(Role.COLLEGE_ADMIN, Role.STUDENT)
  async getSignedUrl(@Param('attachmentId') attachmentId: string, @ReqUser() user: CurrentUser) {
    return this.noticesService.getAttachmentSignedUrl(attachmentId, user);
  }
}
