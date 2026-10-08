import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TableRlsStatus {
  tablename: string;
  rowsecurity: boolean;
}

interface TableGrant {
  table_name: string;
  grantee: string;
  privilege_type: string;
}

async function verifyRls() {
  console.info('--- Auditing Row Level Security & Table Grants ---');

  // 1. Audit RLS enabled on all public tables
  const tables = await prisma.$queryRaw<TableRlsStatus[]>`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations'
    ORDER BY tablename ASC;
  `;

  if (!tables || tables.length === 0) {
    console.warn('[RLS Check] Warning: No public tables found in database.');
    return;
  }

  const unshieldedTables: string[] = [];
  for (const table of tables) {
    if (table.rowsecurity) {
      console.info(`[RLS Shielded]  ✓ public.${table.tablename}`);
    } else {
      console.error(`[RLS UNPROTECTED] ✗ public.${table.tablename} lacks Row Level Security!`);
      unshieldedTables.push(table.tablename);
    }
  }

  // 2. Audit that anon and authenticated roles have NO table grants on public tables
  const directGrants = await prisma.$queryRaw<TableGrant[]>`
    SELECT table_name, grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name != '_prisma_migrations'
      AND grantee IN ('anon', 'authenticated')
    ORDER BY table_name, grantee;
  `;

  if (directGrants && directGrants.length > 0) {
    console.error(
      `\nCRITICAL SECURITY VIOLATION: ${directGrants.length} direct grant(s) exist on public tables for anon/authenticated roles:`,
    );
    for (const g of directGrants) {
      console.error(`  - ${g.grantee} has ${g.privilege_type} on ${g.table_name}`);
    }
    process.exit(1);
  } else {
    console.info(
      '[Direct Grants Check] ✓ PostgREST Data API access completely revoked from anon & authenticated.',
    );
  }

  if (unshieldedTables.length > 0) {
    console.error(
      `\nCRITICAL SECURITY VIOLATION: ${unshieldedTables.length} table(s) lack Row Level Security:`,
      unshieldedTables.join(', '),
    );
    process.exit(1);
  }

  console.info(
    `\nAll ${tables.length} public table(s) have RLS active and zero direct grants for anon/authenticated. Audit PASSED.`,
  );
}

verifyRls()
  .catch((e) => {
    console.error('RLS audit failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
