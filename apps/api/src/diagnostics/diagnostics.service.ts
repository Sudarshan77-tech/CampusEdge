import {
  Injectable,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CurrentUser,
  Role,
  AttemptStatus,
  ContentScope,
  TechnicalTrack,
  TestTemplateKind,
  TestTemplateStatus,
  TestGenerationMode,
  FORMULA_VERSION,
} from '@campusedge/shared';
import { AttemptsService } from '../attempts/attempts.service';
import {
  createPrng,
  selectQuestionsForRule,
  generateOptionOrder,
  CandidateQuestion,
} from '../tests/question-selector';

@Injectable()
export class DiagnosticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attemptsService: AttemptsService,
  ) {}

  /**
   * Start a new diagnostic assessment attempt for the authenticated student.
   * Enforces:
   * 1. Student role & college context
   * 2. 14-day diagnostic cooldown
   * 3. Single active attempt concurrency guard
   * 4. Track-aware 45-question blueprint with 15 easy / 20 medium / 10 hard difficulty distribution
   * 5. 30-day anti-repeat question avoidance
   * 6. Deterministic option randomization
   * 7. Strict 60-minute deadline
   * 8. Zero answer-key leakage
   */
  async startDiagnostic(user: CurrentUser) {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can take diagnostic assessments');
    }
    const collegeId = user.collegeId;
    if (!collegeId) {
      throw new BadRequestException('Student must be assigned to an active college');
    }

    // 1. Single IN_PROGRESS attempt concurrency guard
    const existingActive = await this.prisma.attempt.findFirst({
      where: {
        studentId: user.userId,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (existingActive) {
      const now = new Date();
      if (now > new Date(existingActive.deadlineAt.getTime() + 5000)) {
        await this.attemptsService.finalizeAttempt(existingActive.id, AttemptStatus.AUTO_SUBMITTED);
      } else {
        throw new ConflictException(
          'You already have an active test attempt in progress. Please submit or abandon it first.',
        );
      }
    }

    // 2. 14-Day Diagnostic Cooldown Enforcement
    const latestDiagnostic = await this.prisma.attempt.findFirst({
      where: {
        studentId: user.userId,
        kind: TestTemplateKind.DIAGNOSTIC,
        status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] },
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (latestDiagnostic && latestDiagnostic.submittedAt) {
      const cooldownMs = 14 * 24 * 60 * 60 * 1000;
      const elapsedMs = Date.now() - latestDiagnostic.submittedAt.getTime();
      if (elapsedMs < cooldownMs) {
        const nextAvailable = new Date(latestDiagnostic.submittedAt.getTime() + cooldownMs);
        throw new BadRequestException(
          `Diagnostic cooldown active. Diagnostic assessments can be retaken every 14 days. Next available test date: ${nextAvailable.toISOString().split('T')[0]}.`,
        );
      }
    }

    // 3. Determine student track
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.userId },
    });
    const isSoftwareTrack =
      !studentProfile?.technicalTrack || studentProfile.technicalTrack === TechnicalTrack.SOFTWARE;

    // 4. Ensure or fetch Global Diagnostic Template
    const templateTitle = isSoftwareTrack
      ? 'CampusEdge Comprehensive Diagnostic Assessment (Software Track)'
      : 'CampusEdge Comprehensive Diagnostic Assessment (General Track)';

    let template = await this.prisma.testTemplate.findFirst({
      where: {
        title: templateTitle,
        kind: TestTemplateKind.DIAGNOSTIC,
      },
      include: {
        sections: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!template) {
      template = await this.prisma.$transaction(async (tx) => {
        const t = await tx.testTemplate.create({
          data: {
            scope: ContentScope.GLOBAL,
            title: templateTitle,
            description:
              'Full-length 45-question diagnostic baseline benchmarking aptitude and technical readiness.',
            kind: TestTemplateKind.DIAGNOSTIC,
            durationMinutes: 60,
            shuffleQuestions: true,
            shuffleOptions: true,
            generationMode: TestGenerationMode.GENERATED,
            status: TestTemplateStatus.PUBLISHED,
          },
        });

        if (isSoftwareTrack) {
          await tx.testSection.createMany({
            data: [
              {
                templateId: t.id,
                sequence: 1,
                title: 'Quantitative Aptitude',
                marksPerQuestion: 1,
                negativeMarks: 0,
                questionCount: 10,
              },
              {
                templateId: t.id,
                sequence: 2,
                title: 'Logical Reasoning',
                marksPerQuestion: 1,
                negativeMarks: 0,
                questionCount: 10,
              },
              {
                templateId: t.id,
                sequence: 3,
                title: 'Verbal Ability',
                marksPerQuestion: 1,
                negativeMarks: 0,
                questionCount: 10,
              },
              {
                templateId: t.id,
                sequence: 4,
                title: 'Core Computer Science',
                marksPerQuestion: 1,
                negativeMarks: 0,
                questionCount: 15,
              },
            ],
          });
        } else {
          await tx.testSection.createMany({
            data: [
              {
                templateId: t.id,
                sequence: 1,
                title: 'Quantitative Aptitude',
                marksPerQuestion: 1,
                negativeMarks: 0,
                questionCount: 15,
              },
              {
                templateId: t.id,
                sequence: 2,
                title: 'Logical Reasoning',
                marksPerQuestion: 1,
                negativeMarks: 0,
                questionCount: 15,
              },
              {
                templateId: t.id,
                sequence: 3,
                title: 'Verbal Ability',
                marksPerQuestion: 1,
                negativeMarks: 0,
                questionCount: 15,
              },
            ],
          });
        }

        return tx.testTemplate.findUniqueOrThrow({
          where: { id: t.id },
          include: { sections: { orderBy: { sequence: 'asc' } } },
        });
      });
    }

    // 5. Query 30-day anti-repeat pool for student
    const startedAt = new Date();
    const thirtyDaysAgo = new Date(startedAt.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentAttempts = await this.prisma.attempt.findMany({
      where: {
        studentId: user.userId,
        startedAt: { gte: thirtyDaysAgo },
      },
      select: {
        items: { select: { questionId: true } },
      },
    });

    const recentQuestionIds = new Set<string>();
    for (const att of recentAttempts) {
      for (const it of att.items) {
        recentQuestionIds.add(it.questionId);
      }
    }

    // 6. Topic resolution
    const topics = await this.prisma.topic.findMany({
      select: { id: true, slug: true, category: true },
    });
    const topicBySlug = new Map(topics.map((t) => [t.slug, t.id]));

    const quantId = topicBySlug.get('aptitude') || topics[0]!.id;
    const logicalId = topicBySlug.get('logical') || topics[1]!.id;
    const verbalId = topicBySlug.get('verbal') || topics[2]!.id;
    const csTopicIds = topics
      .filter((t) =>
        ['dsa', 'sql-dbms', 'os-concurrency', 'networks', 'oop', 'programming'].includes(t.slug),
      )
      .map((t) => t.id);

    // 7. Define Blueprint Section Rules
    // Target difficulty distribution across entire test: 15 Easy, 20 Medium, 10 Hard.
    interface BlueprintRule {
      sectionSeq: number;
      topicIds: string[];
      count: number;
      difficultyMin: number;
      difficultyMax: number;
    }

    const rules: BlueprintRule[] = [];
    if (isSoftwareTrack) {
      // Sec 1: Quant (10) -> 3 easy, 5 medium, 2 hard
      rules.push(
        { sectionSeq: 1, topicIds: [quantId], count: 3, difficultyMin: 1, difficultyMax: 2 },
        { sectionSeq: 1, topicIds: [quantId], count: 5, difficultyMin: 3, difficultyMax: 3 },
        { sectionSeq: 1, topicIds: [quantId], count: 2, difficultyMin: 4, difficultyMax: 5 },
      );
      // Sec 2: Logical (10) -> 3 easy, 5 medium, 2 hard
      rules.push(
        { sectionSeq: 2, topicIds: [logicalId], count: 3, difficultyMin: 1, difficultyMax: 2 },
        { sectionSeq: 2, topicIds: [logicalId], count: 5, difficultyMin: 3, difficultyMax: 3 },
        { sectionSeq: 2, topicIds: [logicalId], count: 2, difficultyMin: 4, difficultyMax: 5 },
      );
      // Sec 3: Verbal (10) -> 3 easy, 4 medium, 3 hard
      rules.push(
        { sectionSeq: 3, topicIds: [verbalId], count: 3, difficultyMin: 1, difficultyMax: 2 },
        { sectionSeq: 3, topicIds: [verbalId], count: 4, difficultyMin: 3, difficultyMax: 3 },
        { sectionSeq: 3, topicIds: [verbalId], count: 3, difficultyMin: 4, difficultyMax: 5 },
      );
      // Sec 4: CS Fundamentals (15) -> 6 easy, 6 medium, 3 hard
      rules.push(
        { sectionSeq: 4, topicIds: csTopicIds, count: 6, difficultyMin: 1, difficultyMax: 2 },
        { sectionSeq: 4, topicIds: csTopicIds, count: 6, difficultyMin: 3, difficultyMax: 3 },
        { sectionSeq: 4, topicIds: csTopicIds, count: 3, difficultyMin: 4, difficultyMax: 5 },
      );
    } else {
      // Non-Software Track (45 Aptitude: 15 Quant, 15 Logical, 15 Verbal)
      // Quant (15) -> 5 easy, 7 medium, 3 hard
      rules.push(
        { sectionSeq: 1, topicIds: [quantId], count: 5, difficultyMin: 1, difficultyMax: 2 },
        { sectionSeq: 1, topicIds: [quantId], count: 7, difficultyMin: 3, difficultyMax: 3 },
        { sectionSeq: 1, topicIds: [quantId], count: 3, difficultyMin: 4, difficultyMax: 5 },
      );
      // Logical (15) -> 5 easy, 7 medium, 3 hard
      rules.push(
        { sectionSeq: 2, topicIds: [logicalId], count: 5, difficultyMin: 1, difficultyMax: 2 },
        { sectionSeq: 2, topicIds: [logicalId], count: 7, difficultyMin: 3, difficultyMax: 3 },
        { sectionSeq: 2, topicIds: [logicalId], count: 3, difficultyMin: 4, difficultyMax: 5 },
      );
      // Verbal (15) -> 5 easy, 6 medium, 4 hard
      rules.push(
        { sectionSeq: 3, topicIds: [verbalId], count: 5, difficultyMin: 1, difficultyMax: 2 },
        { sectionSeq: 3, topicIds: [verbalId], count: 6, difficultyMin: 3, difficultyMax: 3 },
        { sectionSeq: 3, topicIds: [verbalId], count: 4, difficultyMin: 4, difficultyMax: 5 },
      );
    }

    // 8. Execute Question Selection via PRNG
    const seed = Math.floor(Math.random() * 2147483647);
    const prng = createPrng(seed);

    interface SelectedQuestionItem {
      sectionSeq: number;
      position: number;
      questionId: string;
      versionId: string;
      optionCount: number;
    }

    const preparedItems: SelectedQuestionItem[] = [];
    const chosenQuestionIds = new Set<string>();
    let position = 1;

    for (const rule of rules) {
      const candidates = await this.prisma.question.findMany({
        where: {
          status: 'APPROVED',
          topicId: { in: rule.topicIds },
          difficulty: { gte: rule.difficultyMin, lte: rule.difficultyMax },
          OR: [{ scope: 'GLOBAL' }, { scope: 'COLLEGE', collegeId }],
          id: { notIn: Array.from(chosenQuestionIds) },
        },
        select: {
          id: true,
          topicId: true,
          subtopicId: true,
          difficulty: true,
          expectedTimeSeconds: true,
          currentVersionId: true,
        },
      });

      const candidatePool: CandidateQuestion[] = candidates.map((c) => ({
        id: c.id,
        topicId: c.topicId,
        subtopicId: c.subtopicId,
        difficulty: c.difficulty,
        expectedTimeSeconds: c.expectedTimeSeconds,
      }));

      // Combined anti-repeat with recently attempted and already chosen in this test
      const combinedAvoidIds = new Set([...recentQuestionIds, ...chosenQuestionIds]);

      const selected = selectQuestionsForRule(
        {
          topicId: rule.topicIds[0]!,
          count: rule.count,
          difficultyMin: rule.difficultyMin,
          difficultyMax: rule.difficultyMax,
        },
        candidatePool,
        combinedAvoidIds,
        prng,
      );

      for (const sq of selected) {
        chosenQuestionIds.add(sq.id);
        const fullQ = await this.prisma.question.findUnique({
          where: { id: sq.id },
          include: { currentVersion: { include: { options: true } } },
        });

        if (fullQ && fullQ.currentVersion) {
          preparedItems.push({
            sectionSeq: rule.sectionSeq,
            position: position++,
            questionId: fullQ.id,
            versionId: fullQ.currentVersion.id,
            optionCount: fullQ.currentVersion.options.length,
          });
        }
      }
    }

    if (preparedItems.length < 45) {
      // Fallback: If strict rule pools were tight, top up from any approved questions
      const remainingNeeded = 45 - preparedItems.length;
      const topUpQuestions = await this.prisma.question.findMany({
        where: {
          status: 'APPROVED',
          id: { notIn: Array.from(chosenQuestionIds) },
        },
        include: { currentVersion: { include: { options: true } } },
        take: remainingNeeded,
      });

      for (const tq of topUpQuestions) {
        if (tq.currentVersion) {
          preparedItems.push({
            sectionSeq: isSoftwareTrack ? 4 : 3,
            position: position++,
            questionId: tq.id,
            versionId: tq.currentVersion.id,
            optionCount: tq.currentVersion.options.length,
          });
        }
      }
    }

    // 9. Create Attempt Record
    const deadlineAt = new Date(startedAt.getTime() + 60 * 60 * 1000);

    const attempt = await this.prisma.$transaction(async (tx) => {
      const att = await tx.attempt.create({
        data: {
          studentId: user.userId,
          collegeId,
          templateId: template.id,
          kind: TestTemplateKind.DIAGNOSTIC,
          status: AttemptStatus.IN_PROGRESS,
          startedAt,
          deadlineAt,
          seed,
          totalMarks: preparedItems.length,
          formulaVersion: FORMULA_VERSION,
        },
      });

      const attemptItemsData = preparedItems.map((item) => {
        const optionOrder = generateOptionOrder(item.optionCount, seed, item.position);
        return {
          attemptId: att.id,
          collegeId,
          questionId: item.questionId,
          versionId: item.versionId,
          sectionSeq: item.sectionSeq,
          position: item.position,
          optionOrder,
          visited: item.position === 1,
        };
      });

      await tx.attemptItem.createMany({
        data: attemptItemsData,
      });

      return att;
    });

    // 10. Fetch sanitized attempt with zero answer key leakage
    return this.attemptsService.getAttempt(attempt.id, user);
  }
}
