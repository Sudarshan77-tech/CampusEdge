import { PrismaClient, CollegeStatus, SkillCategory } from '@prisma/client';

const prisma = new PrismaClient();

export const DEMO_COLLEGE_ID = '00000000-0000-0000-0000-000000000001';

const STARTER_SKILLS = [
  // Languages
  { name: 'TypeScript', category: SkillCategory.LANGUAGE },
  { name: 'JavaScript', category: SkillCategory.LANGUAGE },
  { name: 'Python', category: SkillCategory.LANGUAGE },
  { name: 'Java', category: SkillCategory.LANGUAGE },
  { name: 'C++', category: SkillCategory.LANGUAGE },
  { name: 'Go', category: SkillCategory.LANGUAGE },
  { name: 'SQL', category: SkillCategory.LANGUAGE },

  // Frameworks & Libraries
  { name: 'Next.js', category: SkillCategory.FRAMEWORK },
  { name: 'React', category: SkillCategory.FRAMEWORK },
  { name: 'NestJS', category: SkillCategory.FRAMEWORK },
  { name: 'Node.js', category: SkillCategory.FRAMEWORK },
  { name: 'Spring Boot', category: SkillCategory.FRAMEWORK },
  { name: 'FastAPI', category: SkillCategory.FRAMEWORK },

  // Databases
  { name: 'PostgreSQL', category: SkillCategory.DATABASE },
  { name: 'MongoDB', category: SkillCategory.DATABASE },
  { name: 'Redis', category: SkillCategory.DATABASE },

  // CS Fundamentals
  { name: 'Data Structures & Algorithms', category: SkillCategory.CS_FUNDAMENTAL },
  { name: 'System Design', category: SkillCategory.CS_FUNDAMENTAL },
  { name: 'Operating Systems', category: SkillCategory.CS_FUNDAMENTAL },
  { name: 'Database Management Systems', category: SkillCategory.CS_FUNDAMENTAL },
  { name: 'Computer Networks', category: SkillCategory.CS_FUNDAMENTAL },

  // Tools
  { name: 'Git & GitHub', category: SkillCategory.TOOL },
  { name: 'Docker', category: SkillCategory.TOOL },
  { name: 'Linux', category: SkillCategory.TOOL },
  { name: 'Kubernetes', category: SkillCategory.TOOL },
  { name: 'CI/CD Pipelines', category: SkillCategory.TOOL },
];

async function main() {
  console.info('--- Starting Database Seeding ---');

  // 1. Upsert Demo College
  const college = await prisma.college.upsert({
    where: { id: DEMO_COLLEGE_ID },
    update: {
      name: 'Apex Institute of Engineering & Technology',
      slug: 'apex-iet',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: CollegeStatus.ACTIVE,
      emailDomains: ['apex.edu', 'campusedge.internal'],
      requireStudentApproval: false,
      contactEmail: 'admissions@apex.edu',
    },
    create: {
      id: DEMO_COLLEGE_ID,
      name: 'Apex Institute of Engineering & Technology',
      slug: 'apex-iet',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: CollegeStatus.ACTIVE,
      emailDomains: ['apex.edu', 'campusedge.internal'],
      requireStudentApproval: false,
      contactEmail: 'admissions@apex.edu',
    },
  });
  console.info(`[Seed] College verified: ${college.name} (${college.id})`);

  // 2. Upsert Branches
  const branches = [
    { name: 'Computer Science & Engineering', code: 'CSE' },
    { name: 'Electronics & Communication Engineering', code: 'ECE' },
    { name: 'Information Science & Engineering', code: 'ISE' },
    { name: 'Mechanical Engineering', code: 'MECH' },
  ];

  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: {
        collegeId_code: {
          collegeId: college.id,
          code: b.code,
        },
      },
      update: { name: b.name, isActive: true },
      create: {
        collegeId: college.id,
        name: b.name,
        code: b.code,
        isActive: true,
      },
    });
    console.info(`[Seed] Branch verified: ${branch.name} [${branch.code}]`);
  }

  // 3. Upsert Starter Skills
  for (const skill of STARTER_SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category },
      create: {
        name: skill.name,
        category: skill.category,
      },
    });
  }
  console.info(`[Seed] Seeded ${STARTER_SKILLS.length} starter skills into catalog.`);

  console.info('--- Database Seeding Finished Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
