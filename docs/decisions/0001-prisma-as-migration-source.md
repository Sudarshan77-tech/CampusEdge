# ADR 0001: Prisma Migrate as the Sole Database Migration Authority

## Status

Accepted

## Context

CampusEdge requires a multi-tenant PostgreSQL database hosted on Supabase with strict Row Level Security (RLS) policies, foreign key cascades, triggers, and type safety across our NestJS backend and shared libraries.
In database management with Supabase, there are multiple options:

1. Supabase CLI migrations (`supabase db diff` / `supabase migration new`).
2. Dashboard SQL Editor.
3. Prisma Migrate with custom migration SQL.

## Decision

We establish **Prisma Migrate as the single source of truth** for schema definitions and database evolutions.

- Database changes are drafted in `packages/database/prisma/schema.prisma`.
- Migration SQL files are generated via `prisma migrate dev --create-only`.
- Custom PostgreSQL capabilities not natively expressed in Prisma DSL (such as `ENABLE ROW LEVEL SECURITY`, custom RLS policies, PostgreSQL helper functions, and triggers) are authored directly in the generated `migration.sql` file.
- Migrations are applied using `prisma migrate dev` (locally) and `prisma migrate deploy` (remotely).

## Consequences

### Positive

- Strict version control of both ORM models and custom RLS policies in a single atomic migration script.
- Type definitions generated automatically and synchronized with database state (`prisma generate`).
- Zero reliance on manual dashboard SQL clicks, eliminating environment drift.
- Full CI validation using clean PostgreSQL test containers.

### Negative

- Developers must not edit migrations after application.
- Requires `--create-only` workflow when adding RLS policies to new tables.
