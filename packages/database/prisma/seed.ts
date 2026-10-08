import { PrismaClient, Role, CollegeStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_COLLEGE_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_ADMIN_ID = '00000000-0000-0000-0000-000000000002';

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Upsert Demo College
  const college = await prisma.college.upsert({
    where: { id: DEMO_COLLEGE_ID },
    update: {
      name: 'Apex Institute of Engineering & Technology',
      slug: 'apex-iet',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: CollegeStatus.ACTIVE,
    },
    create: {
      id: DEMO_COLLEGE_ID,
      name: 'Apex Institute of Engineering & Technology',
      slug: 'apex-iet',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: CollegeStatus.ACTIVE,
    },
  });
  console.log(`[Seed] College verified: ${college.name} (${college.id})`);

  // 2. Upsert Demo Placement Admin
  const adminProfile = await prisma.userProfile.upsert({
    where: { id: DEMO_ADMIN_ID },
    update: {
      fullName: 'Chief Placement Officer',
      collegeId: college.id,
      role: Role.COLLEGE_ADMIN,
    },
    create: {
      id: DEMO_ADMIN_ID,
      email: 'tpo@apex-iet.edu.in',
      fullName: 'Chief Placement Officer',
      collegeId: college.id,
      role: Role.COLLEGE_ADMIN,
    },
  });
  console.log(
    `[Seed] Placement Officer Profile verified: ${adminProfile.fullName} (${adminProfile.email})`,
  );

  // 3. Upsert System Initialization Audit Log
  await prisma.auditLog.create({
    data: {
      collegeId: college.id,
      actorId: adminProfile.id,
      action: 'SYSTEM_SEEDED',
      entityType: 'COLLEGE',
      entityId: college.id,
      metadata: { seedVersion: '1.0.0', initializedAt: new Date().toISOString() },
    },
  });
  console.log('[Seed] System seed audit log recorded.');

  console.log('--- Database Seeding Finished Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
