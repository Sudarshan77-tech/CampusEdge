import { describe, it, expect } from 'vitest';

import {
  computeCompanyMatch,
  assertCleanMatchInput,
  CompanyMatchInput,
} from './company-match-engine';
import {
  computeCompanyPriority,
  assertCleanPriorityInput,
  CompanyPriorityInput,
} from './company-priority-engine';
import {
  buildCompanySyllabus,
  buildCompanyPattern,
  generateCompanyPrepFocus,
} from './company-preparation-engine';
import {
  mergeCalendarEvents,
  detectOverlaps,
  isEventVisibleTo,
  generateIcsFeed,
} from './calendar-engine';
import { CompanyMatchConfidence, CompanyPriorityTier, RoleFamily } from './phase4-enums';
import { generateNotificationDedupeKey, isCurrentlyQuietHours } from './notification-config';
import { NotificationCategory } from './phase4-enums';

describe('Phase 4 Pure Domain Logic: Company Intelligence & Calendar', () => {
  describe('Company Match Engine - Whitelist & Security Enforcement', () => {
    it('should reject inputs containing forbidden demographic or identity keys', () => {
      const forbiddenInputs = [
        { gender: 'female' },
        { caste: 'general' },
        { religion: 'hindu' },
        { age: 21 },
        { family_income: 500000 },
        { disability: 'none' },
      ];

      for (const forbidden of forbiddenInputs) {
        expect(() => {
          assertCleanMatchInput({
            studentSkills: [],
            studentTopicMastery: [],
            readinessScore: 75,
            companyRequiredSkills: [],
            companyRequiredTopics: [],
            ...forbidden,
          });
        }).toThrow(/Scoring Integrity Violation: Demographic or proxy field/);
      }
    });

    it('should reject unapproved non-whitelist input keys', () => {
      expect(() => {
        assertCleanMatchInput({
          studentSkills: [],
          studentTopicMastery: [],
          readinessScore: null,
          companyRequiredSkills: [],
          companyRequiredTopics: [],
          arbitrarySecretField: 123,
        });
      }).toThrow(/Scoring Integrity Violation: Unknown or unauthorized input key/);
    });

    it('should compute match score deterministically with bounds [0, 100]', () => {
      const input: CompanyMatchInput = {
        studentSkills: [
          { name: 'TypeScript', proficiency: 'ADVANCED' },
          { name: 'Node.js', proficiency: 'INTERMEDIATE' },
        ],
        studentTopicMastery: [
          { slug: 'data-structures', mastery: 0.8 },
          { slug: 'algorithms', mastery: 0.75 },
        ],
        readinessScore: 80,
        companyRequiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
        companyRequiredTopics: ['data-structures', 'algorithms'],
      };

      const result1 = computeCompanyMatch(input);
      const result2 = computeCompanyMatch(input);

      expect(result1.matchScore).toBe(result2.matchScore);
      expect(result1.matchScore).toBeGreaterThanOrEqual(0);
      expect(result1.matchScore).toBeLessThanOrEqual(100);
      expect(result1.disclaimer).toContain('indicative self-assessment tool');
    });

    it('Worked Example 1: High alignment student with upcoming drive', () => {
      const input: CompanyMatchInput = {
        studentSkills: [
          { name: 'Python', proficiency: 'ADVANCED' }, // 1.0
          { name: 'SQL', proficiency: 'ADVANCED' }, // 1.0
          { name: 'React', proficiency: 'INTERMEDIATE' }, // 0.8 (not required)
        ],
        studentTopicMastery: [
          { slug: 'data-structures', mastery: 0.85 },
          { slug: 'dbms', mastery: 0.9 },
        ],
        readinessScore: 82.0,
        companyRequiredSkills: ['Python', 'SQL', 'Docker'], // Docker missing (2 out of 3 = 66.7%)
        companyRequiredTopics: ['data-structures', 'dbms'], // avg = 0.875 -> 87.5%
      };

      const result = computeCompanyMatch(input);

      expect(result.confidence).toBe(CompanyMatchConfidence.HIGH);
      expect(result.matchScore).toBeCloseTo(78.1, 0);
      expect(result.components.matchedSkillCount).toBe(2);
      expect(result.components.totalRequiredSkills).toBe(3);
    });

    it('Worked Example 3: Early-stage student without readiness score (re-normalized weights)', () => {
      const input: CompanyMatchInput = {
        studentSkills: [{ name: 'Java', proficiency: 'BEGINNER' }], // 0.5 / 4 = 12.5%
        studentTopicMastery: [{ slug: 'oop', mastery: 0.45 }], // 45.0%
        readinessScore: null,
        companyRequiredSkills: ['Java', 'Spring', 'Kafka', 'MySQL'],
        companyRequiredTopics: ['oop'],
      };

      const result = computeCompanyMatch(input);

      expect(result.confidence).toBe(CompanyMatchConfidence.MEDIUM);
      expect(result.matchScore).toBeGreaterThan(25);
      expect(result.matchScore).toBeLessThan(32);
    });

    it('should return null matchScore and LOW confidence when student has 0 evidence', () => {
      const input: CompanyMatchInput = {
        studentSkills: [],
        studentTopicMastery: [],
        readinessScore: null,
        companyRequiredSkills: ['Go', 'Kubernetes'],
        companyRequiredTopics: ['distributed-systems'],
      };

      const result = computeCompanyMatch(input);

      expect(result.matchScore).toBeNull();
      expect(result.confidence).toBe(CompanyMatchConfidence.LOW);
    });
  });

  describe('Company Priority Engine - Eligibility Gating & Tiering', () => {
    it('should reject inputs containing forbidden demographic keys in priority engine', () => {
      expect(() => {
        assertCleanPriorityInput({
          isEligible: true,
          matchScore: 80,
          daysUntilDrive: 10,
          isFollowed: false,
          hasApplication: false,
          gender: 'male',
        });
      }).toThrow(/Scoring Integrity Violation: Demographic or proxy field/);
    });

    it('Worked Example 2: Ineligible student must gate to NOT_ELIGIBLE with score 0', () => {
      const input: CompanyPriorityInput = {
        isEligible: false,
        ineligibilityReasons: ['CGPA 6.8 below required cut-off 7.5'],
        matchScore: 92.5,
        daysUntilDrive: 3,
        isFollowed: true,
        hasApplication: true,
      };

      const result = computeCompanyPriority(input);

      expect(result.tier).toBe(CompanyPriorityTier.NOT_ELIGIBLE);
      expect(result.priorityScore).toBe(0);
      expect(result.components.isEligible).toBe(false);
      expect(result.components.ineligibilityReasons[0]).toBe('CGPA 6.8 below required cut-off 7.5');
    });

    it('should assign PREPARE_NOW when drive is within 14 days', () => {
      const input: CompanyPriorityInput = {
        isEligible: true,
        matchScore: 65,
        daysUntilDrive: 7,
        isFollowed: true,
        hasApplication: false,
      };

      const result = computeCompanyPriority(input);

      expect(result.tier).toBe(CompanyPriorityTier.PREPARE_NOW);
      expect(result.priorityScore).toBeGreaterThan(70);
    });

    it('should assign PREPARE_NEXT when drive is between 15 and 30 days', () => {
      const input: CompanyPriorityInput = {
        isEligible: true,
        matchScore: 55,
        daysUntilDrive: 22,
        isFollowed: false,
        hasApplication: false,
      };

      const result = computeCompanyPriority(input);

      expect(result.tier).toBe(CompanyPriorityTier.PREPARE_NEXT);
    });

    it('should assign ON_RADAR when drive is distant or unannounced and interest is low', () => {
      const input: CompanyPriorityInput = {
        isEligible: true,
        matchScore: 40,
        daysUntilDrive: null,
        isFollowed: false,
        hasApplication: false,
      };

      const result = computeCompanyPriority(input);

      expect(result.tier).toBe(CompanyPriorityTier.ON_RADAR);
    });
  });

  describe('Company Preparation Syllabus & Pattern Helpers', () => {
    it('should group syllabus topics by category and sort by question count', () => {
      const syllabus = buildCompanySyllabus([
        {
          id: '1',
          name: 'SQL',
          slug: 'sql',
          category: 'DATABASE',
          questionCount: 15,
          averageDifficulty: 3,
        },
        {
          id: '2',
          name: 'NoSQL',
          slug: 'nosql',
          category: 'DATABASE',
          questionCount: 25,
          averageDifficulty: 4,
        },
        {
          id: '3',
          name: 'Trees',
          slug: 'trees',
          category: 'DSA',
          questionCount: 50,
          averageDifficulty: 4,
        },
      ]);

      expect(syllabus['DATABASE'].length).toBe(2);
      expect(syllabus['DATABASE'][0].slug).toBe('nosql'); // 25 > 15
      expect(syllabus['DSA'].length).toBe(1);
    });

    it('should generate fallback interview rounds based on role family', () => {
      const devPattern = buildCompanyPattern([], RoleFamily.SOFTWARE_DEV);
      expect(devPattern.length).toBe(3);
      expect(devPattern[0].type).toBe('ONLINE_TEST');

      const dataPattern = buildCompanyPattern([], RoleFamily.DATA_ANALYTICS);
      expect(dataPattern.length).toBe(3);
      expect(dataPattern[0].focusTopics).toContain('SQL Queries');
    });

    it('should identify high-priority prep focus topics tested by company', () => {
      const focus = generateCompanyPrepFocus(
        [
          { slug: 'dynamic-prog', name: 'Dynamic Programming', category: 'DSA', mastery: 0.35 },
          { slug: 'sql-joins', name: 'SQL Joins', category: 'DBMS', mastery: 0.45 },
          { slug: 'git', name: 'Git Basics', category: 'TOOLS', mastery: 0.85 },
        ],
        ['dynamic-prog', 'sql-joins'],
      );

      expect(focus.length).toBe(2);
      expect(focus[0].topicId).toBe('dynamic-prog'); // lower mastery first
    });
  });

  describe('Calendar Engine & ICS Feed Generator', () => {
    it('should merge 3 distinct event streams in chronological order', () => {
      const driveEvents = [
        {
          id: 'de-1',
          title: 'PPT Drive',
          startsAt: '2026-10-15T10:00:00Z',
          endsAt: '2026-10-15T11:00:00Z',
          mode: 'ONLINE',
          collegeId: 'col-1',
          driveId: 'drv-1',
          kind: 'PRE_PLACEMENT_TALK',
          status: 'SCHEDULED',
        },
      ];
      const collegeEvents = [
        {
          id: 'ce-1',
          title: 'Resume Workshop',
          startsAt: '2026-10-14T09:00:00Z',
          endsAt: '2026-10-14T11:00:00Z',
          mode: 'OFFLINE',
          collegeId: 'col-1',
          status: 'SCHEDULED',
        },
      ];
      const schedules = [
        {
          id: 'ts-1',
          title: 'Aptitude Diagnostic',
          startsAt: '2026-10-16T14:00:00Z',
          endsAt: '2026-10-16T15:00:00Z',
          collegeId: 'col-1',
          status: 'SCHEDULED',
        },
      ];

      const merged = mergeCalendarEvents(driveEvents, collegeEvents, schedules);

      expect(merged.length).toBe(3);
      expect(merged[0].id).toBe('ce-1'); // Oct 14
      expect(merged[1].id).toBe('de-1'); // Oct 15
      expect(merged[2].id).toBe('ts-1'); // Oct 16
    });

    it('should accurately detect colliding / overlapping event pairs', () => {
      const events = mergeCalendarEvents(
        [
          {
            id: 'evt-1',
            title: 'Technical Round 1',
            startsAt: '2026-10-15T10:00:00Z',
            endsAt: '2026-10-15T11:00:00Z',
            mode: 'ONLINE',
            collegeId: 'col-1',
            driveId: 'drv-1',
            kind: 'TECHNICAL_INTERVIEW',
            status: 'SCHEDULED',
          },
          {
            id: 'evt-2',
            title: 'Colliding Aptitude Test',
            startsAt: '2026-10-15T10:30:00Z', // overlaps with evt-1!
            endsAt: '2026-10-15T11:30:00Z',
            mode: 'ONLINE',
            collegeId: 'col-1',
            driveId: 'drv-2',
            kind: 'APTITUDE_TEST',
            status: 'SCHEDULED',
          },
          {
            id: 'evt-3',
            title: 'Afternoon HR Round',
            startsAt: '2026-10-15T14:00:00Z', // no collision
            endsAt: '2026-10-15T15:00:00Z',
            mode: 'ONLINE',
            collegeId: 'col-1',
            driveId: 'drv-1',
            kind: 'HR_INTERVIEW',
            status: 'SCHEDULED',
          },
        ],
        [],
      );

      const conflicts = detectOverlaps(events);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].eventA.id).toBe('evt-1');
      expect(conflicts[0].eventB.id).toBe('evt-2');
    });

    it('should enforce event audience visibility rules', () => {
      // Shortlisted event only visible to shortlisted student
      expect(
        isEventVisibleTo(
          { source: 'DRIVE_EVENT', audience: 'SHORTLISTED' },
          { branchId: 'b-1', batchYear: 2026, applicationStatus: 'REGISTERED' },
        ),
      ).toBe(false);
      expect(
        isEventVisibleTo(
          { source: 'DRIVE_EVENT', audience: 'SHORTLISTED' },
          { branchId: 'b-1', batchYear: 2026, applicationStatus: 'SHORTLISTED' },
        ),
      ).toBe(true);

      // College event filtered by branch
      expect(
        isEventVisibleTo(
          { source: 'COLLEGE_EVENT', targetBranchIds: ['b-cse'], targetBatchYears: [2026] },
          { branchId: 'b-mech', batchYear: 2026 },
        ),
      ).toBe(false);
      expect(
        isEventVisibleTo(
          { source: 'COLLEGE_EVENT', targetBranchIds: ['b-cse'], targetBatchYears: [2026] },
          { branchId: 'b-cse', batchYear: 2026 },
        ),
      ).toBe(true);
    });

    it('should generate compliant RFC 5545 iCalendar feed content', () => {
      const events = mergeCalendarEvents(
        [
          {
            id: 'feed-event-1',
            title: 'Google Placement PPT',
            description: 'Pre-placement talk with engineering leaders',
            startsAt: '2026-10-20T10:00:00Z',
            endsAt: '2026-10-20T11:30:00Z',
            mode: 'ONLINE',
            location: 'Auditorium 1',
            collegeId: 'col-apex',
            driveId: 'drv-google',
            kind: 'PRE_PLACEMENT_TALK',
            status: 'SCHEDULED',
          },
        ],
        [],
      );

      const ics = generateIcsFeed(events, 'Apex Institute of Technology');

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//CampusEdge//Placement Calendar//EN');
      expect(ics).toContain('X-WR-CALNAME:Apex Institute of Technology');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('UID:feed-event-1@campusedge.io');
      expect(ics).toContain('SUMMARY:Google Placement PPT');
      expect(ics).toContain('DESCRIPTION:Pre-placement talk with engineering leaders');
      expect(ics).toContain('LOCATION:Auditorium 1');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });
  });

  describe('Notifications Configuration', () => {
    it('should generate deterministic deduplication keys', () => {
      const key1 = generateNotificationDedupeKey(
        NotificationCategory.DRIVE_PUBLISHED,
        'user-123',
        'drive-456',
        '2026-10-10',
      );
      const key2 = generateNotificationDedupeKey(
        NotificationCategory.DRIVE_PUBLISHED,
        'user-123',
        'drive-456',
        '2026-10-10',
      );
      expect(key1).toBe(key2);
      expect(key1).toBe('DRIVE_PUBLISHED:user-123:drive-456:2026-10-10');
    });

    it('should check quiet hours in IST timezone', () => {
      // 17:30 UTC is 23:00 IST (11 PM IST) -> Quiet hours active
      const lateNightUtc = new Date('2026-10-10T17:30:00Z');
      expect(isCurrentlyQuietHours(lateNightUtc)).toBe(true);

      // 05:00 UTC is 10:30 IST (10:30 AM IST) -> Quiet hours NOT active
      const daytimeUtc = new Date('2026-10-10T05:00:00Z');
      expect(isCurrentlyQuietHours(daytimeUtc)).toBe(false);
    });
  });
});
