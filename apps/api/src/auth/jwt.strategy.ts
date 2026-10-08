import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../prisma.service';
import { CurrentUser, Role } from '@campusedge/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL') || '';
    const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: jwtSecret
        ? (_req: unknown, _rawJwtToken: unknown, done: (err: unknown, secret?: string) => void) => {
            done(null, jwtSecret);
          }
        : passportJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
          }),
      algorithms: jwtSecret ? ['HS256'] : ['RS256', 'ES256'],
    });
  }

  async validate(payload: { sub: string; email?: string }): Promise<CurrentUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid JWT payload: missing sub claim');
    }

    // Server-side lookup from UserProfile table ensures authoritative role and tenant context
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: payload.sub },
    });

    if (!profile) {
      throw new UnauthorizedException(
        'User profile not found. User must be registered in the platform.',
      );
    }

    return {
      userId: profile.id,
      role: profile.role as Role,
      collegeId: profile.collegeId,
      email: profile.email || payload.email,
    };
  }
}
