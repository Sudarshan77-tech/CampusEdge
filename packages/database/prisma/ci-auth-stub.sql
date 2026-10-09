-- Minimal Supabase auth schema stub for CI and integration tests on plain PostgreSQL
CREATE SCHEMA IF NOT EXISTS auth;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Roles required for Supabase RLS and PostgREST permissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END $$;

-- Minimal auth.users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- auth.uid() function returning user UUID from JWT claims
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
    SELECT coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
    );
$$ LANGUAGE sql STABLE;

-- auth.jwt() function returning raw claims JSON
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS JSONB AS $$
    SELECT coalesce(
        nullif(current_setting('request.jwt.claims', true), '')::jsonb,
        '{}'::jsonb
    );
$$ LANGUAGE sql STABLE;

-- auth.role() function returning current request role
CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT AS $$
    SELECT coalesce(
        current_setting('request.jwt.claim.role', true),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
        'anon'
    );
$$ LANGUAGE sql STABLE;
