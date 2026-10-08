import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function applyCiStub() {
  const prisma = new PrismaClient();
  const sql = fs.readFileSync(path.join(__dirname, 'ci-auth-stub.sql'), 'utf-8');
  console.info('Applying minimal CI auth stub to database...');
  await prisma.$executeRawUnsafe(sql);
  console.info('✓ CI auth stub applied successfully.');
  await prisma.$disconnect();
}

applyCiStub().catch((err) => {
  console.error('Failed to apply CI stub:', err);
  process.exit(1);
});
