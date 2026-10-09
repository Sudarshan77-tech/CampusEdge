import { PrismaClient, Role, UserStatus, Degree } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { validateSeedTarget } from './seed-dev-users.validator';

export { validateSeedTarget };

const prisma = new PrismaClient();

const DEMO_COLLEGE_ID = '00000000-0000-0000-0000-000000000001';

async function seedDevUsers() {
  console.info('=== Supabase Dev Users Seeding ===');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';
  const demoPassword = process.env.SEED_DEMO_PASSWORD;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      'Error: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SECRET_KEY must be set in environment.',
    );
  }

  if (!demoPassword) {
    throw new Error('Error: SEED_DEMO_PASSWORD must be configured in environment.');
  }

  const validation = validateSeedTarget({
    supabaseUrl,
    nodeEnv: process.env.NODE_ENV,
    allowLocalDemoSeed: process.env.ALLOW_LOCAL_DEMO_SEED,
    allowedRemoteProjectRefs: process.env.ALLOWED_REMOTE_PROJECT_REFS,
  });

  if (!validation.valid) {
    throw new Error(`[Safety Refusal] ${validation.errorMessage}`);
  }

  if (validation.isLocal) {
    console.info(
      '[Safety Check] Local development environment verified (http://127.0.0.1:54321). Proceeding with local demo seed.',
    );
  } else {
    console.info(
      `[Safety Check] Target Project Ref: "${validation.projectRef}" (Allowlisted remote target). Proceeding with remote demo seed.`,
    );
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const demoAccounts = [
    {
      email: 'student.demo@apex.edu',
      fullName: 'Aarav Sharma',
      role: Role.STUDENT,
      collegeId: DEMO_COLLEGE_ID,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'placement.admin@apex.edu',
      fullName: 'Dr. Ramesh Kumar (Placement Officer)',
      role: Role.COLLEGE_ADMIN,
      collegeId: DEMO_COLLEGE_ID,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'superadmin@campusedge.internal',
      fullName: 'CampusEdge Super Admin',
      role: Role.SUPER_ADMIN,
      collegeId: null,
      status: UserStatus.ACTIVE,
    },
  ];

  // List existing users to avoid duplicates
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (listError) {
    throw new Error(`Failed to query Supabase Auth users: ${listError.message}`);
  }

  const existingAuthUsers = usersData?.users || [];

  for (const acc of demoAccounts) {
    const existing = existingAuthUsers.find(
      (u) => u.email?.toLowerCase() === acc.email.toLowerCase(),
    );

    let authUserId: string;

    if (existing) {
      authUserId = existing.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
        password: demoPassword,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName },
        app_metadata: { role: acc.role, college_id: acc.collegeId },
      });
      if (updateError) {
        console.error(`Failed to update auth user ${acc.email}:`, updateError.message);
        continue;
      }
      console.info(`[Auth User Updated] ${acc.email} (${authUserId})`);
    } else {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName },
        app_metadata: { role: acc.role, college_id: acc.collegeId },
      });

      if (createError || !created.user) {
        console.error(`Failed to create auth user ${acc.email}:`, createError?.message);
        continue;
      }
      authUserId = created.user.id;
      console.info(`[Auth User Created] ${acc.email} (${authUserId})`);
    }

    // Upsert UserProfile in Database
    await prisma.userProfile.upsert({
      where: { id: authUserId },
      update: {
        fullName: acc.fullName,
        email: acc.email.toLowerCase(),
        role: acc.role,
        status: acc.status,
        collegeId: acc.collegeId,
      },
      create: {
        id: authUserId,
        fullName: acc.fullName,
        email: acc.email.toLowerCase(),
        role: acc.role,
        status: acc.status,
        collegeId: acc.collegeId,
      },
    });
    console.info(`[Profile Synced] ${acc.fullName} -> Role: ${acc.role}, Status: ${acc.status}`);

    // If student, seed a complete demo student profile
    if (acc.role === Role.STUDENT && acc.collegeId) {
      const cseBranch = await prisma.branch.findFirst({
        where: { collegeId: acc.collegeId, code: 'CSE' },
      });

      if (cseBranch) {
        await prisma.studentProfile.upsert({
          where: { userId: authUserId },
          update: {
            collegeId: acc.collegeId,
            branchId: cseBranch.id,
            degree: Degree.BTECH,
            batchYear: 2026,
            cgpa: 8.75,
            activeBacklogs: 0,
            enrollmentNumber: 'APEX-2022-CSE-042',
            targetRole: 'Full Stack Engineer',
            onboardingCompletedAt: new Date(),
          },
          create: {
            userId: authUserId,
            collegeId: acc.collegeId,
            branchId: cseBranch.id,
            degree: Degree.BTECH,
            batchYear: 2026,
            cgpa: 8.75,
            activeBacklogs: 0,
            enrollmentNumber: 'APEX-2022-CSE-042',
            targetRole: 'Full Stack Engineer',
            onboardingCompletedAt: new Date(),
          },
        });
        console.info(`[Student Profile Seeded] Enrollment: APEX-2022-CSE-042, CGPA: 8.75`);
      }
    }
  }

  console.info('=== Dev Users Seeding Complete ===');
}

seedDevUsers()
  .catch((e) => {
    console.error('Fatal error during seedDevUsers:', e.message || e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
