# 06 - Git Workflows & Environment Configurations

## 1. Environment Variable Segregation

Environment variables are strictly divided between packages and layers:

### `apps/web/.env.local` (Client & Next.js Server)

- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase API project endpoint.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Public anonymous/publishable Supabase client key.
- `NEXT_PUBLIC_API_URL`: NestJS backend base URL (e.g. `http://localhost:4000`).
- **NEVER** place service role keys, DB passwords, or AI keys in any variable prefixed with `NEXT_PUBLIC_`.

### `apps/api/.env` & `apps/api/.env.local` (Backend NestJS)

- `DATABASE_URL`: Transaction pooler connection string (port 6543) for runtime application pooling.
- `DIRECT_URL`: Session pooler / direct connection string (port 5432) for Prisma migrations.
- `SUPABASE_URL`: Supabase project URL for JWKS endpoint validation.
- `SUPABASE_SECRET_KEY`: Service role secret key (never exposed to client).
- `SUPABASE_JWT_SECRET`: Signing secret (if using HS256 legacy verification).
- `WEB_ORIGIN`: Allowed CORS origin for the frontend (e.g. `http://localhost:3000`).
- `PORT`: API server port (default 4000).
- `GEMINI_API_KEY`: Google Gemini API credentials.
- `GEMINI_MODEL`: Model identifier (e.g., `gemini-2.0-flash`).
- `REDIS_URL`: Redis connection URL for worker queues.

## 2. Git Hygiene & Secret Protection

- **Rule**: NEVER commit, log, or stage `.env`, `.env.local`, or any actual secret credential.
- Only `.env.example` templates with empty placeholders are committed to version control.
- Git hooks (`husky` + `lint-staged`) run automatically on pre-commit.
- Branch naming convention:
  - `feat/<short-name>`
  - `fix/<short-name>`
  - `chore/<short-name>`
  - `docs/<short-name>`
