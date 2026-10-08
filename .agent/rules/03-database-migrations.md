# 03 - Database Migrations & Prisma Guidelines

## 1. Single Source of Truth

- **Prisma Migrate is the sole authority for database schema evolutions.**
- NEVER edit database tables, columns, or types manually or through the Supabase Dashboard UI.
- All schema alterations must be reproducible, versioned migration files in `packages/database/prisma/migrations/`.

## 2. Migration Authoring Workflow

1. Modify `packages/database/prisma/schema.prisma`.
2. Generate migration SQL file without immediate execution:
   ```bash
   pnpm --filter @campusedge/database exec prisma migrate dev --create-only --name <descriptive_name>
   ```
3. Open the newly generated `migration.sql` file in `prisma/migrations/<timestamp>_<name>/`.
4. Append manual SQL statements for:
   - Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
   - RLS policies (`CREATE POLICY ...`).
   - Triggers (e.g. `updated_at` automatic timestamps or auth-user synchronizers).
5. Review the full SQL script carefully.
6. Apply locally:
   ```bash
   pnpm db:migrate:dev
   ```
7. Verify RLS coverage:
   ```bash
   pnpm db:verify-rls
   ```
8. Commit the schema changes and migration folder together.

## 3. Strict Rules

- **Connection Strings**: Always use `DIRECT_URL` (direct port 5432 or session pooler) for running migrations, and `DATABASE_URL` (transaction pooler) for runtime query execution.
- **Immutable History**: NEVER edit an already applied or committed migration file. If a change is needed, author a new migration.
- **Naming & Conventions**:
  - Prisma Models: `PascalCase` (e.g., `UserProfile`, `PlacementDrive`).
  - Database Tables: `snake_case` via `@@map("table_names")`.
  - Column Names: `snake_case` in DB via `@map("column_name")`.
  - Primary Keys: Always `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`.
  - Timestamps: Always `createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)` and `updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)`.
- **Tenant Tables**: Must enable RLS and add tenant isolation policies in the exact same migration where table is created.
