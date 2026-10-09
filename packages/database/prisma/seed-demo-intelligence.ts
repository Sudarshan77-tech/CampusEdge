import {
  PrismaClient,
  CompanyStatus,
  TopicCategory,
  DriveStatus,
  DriveType,
  DriveCategory,
  JobType,
  RoundType,
  RoundMode,
  ApplicationStatus,
  ExperienceStatus,
  ExperienceOutcome,
  NoticeAudience,
  NoticeStatus,
  Degree,
  Role,
  UserStatus,
  ConsentType,
} from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const DEMO_COLLEGE_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.info('=== Seeding Phase 2 Placement Intelligence Demo Data ===');

  // Verify College
  const college = await prisma.college.findUnique({
    where: { id: DEMO_COLLEGE_ID },
  });
  if (!college) {
    throw new Error(`Demo college ${DEMO_COLLEGE_ID} not found. Please run base seed first.`);
  }
  console.info(`[College Verified] ${college.name} (${college.id})`);

  // Ensure Branches
  const cseBranch = await prisma.branch.findFirst({
    where: { collegeId: DEMO_COLLEGE_ID, code: 'CSE' },
  });
  const eceBranch = await prisma.branch.findFirst({
    where: { collegeId: DEMO_COLLEGE_ID, code: 'ECE' },
  });
  const iseBranch = await prisma.branch.findFirst({
    where: { collegeId: DEMO_COLLEGE_ID, code: 'ISE' },
  });

  // 1. Seed Topics Taxonomy
  const topicsData = [
    { name: 'Data Structures & Algorithms', slug: 'dsa', category: TopicCategory.DSA },
    { name: 'Dynamic Programming', slug: 'dp', category: TopicCategory.DSA },
    { name: 'Trees & Graphs', slug: 'trees-graphs', category: TopicCategory.DSA },
    {
      name: 'System Design & Scalability',
      slug: 'system-design',
      category: TopicCategory.SYSTEM_DESIGN,
    },
    { name: 'Relational Databases & SQL', slug: 'sql-dbms', category: TopicCategory.SQL },
    { name: 'Operating Systems & Concurrency', slug: 'os-concurrency', category: TopicCategory.OS },
    { name: 'Computer Networks', slug: 'networks', category: TopicCategory.NETWORKS },
    { name: 'HR & Behavioral Competencies', slug: 'hr-behavioral', category: TopicCategory.HR },
    { name: 'Quantitative Aptitude', slug: 'aptitude', category: TopicCategory.APTITUDE },
  ];

  const topicsMap: Record<string, string> = {};
  for (const t of topicsData) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { name: t.name, category: t.category },
      create: { name: t.name, slug: t.slug, category: t.category },
    });
    topicsMap[t.slug] = topic.id;
  }
  console.info(`[Topics] Seeded ${Object.keys(topicsMap).length} placement taxonomy topics`);

  // 2. Seed Placement Seasons
  const seasonsData = [
    {
      label: '2022-23',
      batchYear: 2023,
      startDate: new Date('2022-07-01T00:00:00Z'),
      endDate: new Date('2023-06-30T23:59:59Z'),
      isCurrent: false,
    },
    {
      label: '2023-24',
      batchYear: 2024,
      startDate: new Date('2023-07-01T00:00:00Z'),
      endDate: new Date('2024-06-30T23:59:59Z'),
      isCurrent: false,
    },
    {
      label: '2024-25',
      batchYear: 2025,
      startDate: new Date('2024-07-01T00:00:00Z'),
      endDate: new Date('2025-06-30T23:59:59Z'),
      isCurrent: true,
    },
  ];

  const seasonMap: Record<string, string> = {};
  for (const s of seasonsData) {
    const season = await prisma.placementSeason.upsert({
      where: {
        collegeId_label: {
          collegeId: DEMO_COLLEGE_ID,
          label: s.label,
        },
      },
      update: {
        batchYear: s.batchYear,
        startDate: s.startDate,
        endDate: s.endDate,
        isCurrent: s.isCurrent,
      },
      create: {
        collegeId: DEMO_COLLEGE_ID,
        label: s.label,
        batchYear: s.batchYear,
        startDate: s.startDate,
        endDate: s.endDate,
        isCurrent: s.isCurrent,
      },
    });
    seasonMap[s.label] = season.id;
  }
  console.info(`[Seasons] Seeded 3 placement seasons (Current: 2024-25)`);

  // 3. Seed Verified Recruiter Companies
  const companiesData = [
    {
      name: 'Infosys',
      normalizedName: 'infosys',
      slug: 'infosys',
      website: 'https://www.infosys.com',
      industry: 'Information Technology',
      status: CompanyStatus.VERIFIED,
    },
    {
      name: 'Tata Consultancy Services',
      normalizedName: 'tata consultancy services',
      slug: 'tcs',
      website: 'https://www.tcs.com',
      industry: 'IT & Consulting',
      status: CompanyStatus.VERIFIED,
    },
    {
      name: 'Microsoft India',
      normalizedName: 'microsoft india',
      slug: 'microsoft-india',
      website: 'https://www.microsoft.com',
      industry: 'Enterprise Software & Cloud',
      status: CompanyStatus.VERIFIED,
    },
    {
      name: 'Amazon',
      normalizedName: 'amazon',
      slug: 'amazon',
      website: 'https://amazon.jobs',
      industry: 'E-commerce & Cloud Services',
      status: CompanyStatus.VERIFIED,
    },
    {
      name: 'Google',
      normalizedName: 'google',
      slug: 'google',
      website: 'https://careers.google.com',
      industry: 'Technology & Search',
      status: CompanyStatus.VERIFIED,
    },
    {
      name: 'Boutique AI Labs',
      normalizedName: 'boutique ai labs',
      slug: 'boutique-ai-labs',
      website: 'https://boutiqueailabs.example',
      industry: 'Artificial Intelligence',
      status: CompanyStatus.VERIFIED,
    },
  ];

  const companyMap: Record<string, string> = {};
  for (const c of companiesData) {
    const comp = await prisma.company.upsert({
      where: { normalizedName: c.normalizedName },
      update: {
        name: c.name,
        slug: c.slug,
        website: c.website,
        industry: c.industry,
        status: c.status,
      },
      create: {
        name: c.name,
        normalizedName: c.normalizedName,
        slug: c.slug,
        website: c.website,
        industry: c.industry,
        status: c.status,
      },
    });
    companyMap[c.slug] = comp.id;
  }
  console.info(`[Companies] Seeded ${Object.keys(companyMap).length} verified recruiter companies`);

  // 4. Ensure Demo Students Exist in DB
  const primaryStudentUser = await prisma.userProfile.findFirst({
    where: { email: 'student.demo@apex.edu' },
  });

  let primaryStudentId = primaryStudentUser?.id;
  if (!primaryStudentId) {
    // Fallback if dev users script hasn't run yet
    const newStudent = await prisma.userProfile.create({
      data: {
        id: randomUUID(),
        email: 'student.demo@apex.edu',
        fullName: 'Aarav Sharma',
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        collegeId: DEMO_COLLEGE_ID,
      },
    });
    primaryStudentId = newStudent.id;
  }

  // Ensure Student Profile for Aarav Sharma
  if (primaryStudentId && cseBranch) {
    await prisma.studentProfile.upsert({
      where: { userId: primaryStudentId },
      update: {
        collegeId: DEMO_COLLEGE_ID,
        branchId: cseBranch.id,
        degree: Degree.BTECH,
        batchYear: 2025,
        cgpa: 8.85,
        activeBacklogs: 0,
        enrollmentNumber: 'APEX-2021-CSE-001',
        targetRole: 'Software Development Engineer',
        onboardingCompletedAt: new Date(),
      },
      create: {
        userId: primaryStudentId,
        collegeId: DEMO_COLLEGE_ID,
        branchId: cseBranch.id,
        degree: Degree.BTECH,
        batchYear: 2025,
        cgpa: 8.85,
        activeBacklogs: 0,
        enrollmentNumber: 'APEX-2021-CSE-001',
        targetRole: 'Software Development Engineer',
        onboardingCompletedAt: new Date(),
      },
    });
  }

  // Create additional demo students for placement intelligence and small cohort test
  const additionalStudents = [
    {
      email: 'priya.demo@apex.edu',
      fullName: 'Priya Patel',
      branchId: eceBranch?.id || cseBranch!.id,
      cgpa: 7.45,
      activeBacklogs: 0,
      enrollment: 'APEX-2021-ECE-014',
    },
    {
      email: 'rohan.demo@apex.edu',
      fullName: 'Rohan Verma',
      branchId: cseBranch!.id,
      cgpa: 6.8,
      activeBacklogs: 1, // Has 1 active backlog to test backlog eligibility filter
      enrollment: 'APEX-2021-CSE-088',
    },
    {
      email: 'ananya.demo@apex.edu',
      fullName: 'Ananya Deshmukh',
      branchId: iseBranch?.id || cseBranch!.id,
      cgpa: 9.1,
      activeBacklogs: 0,
      enrollment: 'APEX-2021-ISE-003',
    },
  ];

  const studentIds: string[] = [primaryStudentId];
  for (const s of additionalStudents) {
    let u = await prisma.userProfile.findFirst({ where: { email: s.email } });
    if (!u) {
      u = await prisma.userProfile.create({
        data: {
          id: randomUUID(),
          email: s.email,
          fullName: s.fullName,
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
          collegeId: DEMO_COLLEGE_ID,
        },
      });
    }
    await prisma.studentProfile.upsert({
      where: { userId: u.id },
      update: {
        collegeId: DEMO_COLLEGE_ID,
        branchId: s.branchId,
        degree: Degree.BTECH,
        batchYear: 2025,
        cgpa: s.cgpa,
        activeBacklogs: s.activeBacklogs,
        enrollmentNumber: s.enrollment,
        onboardingCompletedAt: new Date(),
      },
      create: {
        userId: u.id,
        collegeId: DEMO_COLLEGE_ID,
        branchId: s.branchId,
        degree: Degree.BTECH,
        batchYear: 2025,
        cgpa: s.cgpa,
        activeBacklogs: s.activeBacklogs,
        enrollmentNumber: s.enrollment,
        onboardingCompletedAt: new Date(),
      },
    });
    studentIds.push(u.id);
  }
  console.info(`[Students] Synced ${studentIds.length} demo students for eligibility testing`);

  // 5. Seed Historical Drives (Season 2023-24)
  // Drive A: Infosys Campus Hiring 2024 (Cohort >= 3, unmasked CTC)
  let infosysDrive2024 = await prisma.drive.findFirst({
    where: {
      collegeId: DEMO_COLLEGE_ID,
      seasonId: seasonMap['2023-24']!,
      companyId: companyMap['infosys']!,
    },
  });
  if (!infosysDrive2024) {
    infosysDrive2024 = await prisma.drive.create({
      data: {
        collegeId: DEMO_COLLEGE_ID,
        seasonId: seasonMap['2023-24']!,
        companyId: companyMap['infosys']!,
        title: 'Infosys Campus Hiring 2024',
        driveType: DriveType.ON_CAMPUS,
        category: DriveCategory.REGULAR,
        status: DriveStatus.COMPLETED,
        isHistorical: true,
        registeredCount: 65,
        shortlistedCount: 18,
        selectedCount: 6, // >= 3 cohort: statistics will be shown
        visitDate: new Date('2023-11-15T10:00:00Z'),
      },
    });

    const role1 = await prisma.driveRole.create({
      data: {
        driveId: infosysDrive2024.id,
        collegeId: DEMO_COLLEGE_ID,
        title: 'Specialist Programmer (Power Programmer)',
        jobType: JobType.FULL_TIME,
        ctcLpaMin: 9.5,
        ctcLpaMax: 9.5,
        openings: 5,
        location: 'Bengaluru / Pune / Hyderabad',
      },
    });

    await prisma.driveRole.create({
      data: {
        driveId: infosysDrive2024.id,
        collegeId: DEMO_COLLEGE_ID,
        title: 'Systems Engineer',
        jobType: JobType.FULL_TIME,
        ctcLpaMin: 3.6,
        ctcLpaMax: 4.0,
        openings: 20,
        location: 'PAN India',
      },
    });

    // Seed historical applications
    for (let i = 0; i < Math.min(3, studentIds.length); i++) {
      await prisma.driveApplication.upsert({
        where: {
          driveId_studentId: {
            driveId: infosysDrive2024.id,
            studentId: studentIds[i]!,
          },
        },
        update: {},
        create: {
          driveId: infosysDrive2024.id,
          studentId: studentIds[i]!,
          collegeId: DEMO_COLLEGE_ID,
          status: ApplicationStatus.SELECTED,
          offeredRoleId: role1.id,
          offeredCtcLpa: 9.5,
        },
      });
    }
  }

  // Drive B: Boutique AI Labs 2024 (Cohort < 3: DEMONSTRATES PRIVACY MASKING!)
  let smallCohortDrive = await prisma.drive.findFirst({
    where: {
      collegeId: DEMO_COLLEGE_ID,
      seasonId: seasonMap['2023-24']!,
      companyId: companyMap['boutique-ai-labs']!,
    },
  });
  if (!smallCohortDrive) {
    smallCohortDrive = await prisma.drive.create({
      data: {
        collegeId: DEMO_COLLEGE_ID,
        seasonId: seasonMap['2023-24']!,
        companyId: companyMap['boutique-ai-labs']!,
        title: 'Boutique AI Labs Research Hiring 2024',
        driveType: DriveType.ON_CAMPUS,
        category: DriveCategory.SUPER_DREAM,
        status: DriveStatus.COMPLETED,
        isHistorical: true,
        registeredCount: 15,
        shortlistedCount: 4,
        selectedCount: 2, // Cohort of 2 students < 3: triggers privacy mask!
        visitDate: new Date('2024-02-10T10:00:00Z'),
      },
    });

    const smallRole = await prisma.driveRole.create({
      data: {
        driveId: smallCohortDrive.id,
        collegeId: DEMO_COLLEGE_ID,
        title: 'AI Research Engineer',
        jobType: JobType.FULL_TIME,
        ctcLpaMin: 28.0,
        ctcLpaMax: 32.0,
        openings: 2,
        location: 'Bengaluru',
      },
    });

    // 2 offers
    for (let i = 0; i < 2; i++) {
      await prisma.driveApplication.upsert({
        where: {
          driveId_studentId: {
            driveId: smallCohortDrive.id,
            studentId: studentIds[i]!,
          },
        },
        update: {},
        create: {
          driveId: smallCohortDrive.id,
          studentId: studentIds[i]!,
          collegeId: DEMO_COLLEGE_ID,
          status: ApplicationStatus.SELECTED,
          offeredRoleId: smallRole.id,
          offeredCtcLpa: 28.0,
        },
      });
    }
  }

  // 6. Seed Current Season Drives (Season 2024-25)
  // Drive C: Infosys Special Drive 2025 (Recurring Recruiter: visited 2023-24 & 2024-25!)
  let infosysDrive2025 = await prisma.drive.findFirst({
    where: {
      collegeId: DEMO_COLLEGE_ID,
      seasonId: seasonMap['2024-25']!,
      companyId: companyMap['infosys']!,
    },
  });
  if (infosysDrive2025) {
    const appCount = await prisma.driveApplication.count({
      where: { driveId: infosysDrive2025.id },
    });
    if (appCount === 0) {
      await prisma.drive.delete({
        where: { id_collegeId: { id: infosysDrive2025.id, collegeId: DEMO_COLLEGE_ID } },
      });
      infosysDrive2025 = null;
    }
  }
  if (!infosysDrive2025) {
    const regOpens = new Date();
    regOpens.setDate(regOpens.getDate() - 2);
    const regDeadline = new Date();
    regDeadline.setDate(regDeadline.getDate() + 7);

    infosysDrive2025 = await prisma.drive.create({
      data: {
        collegeId: DEMO_COLLEGE_ID,
        seasonId: seasonMap['2024-25']!,
        companyId: companyMap['infosys']!,
        title: 'Infosys Specialist Programmer 2025',
        driveType: DriveType.ON_CAMPUS,
        category: DriveCategory.DREAM,
        status: DriveStatus.REGISTRATION_OPEN,
        isHistorical: false,
        visitDate: new Date(Date.now() + 14 * 86400000),
        registrationOpensAt: regOpens,
        registrationDeadline: regDeadline,
        venue: 'Auditorium A & Online Portal',
        description:
          'Elite programming hiring drive for specialist programmer and digital specialist engineer roles.',
      },
    });

    await prisma.driveRole.create({
      data: {
        driveId: infosysDrive2025.id,
        collegeId: DEMO_COLLEGE_ID,
        title: 'Specialist Programmer (SP)',
        jobType: JobType.FULL_TIME,
        ctcLpaMin: 9.5,
        ctcLpaMax: 10.5,
        location: 'Bengaluru / Pune',
        bondMonths: 12,
      },
    });

    // Eligibility: min CGPA 7.0, max backlogs 0
    await prisma.driveEligibility.create({
      data: {
        driveId: infosysDrive2025.id,
        collegeId: DEMO_COLLEGE_ID,
        minCgpa: 7.0,
        maxActiveBacklogs: 0,
        allowedDegrees: [Degree.BTECH],
        allowedBatchYears: [2025],
        notes: 'Strict zero active backlog criterion enforced at test time.',
      },
    });

    if (cseBranch && iseBranch && eceBranch) {
      await prisma.driveEligibleBranch.createMany({
        data: [
          { driveId: infosysDrive2025.id, branchId: cseBranch.id, collegeId: DEMO_COLLEGE_ID },
          { driveId: infosysDrive2025.id, branchId: iseBranch.id, collegeId: DEMO_COLLEGE_ID },
          { driveId: infosysDrive2025.id, branchId: eceBranch.id, collegeId: DEMO_COLLEGE_ID },
        ],
      });
    }

    // Rounds
    const round1 = await prisma.driveRound.create({
      data: {
        driveId: infosysDrive2025.id,
        collegeId: DEMO_COLLEGE_ID,
        sequence: 1,
        title: 'Online Coding Challenge',
        roundType: RoundType.CODING,
        durationMinutes: 180,
        difficulty: 4,
        mode: RoundMode.ONLINE,
        platformNote: 'HackerEarth Proctored Test (3 algorithmic questions)',
      },
    });

    await prisma.driveRoundTopic.createMany({
      data: [
        { roundId: round1.id, topicId: topicsMap['dsa']!, collegeId: DEMO_COLLEGE_ID },
        { roundId: round1.id, topicId: topicsMap['dp']!, collegeId: DEMO_COLLEGE_ID },
      ],
    });

    const round2 = await prisma.driveRound.create({
      data: {
        driveId: infosysDrive2025.id,
        collegeId: DEMO_COLLEGE_ID,
        sequence: 2,
        title: 'Technical & System Architecture Interview',
        roundType: RoundType.TECHNICAL_INTERVIEW,
        durationMinutes: 45,
        difficulty: 4,
        mode: RoundMode.IN_PERSON,
      },
    });

    await prisma.driveRoundTopic.createMany({
      data: [
        { roundId: round2.id, topicId: topicsMap['trees-graphs']!, collegeId: DEMO_COLLEGE_ID },
        { roundId: round2.id, topicId: topicsMap['sql-dbms']!, collegeId: DEMO_COLLEGE_ID },
      ],
    });

    // Seed 1 registered application with consent for Aarav Sharma
    await prisma.consentRecord.create({
      data: {
        userId: primaryStudentId!,
        driveId: infosysDrive2025.id,
        consentType: ConsentType.PLACEMENT_SHARING,
        policyVersion: '1.0',
        userAgent: 'Demo Browser Agent',
      },
    });

    await prisma.driveApplication.create({
      data: {
        driveId: infosysDrive2025.id,
        studentId: primaryStudentId!,
        collegeId: DEMO_COLLEGE_ID,
        status: ApplicationStatus.REGISTERED,
      },
    });
  }

  // Drive D: Microsoft University Hiring 2025 (Status: IN_PROGRESS)
  let msftDrive2025 = await prisma.drive.findFirst({
    where: {
      collegeId: DEMO_COLLEGE_ID,
      seasonId: seasonMap['2024-25']!,
      companyId: companyMap['microsoft-india']!,
    },
  });
  if (!msftDrive2025) {
    msftDrive2025 = await prisma.drive.create({
      data: {
        collegeId: DEMO_COLLEGE_ID,
        seasonId: seasonMap['2024-25']!,
        companyId: companyMap['microsoft-india']!,
        title: 'Microsoft University Hiring 2025',
        driveType: DriveType.ON_CAMPUS,
        category: DriveCategory.SUPER_DREAM,
        status: DriveStatus.IN_PROGRESS,
        isHistorical: false,
        visitDate: new Date(Date.now() + 5 * 86400000),
        venue: 'Campus Tech Center, Lab 3',
        description: 'Software Engineer FTE hiring for Azure and Core OS teams.',
      },
    });

    await prisma.driveRole.create({
      data: {
        driveId: msftDrive2025.id,
        collegeId: DEMO_COLLEGE_ID,
        title: 'Software Engineer',
        jobType: JobType.FULL_TIME,
        ctcLpaMin: 45.0,
        ctcLpaMax: 51.5,
        openings: 8,
        location: 'Bengaluru / Hyderabad / Noida',
      },
    });

    await prisma.driveEligibility.create({
      data: {
        driveId: msftDrive2025.id,
        collegeId: DEMO_COLLEGE_ID,
        minCgpa: 8.5, // Aarav (8.85) is eligible; Priya (7.45) & Rohan (6.8) are ineligible!
        maxActiveBacklogs: 0,
        allowedDegrees: [Degree.BTECH],
        allowedBatchYears: [2025],
        notes: 'Strict 8.5 CGPA cut-off. Shortlisting based on coding test scores.',
      },
    });

    if (cseBranch && iseBranch) {
      await prisma.driveEligibleBranch.createMany({
        data: [
          { driveId: msftDrive2025.id, branchId: cseBranch.id, collegeId: DEMO_COLLEGE_ID },
          { driveId: msftDrive2025.id, branchId: iseBranch.id, collegeId: DEMO_COLLEGE_ID },
        ],
      });
    }

    // Shortlisted candidate
    await prisma.driveApplication.create({
      data: {
        driveId: msftDrive2025.id,
        studentId: primaryStudentId!,
        collegeId: DEMO_COLLEGE_ID,
        status: ApplicationStatus.SHORTLISTED,
      },
    });
  }

  // 7. Seed Notices
  const existingNotice = await prisma.notice.findFirst({
    where: {
      collegeId: DEMO_COLLEGE_ID,
      title: 'Infosys Specialist Programmer 2025: Registrations Now Live',
    },
  });
  if (!existingNotice) {
    await prisma.notice.create({
      data: {
        collegeId: DEMO_COLLEGE_ID,
        title: 'Infosys Specialist Programmer 2025: Registrations Now Live',
        body: 'Eligible students from CSE, ISE and ECE branches can now apply for the upcoming Specialist Programmer recruitment drive. Ensure all academic details and active backlog status are verified on your student dashboard before registration closes.',
        audience: NoticeAudience.ALL,
        status: NoticeStatus.PUBLISHED,
        isPinned: true,
        publishedAt: new Date(),
        driveId: infosysDrive2025?.id,
      },
    });
    console.info('[Notices] Seeded pinned recruitment notice');
  }

  // 8. Seed Approved & Moderated Interview Experiences
  const existingExp = await prisma.experience.findFirst({
    where: {
      collegeId: DEMO_COLLEGE_ID,
      companyId: companyMap['microsoft-india']!,
      authorId: primaryStudentId!,
    },
  });
  if (!existingExp && primaryStudentId) {
    const exp1 = await prisma.experience.create({
      data: {
        collegeId: DEMO_COLLEGE_ID,
        companyId: companyMap['microsoft-india']!,
        authorId: primaryStudentId,
        roleTitle: 'Software Engineer',
        seasonLabel: '2023-24',
        difficulty: 4,
        outcome: ExperienceOutcome.SELECTED,
        overallSummary:
          'The interview process was rigorous but structured. Focus heavily on Trees, Graph traversals, Dynamic Programming and basic System Design concepts for scalable distributed services.',
        tips: 'Clarify constraints early, dry run your code on edge cases before pressing submit, and communicate your thought process out loud to the interviewer.',
        isAnonymous: true,
        status: ExperienceStatus.APPROVED,
        reviewedAt: new Date(),
      },
    });

    const expRound1 = await prisma.experienceRound.create({
      data: {
        experienceId: exp1.id,
        collegeId: DEMO_COLLEGE_ID,
        sequence: 1,
        roundType: RoundType.TECHNICAL_INTERVIEW,
        difficulty: 4,
        description:
          'DSA Round: Solved 2 LeetCode Medium/Hard questions on Binary Tree Lowest Common Ancestor and 2D Matrix DP.',
      },
    });

    await prisma.experienceRoundTopic.createMany({
      data: [
        { roundId: expRound1.id, topicId: topicsMap['trees-graphs']!, collegeId: DEMO_COLLEGE_ID },
        { roundId: expRound1.id, topicId: topicsMap['dp']!, collegeId: DEMO_COLLEGE_ID },
      ],
    });

    const expRound2 = await prisma.experienceRound.create({
      data: {
        experienceId: exp1.id,
        collegeId: DEMO_COLLEGE_ID,
        sequence: 2,
        roundType: RoundType.TECHNICAL_INTERVIEW,
        difficulty: 4,
        description:
          'System Design & OS: Designed a distributed rate limiter and discussed thread-safety, locking, and Redis token bucket implementation.',
      },
    });

    await prisma.experienceRoundTopic.createMany({
      data: [
        { roundId: expRound2.id, topicId: topicsMap['system-design']!, collegeId: DEMO_COLLEGE_ID },
        {
          roundId: expRound2.id,
          topicId: topicsMap['os-concurrency']!,
          collegeId: DEMO_COLLEGE_ID,
        },
      ],
    });

    console.info('[Experiences] Seeded approved interview experience with multi-round topics');
  }

  // Reported Experience (status: UNDER_REVIEW to test moderation queue)
  const existingReportedExp = await prisma.experience.findFirst({
    where: {
      collegeId: DEMO_COLLEGE_ID,
      roleTitle: 'Consultant Trainee (Flagged Under Review)',
    },
  });
  if (!existingReportedExp && studentIds[1]) {
    const flaggedExp = await prisma.experience.create({
      data: {
        collegeId: DEMO_COLLEGE_ID,
        companyId: companyMap['tcs']!,
        authorId: studentIds[1],
        roleTitle: 'Consultant Trainee (Flagged Under Review)',
        seasonLabel: '2023-24',
        difficulty: 3,
        outcome: ExperienceOutcome.NOT_SELECTED,
        overallSummary:
          'Confidential assessment leak sample - flagged by peer students for NDA violation.',
        isAnonymous: true,
        status: ExperienceStatus.UNDER_REVIEW,
      },
    });

    // 3 reports
    for (let i = 0; i < 3; i++) {
      await prisma.experienceReport.create({
        data: {
          experienceId: flaggedExp.id,
          collegeId: DEMO_COLLEGE_ID,
          reporterId: studentIds[i % studentIds.length]!,
          reason: 'Violates confidentiality agreement / shared exact copyrighted questions.',
        },
      });
    }
    console.info('[Experiences] Seeded flagged experience in moderation queue with 3 reports');
  }

  console.info('=== Phase 2 Placement Intelligence Seeding Completed Successfully! ===');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
