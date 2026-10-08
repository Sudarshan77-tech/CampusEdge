import { Module } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { CollegesController } from './colleges.controller';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  controllers: [CollegesController],
  providers: [CollegesService, PrismaService, JwtStrategy],
  exports: [CollegesService],
})
export class CollegesModule {}
