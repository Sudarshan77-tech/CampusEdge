import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../prisma.service';
import { CurrentUser, Role, UserStatus } from '@campusedge/shared';

interface CachedProfile {
  user: CurrentUser;
  expiresAt: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // In-memory profile cache (max 30s TTL)
  private readonly profileCache = new Map<string, CachedProfile>();
  private readonly CACHE_TTL_MS = 30 * 1000;

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl =
      configService.get<string>('NEXT_PUBLIC_SUPABASE_URL') ||
      configService.get<string>('SUPABASE_URL') ||
      '';
    const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');

    // Strict algorithm pinning: HS256 for symmetric secret; RS256/ES256 for JWKS
    const algorithms = (jwtSecret ? ['HS256'] : ['RS256', 'ES256']) as Array<
      'HS256' | 'RS256' | 'ES256'
    >;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
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
      algorithms,
    });
  }

  // Allow cache invalidation on role or status change
  invalidateCache(userId: string): void {
    this.profileCache.delete(userId);
  }

  async validate(payload: { sub: string; email?: string }): Promise<CurrentUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid JWT payload: missing sub claim');
    }

    const now = Date.now();
    const cached = this.profileCache.get(payload.sub);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    // Authoritative lookup from UserProfile table
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: payload.sub },
    });

    if (!profile) {
      throw new UnauthorizedException(
        'User profile not found. User must be registered in the platform.',
      );
    }

    if (profile.status === UserStatus.SUSPENDED || profile.status === UserStatus.DEACTIVATED) {
      throw new UnauthorizedException('User account is suspended or deactivated.');
    }

    const currentUser: CurrentUser = {
      userId: profile.id,
      role: profile.role as Role,
      status: profile.status as UserStatus,
      collegeId: profile.collegeId,
      email: profile.email || payload.email,
    };

    this.profileCache.set(payload.sub, {
      user: currentUser,
      expiresAt: now + this.CACHE_TTL_MS,
    });

    return currentUser;
  }
}
