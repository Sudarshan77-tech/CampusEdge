import { FORMULA_VERSION, ROADMAP_CONFIG } from './assessment-config';
import {
  RoadmapPlanStatus,
  RoadmapTaskKind,
  RoadmapTaskStatus,
  TechnicalTrack,
  TopicMasteryLevel,
} from './phase3-enums';

export interface TopicStatForRoadmap {
  topicId: string;
  topicName: string;
  category?: string;
  mastery: number | null;
  level: TopicMasteryLevel;
  lastPracticedAt?: Date | string | null;
}

export interface UpcomingDriveForRoadmap {
  driveId: string;
  companyName: string;
  driveDate: Date | string;
  topicIdsInRounds: string[];
}

export interface RoadmapTaskItem {
  id?: string;
  scheduledDate: string; // YYYY-MM-DD
  kind: RoadmapTaskKind;
  topicId?: string;
  driveId?: string;
  targetQuestionCount: number;
  status: RoadmapTaskStatus;
  completedAt?: Date | string;
  priority: number;
  reason: string;
}

export interface GenerateRoadmapInput {
  studentId: string;
  collegeId: string;
  currentDate?: Date | string;
  studyHoursPerDay?: number;
  technicalTrack: TechnicalTrack;
  targetDate?: Date | string | null;
  topicStats: TopicStatForRoadmap[];
  eligibleUpcomingDrives?: UpcomingDriveForRoadmap[];
  recurringRecruiterTopTopicIds?: string[];
  existingFutureTasks?: RoadmapTaskItem[];
}

export interface GeneratedRoadmapPlan {
  status: RoadmapPlanStatus;
  horizonDays: number;
  formulaVersion: string;
  dailyQuestionBudget: number;
  tasks: RoadmapTaskItem[];
}

function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

/**
 * Deterministically generates a 4-week personalized preparation roadmap.
 */
export function generateRoadmap(input: GenerateRoadmapInput): GeneratedRoadmapPlan {
  const {
    currentDate = new Date(),
    studyHoursPerDay = ROADMAP_CONFIG.DEFAULT_STUDY_HOURS,
    technicalTrack,
    topicStats,
    eligibleUpcomingDrives = [],
    recurringRecruiterTopTopicIds = [],
    existingFutureTasks = [],
  } = input;

  const baseDate = new Date(currentDate);
  const nowMs = baseDate.getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // 1. Calculate Daily Question Budget
  const hours = Math.max(0.5, Math.min(8, studyHoursPerDay));
  const rawBudget = Math.round(hours * ROADMAP_CONFIG.QUESTIONS_PER_STUDY_HOUR);
  const dailyQuestionBudget = Math.max(
    ROADMAP_CONFIG.MIN_DAILY_QUESTIONS,
    Math.min(ROADMAP_CONFIG.MAX_DAILY_QUESTIONS, rawBudget),
  );

  // 2. Identify drive topics and urgent drives
  const driveTopicSet = new Set<string>();
  const urgentDrives: UpcomingDriveForRoadmap[] = [];

  for (const drive of eligibleUpcomingDrives) {
    const dTime = new Date(drive.driveDate).getTime();
    const diffDays = (dTime - nowMs) / MS_PER_DAY;
    if (diffDays >= 0 && diffDays <= ROADMAP_CONFIG.DRIVE_PROXIMITY_DAYS) {
      for (const tId of drive.topicIdsInRounds) {
        driveTopicSet.add(tId);
      }
      if (diffDays <= 7) {
        urgentDrives.push(drive);
      }
    }
  }

  const recruiterTopicSet = new Set(recurringRecruiterTopTopicIds);

  // 3. Compute Topic Priority
  interface PrioritizedTopic {
    topicId: string;
    topicName: string;
    level: TopicMasteryLevel;
    masteryVal: number;
    priority: number;
  }

  const prioritizedTopics: PrioritizedTopic[] = topicStats.map((t) => {
    const masteryVal =
      t.level === TopicMasteryLevel.INSUFFICIENT_DATA || t.mastery === null
        ? 0.5
        : Math.max(0, Math.min(1, t.mastery));

    let importance = 1.0;
    if (driveTopicSet.has(t.topicId)) {
      importance += ROADMAP_CONFIG.DRIVE_WEIGHT_BOOST;
    }
    if (recruiterTopicSet.has(t.topicId)) {
      importance += ROADMAP_CONFIG.RECURRING_RECRUITER_TOPIC_BOOST;
    }
    if (
      technicalTrack === TechnicalTrack.SOFTWARE &&
      t.category &&
      ['dsa', 'sql', 'system_design', 'os', 'cn', 'oop'].includes(t.category.toLowerCase())
    ) {
      importance += ROADMAP_CONFIG.CORE_TRACK_BOOST;
    }

    const priority = Math.round((1.0 - masteryVal) * importance * 1000) / 1000;

    return {
      topicId: t.topicId,
      topicName: t.topicName,
      level: t.level,
      masteryVal,
      priority,
    };
  });

  prioritizedTopics.sort((a, b) => b.priority - a.priority);

  // Separate strong topics for periodic maintenance
  const strongTopics = prioritizedTopics.filter((t) => t.level === TopicMasteryLevel.STRONG);
  const practiceCandidateTopics =
    prioritizedTopics.length > 0
      ? prioritizedTopics
      : [
          {
            topicId: 'general-aptitude',
            topicName: 'Quantitative & Logical Aptitude',
            level: TopicMasteryLevel.INSUFFICIENT_DATA,
            masteryVal: 0.5,
            priority: 0.5,
          },
        ];

  // 4. Map of already DONE tasks by date key to preserve
  const doneTasksByDate = new Map<string, RoadmapTaskItem>();
  for (const existing of existingFutureTasks) {
    if (existing.status === RoadmapTaskStatus.DONE) {
      doneTasksByDate.set(existing.scheduledDate, existing);
    }
  }

  // 5. Generate 28-day schedule
  const tasks: RoadmapTaskItem[] = [];
  let practiceIndex = 0;
  let maintenanceIndex = 0;

  for (let dayOffset = 0; dayOffset < ROADMAP_CONFIG.HORIZON_DAYS; dayOffset++) {
    const targetDate = new Date(nowMs + dayOffset * MS_PER_DAY);
    const dateKey = formatDateKey(targetDate);

    // If an existing task on this date is already completed, retain it
    if (doneTasksByDate.has(dateKey)) {
      tasks.push(doneTasksByDate.get(dateKey)!);
      continue;
    }

    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sun, 6 = Sat

    // Saturday: Full Mock Test
    if (dayOfWeek === 6) {
      tasks.push({
        scheduledDate: dateKey,
        kind: RoadmapTaskKind.TAKE_TEST,
        targetQuestionCount: Math.max(30, dailyQuestionBudget),
        status: RoadmapTaskStatus.PENDING,
        priority: 0.95,
        reason:
          'Weekend full-length mock assessment: benchmark performance under timed test conditions.',
      });
      continue;
    }

    // Sunday: Mistake Review or Light Maintenance
    if (dayOfWeek === 0) {
      tasks.push({
        scheduledDate: dateKey,
        kind: RoadmapTaskKind.REVIEW_MISTAKES,
        targetQuestionCount: Math.round(dailyQuestionBudget * 0.6),
        status: RoadmapTaskStatus.PENDING,
        priority: 0.85,
        reason:
          'Weekend mistake notebook review: analyze incorrect solutions to eliminate conceptual gaps.',
      });
      continue;
    }

    // Wednesday: Mid-week Mistake Review
    if (dayOfWeek === 3 && dayOffset % 7 === 3) {
      tasks.push({
        scheduledDate: dateKey,
        kind: RoadmapTaskKind.REVIEW_MISTAKES,
        targetQuestionCount: Math.round(dailyQuestionBudget * 0.75),
        status: RoadmapTaskStatus.PENDING,
        priority: 0.8,
        reason:
          'Mid-week mistake review: targeted reinforcement of questions previously answered incorrectly.',
      });
      continue;
    }

    // Urgent Drive Preparation (if eligible drive within 7 days)
    if (urgentDrives.length > 0 && dayOffset <= 6) {
      const drive = urgentDrives[dayOffset % urgentDrives.length];
      if (drive) {
        tasks.push({
          scheduledDate: dateKey,
          kind: RoadmapTaskKind.DRIVE_PREP,
          driveId: drive.driveId,
          targetQuestionCount: dailyQuestionBudget,
          status: RoadmapTaskStatus.PENDING,
          priority: 0.98,
          reason: `Targeted drive preparation: high-frequency rounds and topics for upcoming ${drive.companyName} recruitment.`,
        });
        continue;
      }
    }

    // Periodic Retention Maintenance for Strong Topics
    if (
      dayOffset > 0 &&
      dayOffset % ROADMAP_CONFIG.MAINTENANCE_INTERVAL_DAYS === 0 &&
      strongTopics.length > 0
    ) {
      const strongTopic = strongTopics[maintenanceIndex % strongTopics.length];
      maintenanceIndex++;
      if (strongTopic) {
        tasks.push({
          scheduledDate: dateKey,
          kind: RoadmapTaskKind.MAINTENANCE,
          topicId: strongTopic.topicId,
          targetQuestionCount: ROADMAP_CONFIG.MAINTENANCE_QUESTION_COUNT,
          status: RoadmapTaskStatus.PENDING,
          priority: 0.7,
          reason: `Retention maintenance: periodic revision to prevent decay in master topic "${strongTopic.topicName}".`,
        });
        continue;
      }
    }

    // Standard Weekday Practice on High-Priority Topics
    const topic = practiceCandidateTopics[practiceIndex % practiceCandidateTopics.length];
    practiceIndex++;

    if (topic) {
      const masteryPct = Math.round(topic.masteryVal * 100);
      const reasonText =
        topic.level === TopicMasteryLevel.INSUFFICIENT_DATA
          ? `Diagnostic practice: establish foundational baseline for "${topic.topicName}".`
          : `Targeted remediation: strengthen mastery in "${topic.topicName}" (current accuracy: ${masteryPct}%).`;

      tasks.push({
        scheduledDate: dateKey,
        kind: RoadmapTaskKind.PRACTICE_TOPIC,
        topicId: topic.topicId,
        targetQuestionCount: dailyQuestionBudget,
        status: RoadmapTaskStatus.PENDING,
        priority: topic.priority,
        reason: reasonText,
      });
    }
  }

  return {
    status: RoadmapPlanStatus.ACTIVE,
    horizonDays: ROADMAP_CONFIG.HORIZON_DAYS,
    formulaVersion: FORMULA_VERSION,
    dailyQuestionBudget,
    tasks,
  };
}
