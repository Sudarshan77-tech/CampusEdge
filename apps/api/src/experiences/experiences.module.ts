import { Module } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { ExperiencesController } from './experiences.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ExperiencesController],
  providers: [ExperiencesService, PrismaService],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
