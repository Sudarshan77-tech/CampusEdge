import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  QuestionType,
  TopicMasteryLevel,
  ReadinessBand,
  ReadinessConfidence,
  TechnicalTrack,
  RoadmapTaskKind,
  RoadmapTaskStatus,
} from './phase3-enums';
import { scoreItem, scoreAttempt, AttemptSectionDefinition } from './scoring-engine';
import { computeMastery } from './mastery-engine';
import { computeReadiness } from './readiness-engine';
import { generateRoadmap } from './roadmap-engine';
import {
  assertNoAnswerLeakage,
  CreateQuestionSchema,
  InAttemptQuestionSchema,
} from './phase3-dtos';
import { READINESS_DISCLAIMER } from './assessment-config';

describe('Phase 3 Assessment & Readiness Domain Logic', () => {
  // -------------------------------------------------------------
  // 1. Item and Attempt Scoring Engine
  // -------------------------------------------------------------
  describe('scoreItem', () => {
    it('evaluates MCQ_SINGLE correctly with positive marks and penalties', () => {
      const correctRes = scoreItem({
        type: QuestionType.MCQ_SINGLE,
        selectedOptionIds: ['opt-1'],
        correctOptionIds: ['opt-1'],
        marksPerQuestion: 2,
        negativeMarks: 0.5,
      });
      expect(correctRes.isCorrect).toBe(true);
      expect(correctRes.marksAwarded).toBe(2);
      expect(correctRes.isSkipped).toBe(false);

      const incorrectRes = scoreItem({
        type: QuestionType.MCQ_SINGLE,
        selectedOptionIds: ['opt-2'],
        correctOptionIds: ['opt-1'],
        marksPerQuestion: 2,
        negativeMarks: 0.5,
      });
      expect(incorrectRes.isCorrect).toBe(false);
      expect(incorrectRes.marksAwarded).toBe(-0.5);
      expect(incorrectRes.isSkipped).toBe(false);

      const skippedRes = scoreItem({
        type: QuestionType.MCQ_SINGLE,
        selectedOptionIds: [],
        correctOptionIds: ['opt-1'],
        marksPerQuestion: 2,
        negativeMarks: 0.5,
      });
      expect(skippedRes.isCorrect).toBe(false);
      expect(skippedRes.marksAwarded).toBe(0);
      expect(skippedRes.isSkipped).toBe(true);
    });

    it('evaluates MCQ_MULTI with strict all-or-nothing scoring (no partial credit)', () => {
      const correctOptionIds = ['opt-a', 'opt-c'];

      // Perfect match
      const perfect = scoreItem({
        type: QuestionType.MCQ_MULTI,
        selectedOptionIds: ['opt-c', 'opt-a'],
        correctOptionIds,
        marksPerQuestion: 3,
        negativeMarks: 1,
      });
      expect(perfect.isCorrect).toBe(true);
      expect(perfect.marksAwarded).toBe(3);

      // Partial selection (only 1 of 2 selected) -> penalized
      const partial = scoreItem({
        type: QuestionType.MCQ_MULTI,
        selectedOptionIds: ['opt-a'],
        correctOptionIds,
        marksPerQuestion: 3,
        negativeMarks: 1,
      });
      expect(partial.isCorrect).toBe(false);
      expect(partial.marksAwarded).toBe(-1);

      // Super-set (2 correct + 1 wrong selected) -> penalized
      const superset = scoreItem({
        type: QuestionType.MCQ_MULTI,
        selectedOptionIds: ['opt-a', 'opt-b', 'opt-c'],
        correctOptionIds,
        marksPerQuestion: 3,
        negativeMarks: 1,
      });
      expect(superset.isCorrect).toBe(false);
      expect(superset.marksAwarded).toBe(-1);

      // Skipped
      const skipped = scoreItem({
        type: QuestionType.MCQ_MULTI,
        selectedOptionIds: [],
        correctOptionIds,
        marksPerQuestion: 3,
        negativeMarks: 1,
      });
      expect(skipped.isCorrect).toBe(false);
      expect(skipped.marksAwarded).toBe(0);
      expect(skipped.isSkipped).toBe(true);
    });

    it('evaluates NUMERIC with tolerance boundaries and null checks', () => {
      // Within tolerance
      const inTol = scoreItem({
        type: QuestionType.NUMERIC,
        numericResponse: 42.05,
        correctOptionIds: [],
        numericAnswer: 42.0,
        numericTolerance: 0.1,
        marksPerQuestion: 4,
        negativeMarks: 1,
      });
      expect(inTol.isCorrect).toBe(true);
      expect(inTol.marksAwarded).toBe(4);

      // Outside tolerance
      const outTol = scoreItem({
        type: QuestionType.NUMERIC,
        numericResponse: 42.25,
        correctOptionIds: [],
        numericAnswer: 42.0,
        numericTolerance: 0.1,
        marksPerQuestion: 4,
        negativeMarks: 1,
      });
      expect(outTol.isCorrect).toBe(false);
      expect(outTol.marksAwarded).toBe(-1);

      // Skipped
      const skipped = scoreItem({
        type: QuestionType.NUMERIC,
        numericResponse: null,
        correctOptionIds: [],
        numericAnswer: 42.0,
        numericTolerance: 0.1,
        marksPerQuestion: 4,
        negativeMarks: 1,
      });
      expect(skipped.isCorrect).toBe(false);
      expect(skipped.marksAwarded).toBe(0);
      expect(skipped.isSkipped).toBe(true);
    });

    it('property-test: scoreItem produces valid marks under all arbitrary inputs', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 10, noNaN: true }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 5 }),
          (numResp, numAns, numTol, marks, negMarks) => {
            const res = scoreItem({
              type: QuestionType.NUMERIC,
              numericResponse: numResp,
              correctOptionIds: [],
              numericAnswer: numAns,
              numericTolerance: numTol,
              marksPerQuestion: marks,
              negativeMarks: negMarks,
            });
            expect(typeof res.isCorrect).toBe('boolean');
            expect(typeof res.marksAwarded).toBe('number');
            expect(Number.isNaN(res.marksAwarded)).toBe(false);
            if (res.isCorrect) {
              expect(res.marksAwarded).toBe(marks);
            } else {
              expect(res.marksAwarded).toBe(-negMarks);
            }
          },
        ),
      );
    });
  });

  describe('scoreAttempt', () => {
    it('aggregates multi-section scores and computes accurate percentages', () => {
      const sections: AttemptSectionDefinition[] = [
        {
          sequence: 1,
          title: 'Quantitative Aptitude',
          marksPerQuestion: 2,
          negativeMarks: 0.5,
          questionCount: 3,
        },
        {
          sequence: 2,
          title: 'Logical Reasoning',
          marksPerQuestion: 3,
          negativeMarks: 1,
          questionCount: 2,
        },
      ];

      const scoredItems = [
        { sectionSeq: 1, position: 1, isCorrect: true, marksAwarded: 2, isSkipped: false },
        { sectionSeq: 1, position: 2, isCorrect: false, marksAwarded: -0.5, isSkipped: false },
        { sectionSeq: 1, position: 3, isCorrect: false, marksAwarded: 0, isSkipped: true },
        { sectionSeq: 2, position: 4, isCorrect: true, marksAwarded: 3, isSkipped: false },
        { sectionSeq: 2, position: 5, isCorrect: true, marksAwarded: 3, isSkipped: false },
      ];

      const result = scoreAttempt(scoredItems, sections);
      expect(result.totalMarks).toBe(12); // (3 * 2) + (2 * 3) = 6 + 6 = 12
      expect(result.score).toBe(7.5); // 2 - 0.5 + 0 + 3 + 3 = 7.5
      expect(result.percent).toBe(62.5); // 7.5 / 12 = 62.5%
      expect(result.correctCount).toBe(3);
      expect(result.incorrectCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.sectionScores[1].score).toBe(1.5);
      expect(result.sectionScores[2].score).toBe(6);
    });

    it('clamps negative overall score to 0% for display percentage', () => {
      const sections: AttemptSectionDefinition[] = [
        {
          sequence: 1,
          title: 'Hard Section',
          marksPerQuestion: 1,
          negativeMarks: 2,
          questionCount: 2,
        },
      ];
      const scoredItems = [
        { sectionSeq: 1, position: 1, isCorrect: false, marksAwarded: -2, isSkipped: false },
        { sectionSeq: 1, position: 2, isCorrect: false, marksAwarded: -2, isSkipped: false },
      ];
      const result = scoreAttempt(scoredItems, sections);
      expect(result.score).toBe(-4);
      expect(result.percent).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // 2. Topic Mastery Engine
  // -------------------------------------------------------------
  describe('computeMastery', () => {
    const now = new Date('2026-10-10T00:00:00Z');

    it('returns INSUFFICIENT_DATA when fewer than 5 items are scored', () => {
      const items = [
        { difficulty: 3, isCorrect: true, answeredAt: now },
        { difficulty: 4, isCorrect: true, answeredAt: now },
      ];
      const res = computeMastery(items, now);
      expect(res.level).toBe(TopicMasteryLevel.INSUFFICIENT_DATA);
      expect(res.scoredCount).toBe(2);
    });

    it('classifies STRONG mastery when accuracy is >= 70% with sufficient items', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        difficulty: 3,
        isCorrect: i < 9, // 90% correct
        answeredAt: now,
      }));
      const res = computeMastery(items, now);
      expect(res.level).toBe(TopicMasteryLevel.STRONG);
      expect(res.mastery).toBeGreaterThanOrEqual(0.7);
    });

    it('classifies WEAK mastery when accuracy is < 40%', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        difficulty: 3,
        isCorrect: i < 2, // 20% correct
        answeredAt: now,
      }));
      const res = computeMastery(items, now);
      expect(res.level).toBe(TopicMasteryLevel.WEAK);
      expect(res.mastery).toBeLessThan(0.4);
    });

    it('applies exponential recency decay to older items', () => {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Student was 100% correct 30 days ago, but 0% recently
      const decayedItems = [
        { difficulty: 3, isCorrect: false, answeredAt: now },
        { difficulty: 3, isCorrect: false, answeredAt: now },
        { difficulty: 3, isCorrect: false, answeredAt: now },
        { difficulty: 3, isCorrect: false, answeredAt: now },
        { difficulty: 3, isCorrect: false, answeredAt: now },
        { difficulty: 3, isCorrect: true, answeredAt: thirtyDaysAgo },
        { difficulty: 3, isCorrect: true, answeredAt: thirtyDaysAgo },
        { difficulty: 3, isCorrect: true, answeredAt: thirtyDaysAgo },
      ];
      const res = computeMastery(decayedItems, now);
      // Older correct answers have half weight (0.5), pulling mastery down
      expect(res.mastery).toBeLessThan(0.5);
    });

    it('property-test: mastery is strictly bounded in [0, 1] for all arbitrary distributions', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              difficulty: fc.integer({ min: 1, max: 5 }),
              isCorrect: fc.boolean(),
              answeredAt: fc.date({ min: new Date('2025-01-01'), max: new Date('2026-10-10') }),
            }),
            { minLength: 1, maxLength: 60 },
          ),
          (items) => {
            const res = computeMastery(items, now);
            expect(res.mastery).toBeGreaterThanOrEqual(0);
            expect(res.mastery).toBeLessThanOrEqual(1);
          },
        ),
      );
    });
  });

  // -------------------------------------------------------------
  // 3. Placement Readiness Engine
  // -------------------------------------------------------------
  describe('computeReadiness', () => {
    it('refuses to compute score if diagnostic is not completed', () => {
      const result = computeReadiness({
        track: TechnicalTrack.SOFTWARE,
        hasCompletedDiagnostic: false,
        aptitudeTopics: [],
        technicalTopics: [],
        recentMockAttempts: [],
        activeDaysInLast14Days: 5,
        totalScoredItems: 0,
      });
      expect(result.isAvailable).toBe(false);
      expect(result.score).toBeNull();
      expect(result.band).toBeNull();
      expect(result.disclaimer).toBe(READINESS_DISCLAIMER);
    });

    it('computes accurate weighted readiness score for SOFTWARE track student', () => {
      const aptitudeTopics = [
        { topicId: 'quant', name: 'Quantitative', mastery: 0.8, scoredCount: 20 },
        { topicId: 'logical', name: 'Logical', mastery: 0.75, scoredCount: 15 },
      ];
      const technicalTopics = [
        { topicId: 'dsa', name: 'DSA', mastery: 0.7, scoredCount: 25 },
        { topicId: 'sql', name: 'SQL', mastery: 0.85, scoredCount: 20 },
      ];
      const recentMockAttempts = [
        { percent: 75, submittedAt: '2026-10-08T00:00:00Z' },
        { percent: 80, submittedAt: '2026-10-01T00:00:00Z' },
      ];

      const result = computeReadiness({
        track: TechnicalTrack.SOFTWARE,
        hasCompletedDiagnostic: true,
        aptitudeTopics,
        technicalTopics,
        recentMockAttempts,
        activeDaysInLast14Days: 10, // 100% consistency
        totalScoredItems: 80, // Medium confidence
      });

      expect(result.isAvailable).toBe(true);
      expect(result.confidence).toBe(ReadinessConfidence.MEDIUM);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.band).toBe(ReadinessBand.STRONG);
      expect(result.components.aptitude.available).toBe(true);
      expect(result.components.technical.available).toBe(true);
      expect(result.components.mockPerformance.available).toBe(true);
      expect(result.components.consistency.available).toBe(true);
      expect(result.disclaimer).toBe(READINESS_DISCLAIMER);
    });

    it('computes OTHER track without technical weight (0.55 / 0 / 0.30 / 0.15)', () => {
      const aptitudeTopics = [
        { topicId: 'quant', name: 'Quantitative', mastery: 0.9, scoredCount: 30 },
      ];
      const result = computeReadiness({
        track: TechnicalTrack.OTHER,
        hasCompletedDiagnostic: true,
        aptitudeTopics,
        technicalTopics: [],
        recentMockAttempts: [{ percent: 85, submittedAt: '2026-10-05T00:00:00Z' }],
        activeDaysInLast14Days: 10,
        totalScoredItems: 120, // High confidence
      });

      expect(result.isAvailable).toBe(true);
      expect(result.confidence).toBe(ReadinessConfidence.HIGH);
      expect(result.components.technical.available).toBe(false);
      expect(result.components.technical.weight).toBe(0.0);
      expect(result.band).toBe(ReadinessBand.STRONG);
    });

    it('property-test: computed readiness score is strictly bounded in [0, 100]', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1, noNaN: true }),
          fc.double({ min: 0, max: 1, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.integer({ min: 0, max: 14 }),
          (aptMastery, techMastery, mockPct, activeDays) => {
            const res = computeReadiness({
              track: TechnicalTrack.SOFTWARE,
              hasCompletedDiagnostic: true,
              aptitudeTopics: [
                { topicId: 't1', name: 'Apt', mastery: aptMastery, scoredCount: 20 },
              ],
              technicalTopics: [
                { topicId: 't2', name: 'Tech', mastery: techMastery, scoredCount: 25 },
              ],
              recentMockAttempts: [{ percent: mockPct, submittedAt: '2026-10-09' }],
              activeDaysInLast14Days: activeDays,
              totalScoredItems: 50,
            });
            if (res.score !== null) {
              expect(res.score).toBeGreaterThanOrEqual(0);
              expect(res.score).toBeLessThanOrEqual(100);
            }
          },
        ),
      );
    });
  });

  // -------------------------------------------------------------
  // 4. Personalized Roadmap Engine
  // -------------------------------------------------------------
  describe('generateRoadmap', () => {
    const today = '2026-10-12'; // Monday

    it('generates a 28-day schedule with mocks on Saturdays and review on Sundays', () => {
      const plan = generateRoadmap({
        studentId: 'stud-1',
        collegeId: 'col-1',
        currentDate: today,
        studyHoursPerDay: 2,
        technicalTrack: TechnicalTrack.SOFTWARE,
        topicStats: [
          {
            topicId: 't-dsa',
            topicName: 'Trees & Graphs',
            category: 'dsa',
            mastery: 0.3,
            level: TopicMasteryLevel.WEAK,
          },
          {
            topicId: 't-sql',
            topicName: 'SQL Normalization',
            category: 'sql',
            mastery: 0.85,
            level: TopicMasteryLevel.STRONG,
          },
        ],
      });

      expect(plan.horizonDays).toBe(28);
      expect(plan.tasks.length).toBe(28);
      expect(plan.dailyQuestionBudget).toBe(40); // 2 hours * 20 questions

      // Check task kinds on weekends
      for (const task of plan.tasks) {
        const d = new Date(task.scheduledDate);
        const dayOfWeek = d.getUTCDay();
        if (dayOfWeek === 6) {
          expect(task.kind).toBe(RoadmapTaskKind.TAKE_TEST);
        }
        if (dayOfWeek === 0) {
          expect(task.kind).toBe(RoadmapTaskKind.REVIEW_MISTAKES);
        }
        expect(task.reason.length).toBeGreaterThan(10);
      }
    });

    it('preserves existing DONE tasks upon roadmap regeneration', () => {
      const existingDoneTask = {
        id: 'done-1',
        scheduledDate: '2026-10-15',
        kind: RoadmapTaskKind.PRACTICE_TOPIC,
        topicId: 't-dsa',
        targetQuestionCount: 30,
        status: RoadmapTaskStatus.DONE,
        priority: 0.9,
        reason: 'Existing completed task',
      };

      const plan = generateRoadmap({
        studentId: 'stud-1',
        collegeId: 'col-1',
        currentDate: today,
        studyHoursPerDay: 1.5,
        technicalTrack: TechnicalTrack.SOFTWARE,
        topicStats: [
          { topicId: 't-dsa', topicName: 'DSA', mastery: 0.4, level: TopicMasteryLevel.MODERATE },
        ],
        existingFutureTasks: [existingDoneTask],
      });

      const matched = plan.tasks.find((t) => t.scheduledDate === '2026-10-15');
      expect(matched?.status).toBe(RoadmapTaskStatus.DONE);
      expect(matched?.reason).toBe('Existing completed task');
    });

    it('boosts priority and inserts DRIVE_PREP tasks when an eligible drive is upcoming', () => {
      const plan = generateRoadmap({
        studentId: 'stud-1',
        collegeId: 'col-1',
        currentDate: today,
        studyHoursPerDay: 1.5,
        technicalTrack: TechnicalTrack.SOFTWARE,
        topicStats: [
          { topicId: 't-dsa', topicName: 'DSA', mastery: 0.5, level: TopicMasteryLevel.MODERATE },
        ],
        eligibleUpcomingDrives: [
          {
            driveId: 'drive-amazon',
            companyName: 'Amazon',
            driveDate: '2026-10-16', // 4 days away!
            topicIdsInRounds: ['t-dsa'],
          },
        ],
      });

      const driveTasks = plan.tasks.filter((t) => t.kind === RoadmapTaskKind.DRIVE_PREP);
      expect(driveTasks.length).toBeGreaterThan(0);
      expect(driveTasks[0].reason).toContain('Amazon');
    });
  });

  // -------------------------------------------------------------
  // 5. Zero Early Information Leakage Contract Tests
  // -------------------------------------------------------------
  describe('assertNoAnswerLeakage Contract', () => {
    it('passes for cleanly sanitized in-attempt question DTO', () => {
      const cleanPayload = {
        position: 1,
        questionId: '550e8400-e29b-41d4-a716-446655440000',
        versionId: '550e8400-e29b-41d4-a716-446655440001',
        type: QuestionType.MCQ_SINGLE,
        difficulty: 3,
        stem: 'What is the time complexity of quicksort in the average case?',
        options: [
          { id: '550e8400-e29b-41d4-a716-446655440010', key: 'A', text: 'O(n log n)', sort: 0 },
          { id: '550e8400-e29b-41d4-a716-446655440011', key: 'B', text: 'O(n^2)', sort: 1 },
        ],
        markedForReview: false,
        timeSpentMs: 15000,
      };

      // Validates against Zod schema
      expect(() => InAttemptQuestionSchema.parse(cleanPayload)).not.toThrow();

      // Passes zero-leakage security contract
      expect(() => assertNoAnswerLeakage(cleanPayload)).not.toThrow();
    });

    it('throws security error if is_correct or isCorrect is leaked', () => {
      const leaked = {
        position: 1,
        options: [{ id: 'opt-1', text: 'Option A', isCorrect: true }],
      };
      expect(() => assertNoAnswerLeakage(leaked)).toThrow(
        /CRITICAL SECURITY VIOLATION: Forbidden field "isCorrect"/,
      );

      const snakeLeaked = {
        position: 1,
        options: [{ id: 'opt-1', text: 'Option A', is_correct: true }],
      };
      expect(() => assertNoAnswerLeakage(snakeLeaked)).toThrow(
        /CRITICAL SECURITY VIOLATION: Forbidden field "is_correct"/,
      );
    });

    it('throws security error if explanation or numericAnswer is leaked', () => {
      const leakedExp = { position: 1, explanation: 'Because binary search is logarithmic' };
      expect(() => assertNoAnswerLeakage(leakedExp)).toThrow(
        /CRITICAL SECURITY VIOLATION: Forbidden field "explanation"/,
      );

      const leakedNum = { position: 1, numericAnswer: 42.5 };
      expect(() => assertNoAnswerLeakage(leakedNum)).toThrow(
        /CRITICAL SECURITY VIOLATION: Forbidden field "numericAnswer"/,
      );
    });
  });

  // -------------------------------------------------------------
  // 6. Question Schema Option Constraints
  // -------------------------------------------------------------
  describe('CreateQuestionSchema Validation', () => {
    it('enforces exactly 1 correct option for MCQ_SINGLE', () => {
      // 0 correct -> invalid
      expect(() =>
        CreateQuestionSchema.parse({
          topicId: '550e8400-e29b-41d4-a716-446655440000',
          type: QuestionType.MCQ_SINGLE,
          stem: 'Sample single MCQ stem',
          explanation: 'Sample explanation',
          options: [
            { key: 'A', text: 'Opt 1', isCorrect: false },
            { key: 'B', text: 'Opt 2', isCorrect: false },
          ],
        }),
      ).toThrow(/Option constraints violated/);

      // 2 correct -> invalid
      expect(() =>
        CreateQuestionSchema.parse({
          topicId: '550e8400-e29b-41d4-a716-446655440000',
          type: QuestionType.MCQ_SINGLE,
          stem: 'Sample single MCQ stem',
          explanation: 'Sample explanation',
          options: [
            { key: 'A', text: 'Opt 1', isCorrect: true },
            { key: 'B', text: 'Opt 2', isCorrect: true },
          ],
        }),
      ).toThrow(/Option constraints violated/);

      // 1 correct -> valid
      expect(() =>
        CreateQuestionSchema.parse({
          topicId: '550e8400-e29b-41d4-a716-446655440000',
          type: QuestionType.MCQ_SINGLE,
          stem: 'Sample single MCQ stem',
          explanation: 'Sample explanation',
          options: [
            { key: 'A', text: 'Opt 1', isCorrect: true },
            { key: 'B', text: 'Opt 2', isCorrect: false },
          ],
        }),
      ).not.toThrow();
    });

    it('enforces numericAnswer and 0 options for NUMERIC', () => {
      // NUMERIC with options -> invalid
      expect(() =>
        CreateQuestionSchema.parse({
          topicId: '550e8400-e29b-41d4-a716-446655440000',
          type: QuestionType.NUMERIC,
          stem: 'Calculate 2 + 2',
          explanation: 'Simple arithmetic',
          numericAnswer: 4,
          options: [{ key: 'A', text: '4', isCorrect: true }],
        }),
      ).toThrow(/Option constraints violated/);

      // NUMERIC without numericAnswer -> invalid
      expect(() =>
        CreateQuestionSchema.parse({
          topicId: '550e8400-e29b-41d4-a716-446655440000',
          type: QuestionType.NUMERIC,
          stem: 'Calculate 2 + 2',
          explanation: 'Simple arithmetic',
          options: [],
        }),
      ).toThrow(/Option constraints violated/);

      // NUMERIC with numericAnswer and empty options -> valid
      expect(() =>
        CreateQuestionSchema.parse({
          topicId: '550e8400-e29b-41d4-a716-446655440000',
          type: QuestionType.NUMERIC,
          stem: 'Calculate 2 + 2',
          explanation: 'Simple arithmetic',
          numericAnswer: 4,
          options: [],
        }),
      ).not.toThrow();
    });
  });
});
