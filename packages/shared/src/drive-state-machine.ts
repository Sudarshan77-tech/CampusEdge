import { DriveStatus } from './phase2-enums';

export interface DriveTransitionContext {
  roleCount?: number;
  hasEligibility?: boolean;
  registrationDeadline?: Date | string | null;
  isHistorical?: boolean;
  applicationCount?: number;
  now?: Date;
}

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Pure function to validate state transitions in the Placement Drive lifecycle.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export function canTransitionDrive(
  current: DriveStatus,
  next: DriveStatus,
  context: DriveTransitionContext = {},
): TransitionResult {
  if (current === next) {
    return { allowed: true };
  }

  // Terminal states cannot transition to anything else
  if (current === DriveStatus.COMPLETED) {
    return {
      allowed: false,
      reason: 'Completed drives cannot transition to another status.',
    };
  }
  if (current === DriveStatus.CANCELLED) {
    return {
      allowed: false,
      reason: 'Cancelled drives cannot transition to another status.',
    };
  }

  const now = context.now ?? new Date();

  switch (current) {
    case DriveStatus.DRAFT: {
      if (next === DriveStatus.CANCELLED) {
        return { allowed: true };
      }

      // Historical drives can go directly to COMPLETED or PUBLISHED
      if (context.isHistorical) {
        if (next === DriveStatus.COMPLETED || next === DriveStatus.PUBLISHED) {
          return { allowed: true };
        }
      }

      if (next === DriveStatus.PUBLISHED) {
        // Enforce prerequisites for publishing live drives
        if (context.roleCount !== undefined && context.roleCount <= 0) {
          return {
            allowed: false,
            reason: 'Publishing requires at least one designated job role.',
          };
        }

        if (context.hasEligibility !== undefined && !context.hasEligibility) {
          return {
            allowed: false,
            reason: 'Publishing requires defining eligibility criteria.',
          };
        }

        if (!context.isHistorical) {
          if (!context.registrationDeadline) {
            return {
              allowed: false,
              reason: 'Publishing requires a valid registration deadline.',
            };
          }
          const deadline = new Date(context.registrationDeadline);
          if (isNaN(deadline.getTime()) || deadline <= now) {
            return {
              allowed: false,
              reason: 'Registration deadline must be set in the future to publish.',
            };
          }
        }

        return { allowed: true };
      }

      return {
        allowed: false,
        reason: `Cannot transition from ${current} to ${next}. Must be PUBLISHED or CANCELLED first.`,
      };
    }

    case DriveStatus.PUBLISHED: {
      if (next === DriveStatus.CANCELLED) {
        return { allowed: true };
      }
      if (next === DriveStatus.REGISTRATION_OPEN) {
        return { allowed: true };
      }
      if (context.isHistorical && next === DriveStatus.COMPLETED) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot transition from ${current} to ${next}.`,
      };
    }

    case DriveStatus.REGISTRATION_OPEN: {
      if (next === DriveStatus.REGISTRATION_CLOSED) {
        return { allowed: true };
      }
      if (next === DriveStatus.CANCELLED) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot transition from ${current} to ${next}. Close registrations or cancel first.`,
      };
    }

    case DriveStatus.REGISTRATION_CLOSED: {
      if (next === DriveStatus.IN_PROGRESS) {
        return { allowed: true };
      }
      // Reopening registration is permitted if needed
      if (next === DriveStatus.REGISTRATION_OPEN) {
        return { allowed: true };
      }
      if (next === DriveStatus.CANCELLED) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot transition from ${current} to ${next}.`,
      };
    }

    case DriveStatus.IN_PROGRESS: {
      if (next === DriveStatus.COMPLETED) {
        return { allowed: true };
      }
      if (next === DriveStatus.CANCELLED) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot transition from ${current} to ${next}.`,
      };
    }

    default:
      return {
        allowed: false,
        reason: `Unrecognized drive status transition: ${current} to ${next}.`,
      };
  }
}
