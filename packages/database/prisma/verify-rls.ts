import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TableRlsStatus {
  tablename: string;
  rowsecurity: boolean;
}

async function verifyRls() {
  console.log('--- Verifying PostgreSQL Row Level Security (RLS) ---');

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
      console.log(`[RLS Shielded]  ✓ public.${table.tablename}`);
    } else {
      console.error(`[RLS UNPROTECTED] ✗ public.${table.tablename} lacks Row Level Security!`);
      unshieldedTables.push(table.tablename);
    }
  }

  if (unshieldedTables.length > 0) {
    console.error(
      `\nCRITICAL SECURITY VIOLATION: ${unshieldedTables.length} table(s) lack Row Level Security:`,
      unshieldedTables.join(', '),
    );
    process.exit(1);
  }

  console.log(
    `\nAll ${tables.length} public table(s) have Row Level Security enabled. RLS audit PASSED.`,
  );
}

verifyRls()
  .catch((e) => {
    console.error('RLS verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
