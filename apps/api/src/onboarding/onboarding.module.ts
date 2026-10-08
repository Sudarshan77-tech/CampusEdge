import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  controllers: [OnboardingController],
  providers: [OnboardingService, PrismaService, JwtStrategy],
  exports: [OnboardingService],
})
export class OnboardingModule {}
