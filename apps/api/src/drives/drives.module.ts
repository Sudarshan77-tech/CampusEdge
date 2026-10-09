import { Module } from '@nestjs/common';
import { DrivesController } from './drives.controller';
import { DrivesService } from './drives.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DrivesController],
  providers: [DrivesService, PrismaService],
  exports: [DrivesService],
})
export class DrivesModule {}
