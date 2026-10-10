import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  controllers: [OnboardingController],
  providers: [OnboardingService, JwtStrategy],
  exports: [OnboardingService],
})
export class OnboardingModule {}
