import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { TenantGuard } from './tenant.guard';
import { Role } from '@campusedge/shared';

describe('Auth & Tenant Guards', () => {
  describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    beforeEach(() => {
      guard = new JwtAuthGuard();
    });

    it('should return user when authentication succeeds', () => {
      const user = { userId: 'u1', role: Role.STUDENT, collegeId: 'c1' };
      const result = guard.handleRequest(null, user, null);
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException on expired token', () => {
      expect(() => {
        guard.handleRequest(new Error('jwt expired'), null, { message: 'jwt expired' });
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong issuer', () => {
      expect(() => {
        guard.handleRequest(new Error('jwt issuer invalid'), null, {
          message: 'jwt issuer invalid',
        });
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong audience', () => {
      expect(() => {
        guard.handleRequest(new Error('jwt audience invalid'), null, {
          message: 'jwt audience invalid',
        });
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong algorithm', () => {
      expect(() => {
        guard.handleRequest(new Error('invalid algorithm'), null, { message: 'invalid algorithm' });
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not found', () => {
      expect(() => {
        guard.handleRequest(null, false, { message: 'No auth token' });
      }).toThrow(UnauthorizedException);
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RolesGuard(reflector);
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.STUDENT } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has the required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.COLLEGE_ADMIN, Role.SUPER_ADMIN]);
      const context = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.COLLEGE_ADMIN } }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user has wrong role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SUPER_ADMIN]);
      const context = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.STUDENT } }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('TenantGuard', () => {
    let guard: TenantGuard;

    beforeEach(() => {
      guard = new TenantGuard();
    });

    it('should allow SUPER_ADMIN to access any tenant', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'u1', role: Role.SUPER_ADMIN, collegeId: null },
            params: { collegeId: 'c2' },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow student accessing their own college', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'u1', role: Role.STUDENT, collegeId: 'c1' },
            params: { collegeId: 'c1' },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when student accesses different college', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'u1', role: Role.STUDENT, collegeId: 'c1' },
            params: { collegeId: 'c2' },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
