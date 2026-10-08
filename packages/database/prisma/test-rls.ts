import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_COLLEGE_ID = '00000000-0000-0000-0000-000000000001';

async function testRls() {
  console.info('=== Starting Comprehensive RLS & Security Tests ===');

  const allowedRefs = (process.env.ALLOWED_REMOTE_PROJECT_REFS || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const projectRefMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  const currentRef = projectRefMatch ? projectRefMatch[1] : '';

  if (process.env.NODE_ENV === 'production') {
    console.error('Refusal: RLS test suite cannot run in NODE_ENV=production');
    process.exit(1);
  }

  if (currentRef && !allowedRefs.includes(currentRef)) {
    console.error(`Refusal: Project ref "${currentRef}" is not in allowlist.`);
    process.exit(1);
  }

  let passedTests = 0;
  let totalTests = 0;

  // Find seeded demo accounts
  const studentProfile = await prisma.userProfile.findFirst({
    where: { email: 'student.demo@apex.edu' },
  });
  const adminProfile = await prisma.userProfile.findFirst({
    where: { email: 'placement.admin@apex.edu' },
  });

  if (!studentProfile || !adminProfile) {
    console.error(
      'Prerequisite missing: Seeded demo users not found. Run db:seed:dev-users first.',
    );
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Test 1A: Audit Log UPDATE Immutability
  // -------------------------------------------------------------
  totalTests++;
  console.info('\n[Test 1A] Testing audit_logs UPDATE block trigger...');
  let updatePrevented = false;
  try {
    await prisma.$transaction(async (tx) => {
      const dummyLog = await tx.auditLog.create({
        data: {
          actorId: studentProfile.id,
          action: 'RLS_TEST_UPDATE',
          entityType: 'SecurityTest',
        },
      });
      // This will throw because of prevent_record_mutation trigger
      await tx.$executeRawUnsafe(
        `UPDATE public.audit_logs SET action = 'TAMPERED' WHERE id = '${dummyLog.id}'::uuid`,
      );
    });
  } catch (err: unknown) {
    if (String(err).includes('append-only')) {
      updatePrevented = true;
    }
  }

  if (updatePrevented) {
    console.info('  ✓ PASS: audit_logs trigger blocked UPDATE mutation.');
    passedTests++;
  } else {
    console.error('  ✗ FAIL: audit_logs allowed UPDATE mutation!');
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Test 1B: Audit Log DELETE Immutability
  // -------------------------------------------------------------
  totalTests++;
  console.info('\n[Test 1B] Testing audit_logs DELETE block trigger...');
  let deletePrevented = false;
  try {
    await prisma.$transaction(async (tx) => {
      const dummyLog = await tx.auditLog.create({
        data: {
          actorId: studentProfile.id,
          action: 'RLS_TEST_DELETE',
          entityType: 'SecurityTest',
        },
      });
      // This will throw because of prevent_record_mutation trigger
      await tx.$executeRawUnsafe(`DELETE FROM public.audit_logs WHERE id = '${dummyLog.id}'::uuid`);
    });
  } catch (err: unknown) {
    if (String(err).includes('append-only')) {
      deletePrevented = true;
    }
  }

  if (deletePrevented) {
    console.info('  ✓ PASS: audit_logs trigger blocked DELETE mutation.');
    passedTests++;
  } else {
    console.error('  ✗ FAIL: audit_logs allowed DELETE mutation!');
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Test 2: Anonymous Direct Access Blocked (PostgREST Revocation)
  // -------------------------------------------------------------
  totalTests++;
  console.info('\n[Test 2] Testing anonymous access lockout on public tables...');
  let anonBlocked = false;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE anon;`);
      await tx.$executeRawUnsafe(`SELECT set_config('request.jwt.claims', '{}', true);`);
      await tx.$queryRawUnsafe(`SELECT * FROM public.colleges LIMIT 1;`);
    });
  } catch (err: unknown) {
    const msg = (err as Error)?.message || String(err);
    if (
      msg.toLowerCase().includes('permission denied') ||
      (err as Record<string, unknown>)?.code === 'P2010'
    ) {
      anonBlocked = true;
    } else {
      console.warn('Caught other error in Test 2:', msg);
    }
  }

  if (anonBlocked) {
    console.info('  ✓ PASS: Anonymous role direct query rejected with permission denied.');
    passedTests++;
  } else {
    console.error('  ✗ FAIL: Anonymous role was able to query public.colleges!');
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Test 3: Authenticated Direct Access Blocked by Default
  // -------------------------------------------------------------
  totalTests++;
  console.info('\n[Test 3] Testing authenticated direct table grants lockout...');
  let authDirectBlocked = false;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);
      await tx.$executeRawUnsafe(
        `SELECT set_config('request.jwt.claims', '{"sub": "${studentProfile.id}", "role": "authenticated"}', true);`,
      );
      await tx.$queryRawUnsafe(`SELECT * FROM public.user_profiles LIMIT 1;`);
    });
  } catch (err: unknown) {
    const msg = (err as Error)?.message || String(err);
    if (
      msg.toLowerCase().includes('permission denied') ||
      (err as Record<string, unknown>)?.code === 'P2010'
    ) {
      authDirectBlocked = true;
    } else {
      console.warn('Caught other error in Test 3:', msg);
    }
  }

  if (authDirectBlocked) {
    console.info('  ✓ PASS: Direct authenticated query rejected with permission denied.');
    passedTests++;
  } else {
    console.error('  ✗ FAIL: Authenticated role had direct table access without API mediation!');
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Test 4: RLS Policy Evaluation - Student Tenant & Self Isolation
  // -------------------------------------------------------------
  totalTests++;
  console.info('\n[Test 4] Testing RLS Layer: Student Isolation & Escalation Prevention...');
  let studentIsolationPassed = false;
  try {
    await prisma.$transaction(async (tx) => {
      // Temporarily grant select and update within transaction to verify RLS policy layer
      await tx.$executeRawUnsafe(
        `GRANT SELECT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;`,
      );
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);
      await tx.$executeRawUnsafe(
        `SELECT set_config('request.jwt.claims', '{"sub": "${studentProfile.id}", "role": "authenticated"}', true);`,
      );

      // 4a: Student can only see own profile
      const visibleProfiles = (await tx.$queryRawUnsafe(
        `SELECT id, email, role FROM public.user_profiles;`,
      )) as Array<{ id: string; email: string; role: string }>;

      const seesOtherUsers = visibleProfiles.some((p) => p.id !== studentProfile.id);

      // 4b: Student cannot escalate role via direct UPDATE (self update policy is dropped)
      const updateResult = (await tx.$queryRawUnsafe(`
        UPDATE public.user_profiles 
        SET role = 'SUPER_ADMIN' 
        WHERE id = '${studentProfile.id}'::uuid
        RETURNING id, role;
      `)) as Array<unknown>;

      const updateBlocked = !updateResult || updateResult.length === 0;

      if (!seesOtherUsers && updateBlocked && visibleProfiles.length === 1) {
        studentIsolationPassed = true;
      }

      // Rollback temporary grant
      throw new Error('ROLLBACK_INTENTIONAL');
    });
  } catch (err: unknown) {
    if (String(err).includes('ROLLBACK_INTENTIONAL')) {
      // Expected
    } else {
      console.error('Unexpected error in Test 4:', err);
    }
  }

  if (studentIsolationPassed) {
    console.info('  ✓ PASS: Student sees only own profile (1 row) and cannot update role.');
    passedTests++;
  } else {
    console.error('  ✗ FAIL: Student isolation or privilege escalation check failed.');
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Test 5: RLS Policy Evaluation - College Admin Tenant Isolation
  // -------------------------------------------------------------
  totalTests++;
  console.info('\n[Test 5] Testing RLS Layer: College Admin Tenant Isolation...');
  let adminIsolationPassed = false;
  try {
    await prisma.$transaction(async (tx) => {
      // Temporarily grant select within transaction to verify RLS policy layer
      await tx.$executeRawUnsafe(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;`);
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);
      await tx.$executeRawUnsafe(
        `SELECT set_config('request.jwt.claims', '{"sub": "${adminProfile.id}", "role": "authenticated"}', true);`,
      );

      const visibleColleges = (await tx.$queryRawUnsafe(
        `SELECT id, name FROM public.colleges;`,
      )) as Array<{ id: string; name: string }>;

      const seesOnlyOwnCollege =
        visibleColleges.length === 1 && visibleColleges[0].id === DEMO_COLLEGE_ID;

      if (seesOnlyOwnCollege) {
        adminIsolationPassed = true;
      }

      // Rollback temporary grant
      throw new Error('ROLLBACK_INTENTIONAL');
    });
  } catch (err: unknown) {
    if (String(err).includes('ROLLBACK_INTENTIONAL')) {
      // Expected
    } else {
      console.error('Unexpected error in Test 5:', err);
    }
  }

  if (adminIsolationPassed) {
    console.info('  ✓ PASS: College Admin can only read their own college.');
    passedTests++;
  } else {
    console.error('  ✗ FAIL: College Admin isolation failed.');
    process.exit(1);
  }

  console.info(
    `\n=== All ${passedTests}/${totalTests} RLS & Security Tests PASSED Successfully ===`,
  );
}

testRls()
  .catch((e) => {
    console.error('Fatal in testRls:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
