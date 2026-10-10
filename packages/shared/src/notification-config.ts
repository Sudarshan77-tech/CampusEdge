import { NotificationCategory } from './phase4-enums';

export interface CategoryMetadata {
  category: NotificationCategory;
  name: string;
  description: string;
  defaultInApp: boolean;
  defaultEmail: boolean;
  canOptOut: boolean;
  bypassQuietHours: boolean;
}

export const NOTIFICATION_CATEGORIES: Record<NotificationCategory, CategoryMetadata> = {
  [NotificationCategory.ACCOUNT_SECURITY]: {
    category: NotificationCategory.ACCOUNT_SECURITY,
    name: 'Account & Security Alerts',
    description: 'Login alerts, password changes, security notifications',
    defaultInApp: true,
    defaultEmail: true,
    canOptOut: false,
    bypassQuietHours: true,
  },
  [NotificationCategory.ACCOUNT_APPROVAL]: {
    category: NotificationCategory.ACCOUNT_APPROVAL,
    name: 'Account Verification & Approval',
    description: 'Registration approvals, onboarding status changes',
    defaultInApp: true,
    defaultEmail: true,
    canOptOut: false,
    bypassQuietHours: true,
  },
  [NotificationCategory.DRIVE_PUBLISHED]: {
    category: NotificationCategory.DRIVE_PUBLISHED,
    name: 'New Placement Drives',
    description: 'Notifications when eligible recruitment drives are published',
    defaultInApp: true,
    defaultEmail: true,
    canOptOut: true,
    bypassQuietHours: false,
  },
  [NotificationCategory.REGISTRATION_DEADLINE]: {
    category: NotificationCategory.REGISTRATION_DEADLINE,
    name: 'Application Deadlines',
    description: 'Urgent reminders 24h and 4h prior to drive registration close',
    defaultInApp: true,
    defaultEmail: true,
    canOptOut: true,
    bypassQuietHours: false,
  },
  [NotificationCategory.EVENT_REMINDER]: {
    category: NotificationCategory.EVENT_REMINDER,
    name: 'Interview & Drive Event Reminders',
    description: 'Schedule updates, room locations, online interview links',
    defaultInApp: true,
    defaultEmail: true,
    canOptOut: true,
    bypassQuietHours: true, // short-notice interview schedule updates must bypass
  },
  [NotificationCategory.APPLICATION_STATUS]: {
    category: NotificationCategory.APPLICATION_STATUS,
    name: 'Application Status Updates',
    description: 'Shortlisting announcements, offers, round transitions',
    defaultInApp: true,
    defaultEmail: true,
    canOptOut: true,
    bypassQuietHours: false,
  },
  [NotificationCategory.TEST_SCHEDULED]: {
    category: NotificationCategory.TEST_SCHEDULED,
    name: 'Assessments & Tests Scheduled',
    description: 'Invites to diagnostic tests, practice exams, college assessments',
    defaultInApp: true,
    defaultEmail: true,
    canOptOut: true,
    bypassQuietHours: false,
  },
  [NotificationCategory.TEST_REMINDER]: {
    category: NotificationCategory.TEST_REMINDER,
    name: 'Assessment Start Reminders',
    description: 'Reminders before online test window opens',
    defaultInApp: true,
    defaultEmail: false,
    canOptOut: true,
    bypassQuietHours: false,
  },
  [NotificationCategory.NOTICE]: {
    category: NotificationCategory.NOTICE,
    name: 'Placement Cell Notices',
    description: 'General official announcements from training and placement office',
    defaultInApp: true,
    defaultEmail: true,
    canOptOut: true,
    bypassQuietHours: false,
  },
  [NotificationCategory.EXPERIENCE_REVIEW]: {
    category: NotificationCategory.EXPERIENCE_REVIEW,
    name: 'Interview Experience Moderation',
    description: 'Approval or revision feedback on submitted interview experiences',
    defaultInApp: true,
    defaultEmail: false,
    canOptOut: true,
    bypassQuietHours: false,
  },
  [NotificationCategory.PREP_NUDGE]: {
    category: NotificationCategory.PREP_NUDGE,
    name: 'Preparation Nudges & Streaks',
    description: 'Recommended daily practice tasks and weak topic review prompts',
    defaultInApp: true,
    defaultEmail: false,
    canOptOut: true,
    bypassQuietHours: false,
  },
  [NotificationCategory.WEEKLY_DIGEST]: {
    category: NotificationCategory.WEEKLY_DIGEST,
    name: 'Weekly Placement Summary',
    description: 'Weekly digest of upcoming drives, practice metrics, and campus highlights',
    defaultInApp: false,
    defaultEmail: true,
    canOptOut: true,
    bypassQuietHours: false,
  },
};

export const QUIET_HOURS = {
  TIMEZONE: 'Asia/Kolkata',
  START_HOUR_IST: 22, // 10:00 PM
  END_HOUR_IST: 7, // 7:00 AM
};

export const DAILY_EMAIL_CAP_PER_USER = 6;

/**
 * Checks if current time in IST is within quiet hours.
 */
export function isCurrentlyQuietHours(date: Date = new Date()): boolean {
  // Convert date to IST (UTC + 5:30)
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();

  let istMinutes = utcMinutes + 30;
  let istHours = utcHours + 5;
  if (istMinutes >= 60) {
    istHours += 1;
    istMinutes -= 60;
  }
  istHours = istHours % 24;

  return istHours >= QUIET_HOURS.START_HOUR_IST || istHours < QUIET_HOURS.END_HOUR_IST;
}

/**
 * Computes deterministic deduplication key for notifications.
 */
export function generateNotificationDedupeKey(
  category: NotificationCategory,
  recipientId: string,
  entityId: string,
  timeBucket: string = 'once',
): string {
  return `${category}:${recipientId}:${entityId}:${timeBucket}`;
}
