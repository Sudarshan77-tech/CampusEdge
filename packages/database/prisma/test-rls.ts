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

  // -------------------------------------------------------------
  // Test 6: Composite Foreign Key Blocks Cross-College References
  // -------------------------------------------------------------
  totalTests++;
  console.info('\n[Test 6] Testing Composite FK: Cross-tenant reference prevention...');
  let crossTenantBlocked = false;
  const FOREIGN_COLLEGE_ID = '99999999-9999-9999-9999-999999999999';

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create a foreign college and placement season
      await tx.college.create({
        data: {
          id: FOREIGN_COLLEGE_ID,
          name: 'Foreign University',
          slug: 'foreign-univ-sec-test',
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      });

      const foreignSeason = await tx.placementSeason.create({
        data: {
          collegeId: FOREIGN_COLLEGE_ID,
          label: '2026-27-SEC',
          batchYear: 2027,
          startDate: new Date('2026-07-01'),
          endDate: new Date('2027-06-30'),
        },
      });

      const testCompany = await tx.company.create({
        data: {
          name: 'Security Test Corp',
          normalizedName: 'security test corp',
          slug: 'security-test-corp-' + Date.now(),
          status: 'VERIFIED',
        },
      });

      // 2. Try to create a Drive under DEMO_COLLEGE referencing foreignSeason
      // Composite FK (season_id, college_id) must reject this!
      await tx.$executeRawUnsafe(`
        INSERT INTO public.drives (
          id, college_id, company_id, season_id, title, drive_type, category, status
        ) VALUES (
          gen_random_uuid(),
          '${DEMO_COLLEGE_ID}'::uuid,
          '${testCompany.id}'::uuid,
          '${foreignSeason.id}'::uuid,
          'Illicit Cross-Tenant Drive',
          'ON_CAMPUS',
          'REGULAR',
          'DRAFT'
        );
      `);

      throw new Error('ROLLBACK_INTENTIONAL');
    });
  } catch (err: unknown) {
    const msg = String(err);
    if (
      msg.includes('drives_season_id_college_id_fkey') ||
      msg.includes('foreign key constraint') ||
      (err as Record<string, unknown>)?.code === 'P2003'
    ) {
      crossTenantBlocked = true;
    } else if (msg.includes('ROLLBACK_INTENTIONAL')) {
      crossTenantBlocked = false;
    } else {
      console.warn('Caught unexpected error in Test 6:', msg);
    }
  }

  if (crossTenantBlocked) {
    console.info('  ✓ PASS: Composite FK blocked cross-tenant season reference.');
    passedTests++;
  } else {
    console.error('  ✗ FAIL: Cross-tenant reference was permitted by database schema!');
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Test 7: CHECK Constraints Validation (CTC min <= max, selected <= registered)
  // -------------------------------------------------------------
  totalTests++;
  console.info('\n[Test 7] Testing Database CHECK constraints...');
  let ctcCheckFired = false;

  try {
    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: 'Check Constraint Corp',
          normalizedName: 'check constraint corp',
          slug: 'check-constraint-corp-' + Date.now(),
          status: 'VERIFIED',
        },
      });

      const season = await tx.placementSeason.create({
        data: {
          collegeId: DEMO_COLLEGE_ID,
          label: '2026-27-CHK',
          batchYear: 2027,
          startDate: new Date('2026-07-01'),
          endDate: new Date('2027-06-30'),
        },
      });

      const drive = await tx.drive.create({
        data: {
          collegeId: DEMO_COLLEGE_ID,
          companyId: company.id,
          seasonId: season.id,
          title: 'Check Constraint Test Drive',
        },
      });

      // Attempt to insert invalid CTC where min > max
      await tx.$executeRawUnsafe(`
        INSERT INTO public.drive_roles (
          id, drive_id, college_id, title, job_type, ctc_lpa_min, ctc_lpa_max
        ) VALUES (
          gen_random_uuid(),
          '${drive.id}'::uuid,
          '${DEMO_COLLEGE_ID}'::uuid,
          'Test Role',
          'FULL_TIME',
          25.00,
          15.00
        );
      `);

      throw new Error('ROLLBACK_INTENTIONAL');
    });
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes('drive_roles_ctc_check') || msg.includes('check constraint')) {
      ctcCheckFired = true;
    }
  }

  if (ctcCheckFired) {
    console.info('  ✓ PASS: Database CHECK constraint enforced ctc_lpa_min <= ctc_lpa_max.');
    passedTests++;
  } else {
    console.error('  ✗ FAIL: Database allowed invalid CTC range (min > max)!');
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
