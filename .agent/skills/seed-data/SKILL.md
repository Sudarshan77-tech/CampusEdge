---
name: seed-data
description: Instructions and patterns for writing idempotent, reproducible database seed scripts using Prisma upsert.
---

# Idempotent Database Seed Strategy

## When to Use

Use when updating `packages/database/prisma/seed.ts` to provision development colleges, initial administrative accounts, question categories, or test fixtures.

## Principles of Idempotent Seeding

1. **Never use raw `create`**: Running the seed script multiple times must NOT produce duplicate keys, primary key conflicts, or duplicate records.
2. **Always use `upsert` with deterministic identifiers**: Use known fixed UUIDs or unique business keys (e.g., `slug`, `email`).
3. **Handle Foreign Keys in Topological Order**: Seed parent entities (`colleges`) before child records (`user_profiles`, `audit_logs`).

## Seed Template (`packages/database/prisma/seed.ts`)

```typescript
import { PrismaClient, Role, CollegeStatus } from '@campusedge/database';

const prisma = new PrismaClient();

// Deterministic UUIDs for development
const DEMO_COLLEGE_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_ADMIN_ID = '00000000-0000-0000-0000-000000000002';

async function main() {
  console.log('Seeding initial database fixtures...');

  // 1. Seed Demo College
  const college = await prisma.college.upsert({
    where: { id: DEMO_COLLEGE_ID },
    update: {
      name: 'Apex Institute of Technology',
      slug: 'apex-tech',
      status: CollegeStatus.ACTIVE,
    },
    create: {
      id: DEMO_COLLEGE_ID,
      name: 'Apex Institute of Technology',
      slug: 'apex-tech',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: CollegeStatus.ACTIVE,
    },
  });

  // 2. Seed Placement Admin Profile
  await prisma.userProfile.upsert({
    where: { id: DEMO_ADMIN_ID },
    update: {
      fullName: 'Placement Cell Officer',
      collegeId: college.id,
      role: Role.COLLEGE_ADMIN,
    },
    create: {
      id: DEMO_ADMIN_ID,
      email: 'tpo@apextech.edu',
      fullName: 'Placement Cell Officer',
      collegeId: college.id,
      role: Role.COLLEGE_ADMIN,
    },
  });

  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```
