import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Audit } from '../audit/audit.decorator';
import { Role, CreateTopicDto, UpdateTopicDto, TopicQueryDto } from '@campusedge/shared';

@ApiTags('Topics')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'List topics (accessible to all authenticated users)' })
  list(@Query() query: TopicQueryDto) {
    return this.topicsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic details' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.topicsService.findById(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @Audit('CREATE_TOPIC', 'Topic')
  @ApiOperation({ summary: 'Create topic (Super Admin only)' })
  create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @Audit('UPDATE_TOPIC', 'Topic')
  @ApiOperation({ summary: 'Update topic (Super Admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTopicDto) {
    return this.topicsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @Audit('DELETE_TOPIC', 'Topic')
  @ApiOperation({ summary: 'Delete topic (Super Admin only)' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.topicsService.delete(id);
  }
}
