import { RoleFamily } from './phase4-enums';

export interface CompanyTopicDetail {
  id: string;
  name: string;
  slug: string;
  category: string;
  questionCount: number;
  averageDifficulty: number;
}

export interface CompanyRoundPattern {
  sequence: number;
  title: string;
  type: string;
  mode: string;
  durationMinutes: number | null;
  focusTopics: string[];
}

export interface PrepFocusItem {
  topicId: string;
  topicName: string;
  topicCategory: string;
  currentMastery: number; // 0.0 - 1.0
  priorityReason: string;
}

export function buildCompanySyllabus(
  topics: CompanyTopicDetail[],
): Record<string, CompanyTopicDetail[]> {
  const grouped: Record<string, CompanyTopicDetail[]> = {};

  for (const topic of topics) {
    const cat = topic.category || 'GENERAL';
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat].push(topic);
  }

  // Sort topics within categories by questionCount desc
  for (const cat of Object.keys(grouped)) {
    const list = grouped[cat];
    if (list) {
      list.sort((a, b) => b.questionCount - a.questionCount);
    }
  }

  return grouped;
}

export function buildCompanyPattern(
  rounds: Array<{
    sequence: number;
    title: string;
    roundType: string;
    mode: string;
    durationMinutes: number | null;
    topics?: string[];
  }>,
  roleFamily?: RoleFamily,
): CompanyRoundPattern[] {
  if (rounds.length > 0) {
    return rounds
      .sort((a, b) => a.sequence - b.sequence)
      .map((r) => ({
        sequence: r.sequence,
        title: r.title,
        type: r.roundType,
        mode: r.mode,
        durationMinutes: r.durationMinutes,
        focusTopics: r.topics || [],
      }));
  }

  // Fallback defaults based on role family
  switch (roleFamily) {
    case RoleFamily.DATA_ANALYTICS:
      return [
        {
          sequence: 1,
          title: 'Aptitude & SQL Screening',
          type: 'ONLINE_TEST',
          mode: 'ONLINE',
          durationMinutes: 60,
          focusTopics: ['SQL Queries', 'Probability & Statistics', 'Logical Reasoning'],
        },
        {
          sequence: 2,
          title: 'Technical Case Study / Python',
          type: 'TECHNICAL_INTERVIEW',
          mode: 'ONLINE',
          durationMinutes: 45,
          focusTopics: ['Data Modeling', 'Python (Pandas/NumPy)', 'Business Insights'],
        },
        {
          sequence: 3,
          title: 'Managerial & HR Fit',
          type: 'HR_INTERVIEW',
          mode: 'OFFLINE',
          durationMinutes: 30,
          focusTopics: ['Behavioral Scenarios', 'Culture Fit'],
        },
      ];
    default:
      return [
        {
          sequence: 1,
          title: 'Online Assessment (DSA & Aptitude)',
          type: 'ONLINE_TEST',
          mode: 'ONLINE',
          durationMinutes: 90,
          focusTopics: ['Data Structures & Algorithms', 'Quantitative Aptitude', 'CS Fundamentals'],
        },
        {
          sequence: 2,
          title: 'Technical Interview (Coding & System Design)',
          type: 'TECHNICAL_INTERVIEW',
          mode: 'ONLINE',
          durationMinutes: 60,
          focusTopics: ['Coding Problem Solving', 'DBMS & OOP', 'Projects'],
        },
        {
          sequence: 3,
          title: 'HR & Cultural Alignment',
          type: 'HR_INTERVIEW',
          mode: 'OFFLINE',
          durationMinutes: 30,
          focusTopics: ['Behavioral Questions', 'Role Expectations'],
        },
      ];
  }
}

export function generateCompanyPrepFocus(
  studentWeakTopicSlugs: Array<{ slug: string; name: string; category: string; mastery: number }>,
  companyTestedTopicSlugs: string[],
): PrepFocusItem[] {
  const testedSet = new Set(companyTestedTopicSlugs.map((s) => s.toLowerCase()));
  const focusItems: PrepFocusItem[] = [];

  for (const topic of studentWeakTopicSlugs) {
    const isDirectlyTested = testedSet.has(topic.slug.toLowerCase());
    if (isDirectlyTested) {
      focusItems.push({
        topicId: topic.slug,
        topicName: topic.name,
        topicCategory: topic.category,
        currentMastery: topic.mastery,
        priorityReason: `Tested frequently by this company (Current mastery: ${Math.round(topic.mastery * 100)}%)`,
      });
    } else if (topic.mastery < 0.4) {
      focusItems.push({
        topicId: topic.slug,
        topicName: topic.name,
        topicCategory: topic.category,
        currentMastery: topic.mastery,
        priorityReason: `Foundational prerequisite with low mastery (${Math.round(topic.mastery * 100)}%)`,
      });
    }
  }

  // Sort by lowest mastery first
  return focusItems.sort((a, b) => a.currentMastery - b.currentMastery);
}
