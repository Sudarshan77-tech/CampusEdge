import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { TenantGuard } from './tenant.guard';
import { MeController } from './me.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [MeController],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, TenantGuard, PrismaService],
  exports: [JwtAuthGuard, RolesGuard, TenantGuard, PassportModule],
})
export class AuthModule {}
