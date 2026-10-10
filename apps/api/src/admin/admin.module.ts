import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  controllers: [AdminController],
  providers: [AdminService, JwtStrategy],
  exports: [AdminService],
})
export class AdminModule {}
