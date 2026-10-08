import { PrismaClient, Role, UserStatus } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function createSuperAdmin() {
  console.info('=== CampusEdge Super Admin Bootstrap CLI ===');

  const args = process.argv.slice(2);
  let email = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1].trim().toLowerCase();
      break;
    }
  }

  if (!email || !email.includes('@')) {
    console.error('Usage: pnpm admin:create-super-admin --email <valid-email>');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';
  const allowedRefs = (process.env.ALLOWED_REMOTE_PROJECT_REFS || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  if (!supabaseUrl || !secretKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be configured.');
    process.exit(1);
  }

  const projectRefMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  const currentRef = projectRefMatch ? projectRefMatch[1] : '';

  console.info(`[Safety Check] Target Supabase Project Ref: "${currentRef}"`);
  if (!currentRef || !allowedRefs.includes(currentRef)) {
    console.error(`[Refusal] Project ref "${currentRef}" is not in allowlist. Aborting.`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const prisma = new PrismaClient();

  try {
    // 1. Check if user already exists in auth
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    let authUserId: string;

    if (existingUser) {
      authUserId = existingUser.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
        email_confirm: true,
        app_metadata: { role: Role.SUPER_ADMIN, college_id: null },
      });
      if (updateError) throw updateError;
      console.info(`[Auth User Updated] Existing account ${email} upgraded to SUPER_ADMIN.`);
    } else {
      // Invite user via Supabase admin invite
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: { full_name: 'Super Admin' },
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      );
      if (inviteError || !inviteData.user) {
        // Fallback: create confirmed user if email sending is disabled
        console.warn('Invite email error, falling back to direct creation:', inviteError?.message);
        const demoPassword = process.env.SEED_DEMO_PASSWORD || 'SuperAdmin@Secure123!';
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: demoPassword,
          email_confirm: true,
          user_metadata: { full_name: 'Super Admin' },
          app_metadata: { role: Role.SUPER_ADMIN, college_id: null },
        });
        if (createError || !created.user) throw createError;
        authUserId = created.user.id;
      } else {
        authUserId = inviteData.user.id;
      }
      console.info(`[Auth User Created/Invited] User ID: ${authUserId}`);
    }

    // 2. Transactionally upsert UserProfile with SUPER_ADMIN role
    const profile = await prisma.userProfile.upsert({
      where: { id: authUserId },
      update: {
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        collegeId: null,
      },
      create: {
        id: authUserId,
        email,
        fullName: 'CampusEdge Super Admin',
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        collegeId: null,
      },
    });

    console.info(
      `✓ Successfully provisioned SUPER_ADMIN profile for ${profile.email} (${profile.id})`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin().catch((err) => {
  console.error('Fatal error in createSuperAdmin:', err);
  process.exit(1);
});
