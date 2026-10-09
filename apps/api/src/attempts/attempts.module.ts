import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController, InternalAttemptsController } from './attempts.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AttemptsController, InternalAttemptsController],
  providers: [AttemptsService, PrismaService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
