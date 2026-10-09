import { Module } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TestsController],
  providers: [TestsService, PrismaService],
  exports: [TestsService],
})
export class TestsModule {}
