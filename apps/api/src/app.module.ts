import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './env.validation';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { CollegesModule } from './colleges/colleges.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { StudentsModule } from './students/students.module';
import { CompaniesModule } from './companies/companies.module';
import { SeasonsModule } from './seasons/seasons.module';
import { DrivesModule } from './drives/drives.module';
import { ApplicationsModule } from './applications/applications.module';
import { TopicsModule } from './topics/topics.module';
import { NoticesModule } from './notices/notices.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { ImportsModule } from './imports/imports.module';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
    AuditModule,
    AuthModule,
    AdminModule,
    CollegesModule,
    OnboardingModule,
    StudentsModule,
    CompaniesModule,
    SeasonsModule,
    DrivesModule,
    ApplicationsModule,
    TopicsModule,
    NoticesModule,
    ExperiencesModule,
    IntelligenceModule,
    ImportsModule,
  ],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
