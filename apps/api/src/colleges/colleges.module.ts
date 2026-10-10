import { Module } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { CollegesController } from './colleges.controller';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  controllers: [CollegesController],
  providers: [CollegesService, JwtStrategy],
  exports: [CollegesService],
})
export class CollegesModule {}
