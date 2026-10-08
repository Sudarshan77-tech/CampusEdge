import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService, JwtStrategy],
  exports: [AdminService],
})
export class AdminModule {}
