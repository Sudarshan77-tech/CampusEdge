import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  HISTORICAL_INTELLIGENCE_DISCLAIMER,
  RECURRING_RECRUITER_MIN_SEASONS,
  RECURRING_RECRUITER_LOOKBACK_SEASONS,
  MIN_COHORT_FOR_STATS,
  ExperienceStatus,
} from '@campusedge/shared';

@Injectable()
export class IntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recruiter Directory & Analytics for a college.
   */
  async getRecruiters(collegeId: string, search?: string) {
    // 1. Fetch recent seasons for this college to determine recurrence
    const seasons = await this.prisma.placementSeason.findMany({
      where: { collegeId },
      orderBy: { startDate: 'desc' },
      take: RECURRING_RECRUITER_LOOKBACK_SEASONS,
      select: { id: true, label: true },
    });
    const recentSeasonIds = new Set(seasons.map((s) => s.id));

    // 2. Fetch drives with company and roles
    const drives = await this.prisma.drive.findMany({
      where: {
        collegeId,
        ...(search
          ? {
              company: {
                name: { contains: search, mode: 'insensitive' },
              },
            }
          : {}),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            industry: true,
          },
        },
        roles: {
          select: {
            ctcLpaMin: true,
            ctcLpaMax: true,
          },
        },
        season: {
          select: { id: true, label: true },
        },
      },
    });

    // 3. Group by company
    const companyMap = new Map<
      string,
      {
        company: {
          id: string;
          name: string;
          slug: string;
          logoUrl: string | null;
          industry: string | null;
        };
        seasonIds: Set<string>;
        recentSeasonIds: Set<string>;
        totalOffers: number;
        totalRegistered: number;
        drivesCount: number;
        ctcMin: number | null;
        ctcMax: number | null;
        ctcValues: number[];
      }
    >();

    for (const drive of drives) {
      const cId = drive.companyId;
      if (!companyMap.has(cId)) {
        companyMap.set(cId, {
          company: drive.company,
          seasonIds: new Set(),
          recentSeasonIds: new Set(),
          totalOffers: 0,
          totalRegistered: 0,
          drivesCount: 0,
          ctcMin: null,
          ctcMax: null,
          ctcValues: [],
        });
      }

      const entry = companyMap.get(cId)!;
      entry.drivesCount += 1;
      entry.seasonIds.add(drive.seasonId);
      if (recentSeasonIds.has(drive.seasonId)) {
        entry.recentSeasonIds.add(drive.seasonId);
      }

      if (drive.selectedCount) entry.totalOffers += drive.selectedCount;
      if (drive.registeredCount) entry.totalRegistered += drive.registeredCount;

      for (const role of drive.roles) {
        const minVal = Number(role.ctcLpaMin);
        const maxVal = Number(role.ctcLpaMax);
        if (!isNaN(minVal)) {
          entry.ctcValues.push(minVal);
          if (entry.ctcMin === null || minVal < entry.ctcMin) entry.ctcMin = minVal;
        }
        if (!isNaN(maxVal)) {
          entry.ctcValues.push(maxVal);
          if (entry.ctcMax === null || maxVal > entry.ctcMax) entry.ctcMax = maxVal;
        }
      }
    }

    const recruiters = Array.from(companyMap.values()).map((entry) => {
      const avgCtc =
        entry.ctcValues.length > 0
          ? Number((entry.ctcValues.reduce((a, b) => a + b, 0) / entry.ctcValues.length).toFixed(2))
          : null;

      const isRecurring = entry.recentSeasonIds.size >= RECURRING_RECRUITER_MIN_SEASONS;

      const cohortSize = entry.totalOffers;
      const hideGranularStats = cohortSize > 0 && cohortSize < MIN_COHORT_FOR_STATS;

      return {
        company: entry.company,
        totalSeasonsVisited: entry.seasonIds.size,
        isRecurringRecruiter: isRecurring,
        totalOffers: entry.totalOffers,
        totalRegistered: entry.totalRegistered,
        drivesCount: entry.drivesCount,
        salaryMetrics: hideGranularStats
          ? {
              masked: true,
              message: 'Salary metrics hidden to preserve student privacy (cohort < 3).',
            }
          : {
              masked: false,
              ctcMinLpa: entry.ctcMin,
              ctcMaxLpa: entry.ctcMax,
              ctcAvgLpa: avgCtc,
            },
      };
    });

    // Sort recurring recruiters first, then highest offers
    recruiters.sort((a, b) => {
      if (a.isRecurringRecruiter !== b.isRecurringRecruiter) {
        return a.isRecurringRecruiter ? -1 : 1;
      }
      return b.totalOffers - a.totalOffers;
    });

    return {
      disclaimer: HISTORICAL_INTELLIGENCE_DISCLAIMER,
      totalCount: recruiters.length,
      recruiters,
    };
  }

  /**
   * Deep intelligence for a specific company at this college.
   */
  async getCompanyIntelligence(companyId: string, collegeId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    // 1. Fetch drives with seasons, roles, rounds
    const drives = await this.prisma.drive.findMany({
      where: { companyId, collegeId },
      orderBy: [{ visitDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        season: { select: { id: true, label: true } },
        roles: true,
        rounds: { orderBy: { sequence: 'asc' } },
      },
    });

    // 2. Fetch published interview experiences for this company and college
    const experiences = await this.prisma.experience.findMany({
      where: {
        companyId,
        collegeId,
        status: ExperienceStatus.APPROVED,
      },
      include: {
        rounds: {
          include: {
            topics: {
              include: { topic: true },
            },
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    // 3. Aggregate totals and cohort size
    let totalRegistered = 0;
    let totalShortlisted = 0;
    let totalSelected = 0;
    const ctcValues: number[] = [];
    let minCtc: number | null = null;
    let maxCtc: number | null = null;

    for (const drive of drives) {
      if (drive.registeredCount) totalRegistered += drive.registeredCount;
      if (drive.shortlistedCount) totalShortlisted += drive.shortlistedCount;
      if (drive.selectedCount) totalSelected += drive.selectedCount;

      for (const role of drive.roles) {
        const minVal = Number(role.ctcLpaMin);
        const maxVal = Number(role.ctcLpaMax);
        if (!isNaN(minVal)) {
          ctcValues.push(minVal);
          if (minCtc === null || minVal < minCtc) minCtc = minVal;
        }
        if (!isNaN(maxVal)) {
          ctcValues.push(maxVal);
          if (maxCtc === null || maxVal > maxCtc) maxCtc = maxVal;
        }
      }
    }

    const cohortSize = totalSelected;
    const hideGranularStats = cohortSize > 0 && cohortSize < MIN_COHORT_FOR_STATS;

    // 4. Round Sequence Patterns
    const roundSequenceMap = new Map<string, number>();
    for (const drive of drives) {
      if (drive.rounds.length > 0) {
        const pattern = drive.rounds.map((r: { roundType: string }) => r.roundType).join(' -> ');
        roundSequenceMap.set(pattern, (roundSequenceMap.get(pattern) || 0) + 1);
      }
    }
    for (const exp of experiences) {
      if (exp.rounds.length > 0) {
        const pattern = exp.rounds.map((r: { roundType: string }) => r.roundType).join(' -> ');
        roundSequenceMap.set(pattern, (roundSequenceMap.get(pattern) || 0) + 1);
      }
    }

    const commonSequences = Array.from(roundSequenceMap.entries())
      .map(([pattern, count]) => ({ pattern, frequency: count }))
      .sort((a, b) => b.frequency - a.frequency);

    // 5. Top Topics Asked
    const topicFrequencyMap = new Map<
      string,
      { id: string; name: string; category: string; count: number }
    >();

    for (const exp of experiences) {
      for (const round of exp.rounds) {
        for (const rt of round.topics) {
          const t = rt.topic;
          if (!topicFrequencyMap.has(t.id)) {
            topicFrequencyMap.set(t.id, {
              id: t.id,
              name: t.name,
              category: t.category,
              count: 0,
            });
          }
          topicFrequencyMap.get(t.id)!.count += 1;
        }
      }
    }

    const topTopics = Array.from(topicFrequencyMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // 6. Seasons Visited
    const uniqueSeasons = Array.from(new Set(drives.map((d) => d.season.label)));

    return {
      disclaimer: HISTORICAL_INTELLIGENCE_DISCLAIMER,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        website: company.website,
        industry: company.industry,
        logoUrl: company.logoUrl,
      },
      stats: {
        drivesCount: drives.length,
        seasonsVisited: uniqueSeasons,
        totalRegistered,
        totalShortlisted,
        totalSelected,
        selectionRate:
          totalRegistered > 0 ? Number(((totalSelected / totalRegistered) * 100).toFixed(1)) : 0,
      },
      salaryIntelligence: hideGranularStats
        ? {
            cohortTooSmall: true,
            message:
              'Granular salary metrics are masked for small cohorts (< 3 students) to preserve individual privacy.',
          }
        : {
            cohortTooSmall: false,
            minCtcLpa: minCtc,
            maxCtcLpa: maxCtc,
            avgCtcLpa:
              ctcValues.length > 0
                ? Number((ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length).toFixed(2))
                : null,
          },
      roundPatterns: commonSequences,
      topTopics,
      recentDrives: drives.map((d) => ({
        id: d.id,
        title: d.title,
        season: d.season.label,
        driveType: d.driveType,
        category: d.category,
        visitDate: d.visitDate,
        rolesCount: d.roles.length,
        roles: d.roles.map(
          (r: { title: string; jobType: any; ctcLpaMin: any; ctcLpaMax: any }) => ({
            title: r.title,
            jobType: r.jobType,
            ctcMin: Number(r.ctcLpaMin),
            ctcMax: Number(r.ctcLpaMax),
          }),
        ),
        registeredCount: d.registeredCount,
        selectedCount: d.selectedCount,
      })),
      experiencesCount: experiences.length,
    };
  }
}
