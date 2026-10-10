export interface UnifiedCalendarEvent {
  id: string;
  source: 'DRIVE_EVENT' | 'COLLEGE_EVENT' | 'TEST_SCHEDULE';
  title: string;
  description?: string;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  mode: 'ONLINE' | 'OFFLINE';
  location?: string | null;
  meetingUrl?: string | null;
  collegeId: string;
  driveId?: string;
  companyName?: string;
  kind?: string;
  status: string;
}

export interface OverlapConflict {
  eventA: UnifiedCalendarEvent;
  eventB: UnifiedCalendarEvent;
}

/**
 * Normalizes and chronologically merges events from drive rounds, general college events, and test schedules.
 */
export function mergeCalendarEvents(
  driveEvents: Array<{
    id: string;
    title: string;
    description?: string | null;
    startsAt: Date | string;
    endsAt: Date | string;
    mode: string;
    location?: string | null;
    meetingUrl?: string | null;
    collegeId: string;
    driveId: string;
    kind: string;
    status: string;
    drive?: { company?: { name: string } };
  }>,
  collegeEvents: Array<{
    id: string;
    title: string;
    description?: string | null;
    startsAt: Date | string;
    endsAt: Date | string;
    mode: string;
    location?: string | null;
    meetingUrl?: string | null;
    collegeId: string;
    status: string;
  }>,
  schedules: Array<{
    id: string;
    title: string;
    startsAt: Date | string;
    endsAt: Date | string;
    collegeId: string;
    status: string;
  }> = [],
): UnifiedCalendarEvent[] {
  const unified: UnifiedCalendarEvent[] = [];

  for (const de of driveEvents) {
    unified.push({
      id: de.id,
      source: 'DRIVE_EVENT',
      title: de.title,
      description: de.description ?? undefined,
      startsAt: new Date(de.startsAt).toISOString(),
      endsAt: new Date(de.endsAt).toISOString(),
      mode: (de.mode as 'ONLINE' | 'OFFLINE') || 'OFFLINE',
      location: de.location,
      meetingUrl: de.meetingUrl,
      collegeId: de.collegeId,
      driveId: de.driveId,
      companyName: de.drive?.company?.name,
      kind: de.kind,
      status: de.status,
    });
  }

  for (const ce of collegeEvents) {
    unified.push({
      id: ce.id,
      source: 'COLLEGE_EVENT',
      title: ce.title,
      description: ce.description ?? undefined,
      startsAt: new Date(ce.startsAt).toISOString(),
      endsAt: new Date(ce.endsAt).toISOString(),
      mode: (ce.mode as 'ONLINE' | 'OFFLINE') || 'OFFLINE',
      location: ce.location,
      meetingUrl: ce.meetingUrl,
      collegeId: ce.collegeId,
      status: ce.status,
    });
  }

  for (const ts of schedules) {
    unified.push({
      id: ts.id,
      source: 'TEST_SCHEDULE',
      title: ts.title,
      startsAt: new Date(ts.startsAt).toISOString(),
      endsAt: new Date(ts.endsAt).toISOString(),
      mode: 'ONLINE',
      collegeId: ts.collegeId,
      status: ts.status,
    });
  }

  return unified.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

/**
 * Detects scheduling collisions and overlaps between calendar events.
 */
export function detectOverlaps(events: UnifiedCalendarEvent[]): OverlapConflict[] {
  const conflicts: OverlapConflict[] = [];

  for (let i = 0; i < events.length; i++) {
    const a = events[i];
    if (!a) continue;
    const aStart = new Date(a.startsAt).getTime();
    const aEnd = new Date(a.endsAt).getTime();

    for (let j = i + 1; j < events.length; j++) {
      const b = events[j];
      if (!b) continue;
      const bStart = new Date(b.startsAt).getTime();
      const bEnd = new Date(b.endsAt).getTime();

      // If b starts after a ends, since array is sorted, no subsequent items can overlap with a
      if (bStart >= aEnd) {
        break;
      }

      // Check overlap
      if (aStart < bEnd && bStart < aEnd) {
        conflicts.push({ eventA: a, eventB: b });
      }
    }
  }

  return conflicts;
}

/**
 * Determines whether a student should see an event based on institution/drive audience targeting.
 */
export function isEventVisibleTo(
  event: {
    source: string;
    audience?: string;
    targetBranchIds?: string[];
    targetBatchYears?: number[];
  },
  student: {
    branchId: string;
    batchYear: number;
    applicationStatus?: string | null;
  },
): boolean {
  if (event.source === 'DRIVE_EVENT') {
    switch (event.audience) {
      case 'SHORTLISTED':
        return (
          student.applicationStatus === 'SHORTLISTED' || student.applicationStatus === 'OFFERED'
        );
      case 'REGISTERED':
        return Boolean(
          student.applicationStatus &&
          student.applicationStatus !== 'NOT_APPLIED' &&
          student.applicationStatus !== 'REJECTED',
        );
      case 'ALL_ELIGIBLE':
      default:
        return true;
    }
  }

  if (event.source === 'COLLEGE_EVENT') {
    if (event.targetBranchIds && event.targetBranchIds.length > 0) {
      if (!event.targetBranchIds.includes(student.branchId)) {
        return false;
      }
    }
    if (event.targetBatchYears && event.targetBatchYears.length > 0) {
      if (!event.targetBatchYears.includes(student.batchYear)) {
        return false;
      }
    }
    return true;
  }

  return true;
}

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeIcsText(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/**
 * Pure RFC 5545 iCalendar feed generator.
 */
export function generateIcsFeed(
  events: UnifiedCalendarEvent[],
  calendarName: string = 'CampusEdge Calendar',
): string {
  const now = new Date();
  const dtstamp = formatIcsDate(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusEdge//Placement Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  for (const event of events) {
    const startDate = new Date(event.startsAt);
    const endDate = new Date(event.endsAt);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@campusedge.io`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${formatIcsDate(startDate)}`);
    lines.push(`DTEND:${formatIcsDate(endDate)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }

    const loc = event.location || event.meetingUrl;
    if (loc) {
      lines.push(`LOCATION:${escapeIcsText(loc)}`);
    }

    lines.push(`STATUS:${event.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
