import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { QuestionsService } from '../questions/questions.service';
import { CurrentUser } from '@campusedge/shared';

@Injectable()
export class AdminReadinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly questionsService: QuestionsService,
  ) {}

  /**
   * Super Admin multi-institution readiness overview benchmarking colleges across the platform.
   */
  async getMultiInstitutionOverview() {
    const colleges = await this.prisma.college.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        state: true,
        status: true,
      },
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const overview = await Promise.all(
      colleges.map(async (college) => {
        // Total students
        const totalStudents = await this.prisma.studentProfile.count({
          where: { collegeId: college.id },
        });

        // Diagnostic completed count
        const diagnosticAttempts = await this.prisma.attempt.findMany({
          where: {
            collegeId: college.id,
            kind: 'DIAGNOSTIC',
            status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
          },
          select: { studentId: true },
        });

        const distinctDiagnosticStudents = new Set(diagnosticAttempts.map((a) => a.studentId));
        const diagnosticCompletedCount = distinctDiagnosticStudents.size;
        const diagnosticCompletionPercent =
          totalStudents > 0
            ? Math.round((diagnosticCompletedCount / totalStudents) * 1000) / 10
            : 0;

        // Average readiness score
        const snapshots = await this.prisma.readinessSnapshot.findMany({
          where: { collegeId: college.id },
          orderBy: { computedAt: 'desc' },
        });

        const latestByStudent = new Map<string, number>();
        for (const snap of snapshots) {
          if (!latestByStudent.has(snap.studentId)) {
            latestByStudent.set(snap.studentId, snap.score);
          }
        }

        const scores = Array.from(latestByStudent.values());
        const averageReadinessScore =
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
            : null;

        // Active students in last 7 days
        const activeItems = await this.prisma.attemptItem.findMany({
          where: {
            collegeId: college.id,
            answeredAt: { gte: sevenDaysAgo },
          },
          select: { attempt: { select: { studentId: true } } },
        });

        const distinctActiveStudents = new Set(activeItems.map((i) => i.attempt.studentId));
        const activeStudentsLast7d = distinctActiveStudents.size;

        return {
          collegeId: college.id,
          collegeName: college.name,
          slug: college.slug,
          city: college.city,
          state: college.state,
          status: college.status,
          totalStudents,
          diagnosticCompletedCount,
          diagnosticCompletionPercent,
          averageReadinessScore,
          activeStudentsLast7d,
        };
      }),
    );

    return overview;
  }

  /**
   * Question bank health and moderation queue metrics for Super Admin cockpit.
   */
  async getQuestionBankHealth() {
    const questions = await this.prisma.question.findMany({
      select: {
        id: true,
        status: true,
      },
    });

    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      IN_REVIEW: 0,
      APPROVED: 0,
      FLAGGED: 0,
      REJECTED: 0,
      RETIRED: 0,
    };

    for (const q of questions) {
      const current = statusCounts[q.status];
      if (current !== undefined) {
        statusCounts[q.status] = current + 1;
      }
    }

    // Reports queue count
    const totalReports = await this.prisma.questionReport.count();

    // Top flagged questions
    const flaggedQuestions = await this.prisma.question.findMany({
      where: {
        OR: [{ status: 'FLAGGED' }, { reports: { some: {} } }],
      },
      include: {
        currentVersion: {
          select: { stem: true },
        },
        topic: {
          select: { name: true, category: true },
        },
        reports: {
          select: {
            id: true,
            reason: true,
            note: true,
            createdAt: true,
            reporter: { select: { fullName: true, email: true } },
          },
        },
      },
      take: 20,
    });

    const sortedFlagged = flaggedQuestions
      .map((q) => ({
        id: q.id,
        status: q.status,
        topicName: q.topic.name,
        category: q.topic.category,
        difficulty: q.difficulty,
        stem: q.currentVersion?.stem || 'N/A',
        reportCount: q.reports.length,
        reports: q.reports,
      }))
      .sort((a, b) => b.reportCount - a.reportCount);

    return {
      totalQuestions: questions.length,
      statusBreakdown: statusCounts,
      pendingReportsCount: totalReports,
      flaggedQuestions: sortedFlagged,
    };
  }

  /**
   * Approve a question from moderation queue.
   */
  async approveQuestion(questionId: string, user: CurrentUser) {
    return this.questionsService.approve(questionId, user);
  }

  /**
   * Reject a question with an official moderator note.
   */
  async rejectQuestion(questionId: string, note: string, user: CurrentUser) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: {
        status: 'RETIRED',
      },
    });

    await this.auditService.log({
      actorId: user.userId,
      collegeId: user.collegeId,
      action: 'REJECT_QUESTION',
      entityType: 'Question',
      entityId: questionId,
      metadata: {
        note: note || 'Rejected by Super Admin moderator',
        previousStatus: question.status,
      },
    });

    return {
      success: true,
      question: updated,
    };
  }
}
