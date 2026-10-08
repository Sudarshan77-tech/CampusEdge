-- =============================================================================
-- Migration: 20261009010000_phase1_security_and_schema
-- CampusEdge Phase 1 Hardening, Schema Expansion & PostgREST Revocation
-- =============================================================================

-- 1. Create New Enums
CREATE TYPE "public"."user_status_enum" AS ENUM ('ONBOARDING', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');
CREATE TYPE "public"."degree_enum" AS ENUM ('BTECH', 'MTECH', 'MCA', 'MBA', 'OTHER');
CREATE TYPE "public"."skill_category_enum" AS ENUM ('LANGUAGE', 'FRAMEWORK', 'DATABASE', 'CS_FUNDAMENTAL', 'TOOL');
CREATE TYPE "public"."proficiency_enum" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE "public"."invitation_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE "public"."consent_type_enum" AS ENUM ('TERMS', 'PRIVACY', 'DATA_PROCESSING');
CREATE TYPE "public"."data_request_type_enum" AS ENUM ('EXPORT', 'DELETE');
CREATE TYPE "public"."data_request_status_enum" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'REJECTED');

-- 2. Alter Existing Tables
ALTER TABLE "public"."audit_logs"
    ADD COLUMN "ip_address" VARCHAR(45),
    ADD COLUMN "request_id" VARCHAR(100);

ALTER TABLE "public"."colleges"
    ADD COLUMN "contact_email" VARCHAR(255),
    ADD COLUMN "email_domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "require_student_approval" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."user_profiles"
    ADD COLUMN "status" "public"."user_status_enum" NOT NULL DEFAULT 'ONBOARDING';

-- 3. Create New Tables
CREATE TABLE "public"."branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "role" "public"."role_enum" NOT NULL DEFAULT 'COLLEGE_ADMIN',
    "college_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "status" "public"."invitation_status_enum" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."student_profiles" (
    "user_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "degree" "public"."degree_enum" NOT NULL DEFAULT 'BTECH',
    "batch_year" INTEGER NOT NULL,
    "cgpa" DECIMAL(4,2) NOT NULL,
    "active_backlogs" INTEGER NOT NULL DEFAULT 0,
    "enrollment_number" VARCHAR(50),
    "target_role" VARCHAR(100),
    "onboarding_completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "public"."skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "category" "public"."skill_category_enum" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."student_skills" (
    "student_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "proficiency" "public"."proficiency_enum" NOT NULL DEFAULT 'BEGINNER',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_skills_pkey" PRIMARY KEY ("student_id","skill_id")
);

CREATE TABLE "public"."consent_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "consent_type" "public"."consent_type_enum" NOT NULL,
    "policy_version" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."data_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "public"."data_request_type_enum" NOT NULL,
    "status" "public"."data_request_status_enum" NOT NULL DEFAULT 'OPEN',
    "handled_by" UUID,
    "handled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id")
);

-- 4. Indexes & Constraints
CREATE INDEX "branches_college_id_idx" ON "public"."branches"("college_id");
CREATE UNIQUE INDEX "branches_college_id_code_key" ON "public"."branches"("college_id", "code");
CREATE UNIQUE INDEX "branches_id_college_id_key" ON "public"."branches"("id", "college_id");

CREATE INDEX "invitations_college_id_idx" ON "public"."invitations"("college_id");
CREATE INDEX "invitations_email_idx" ON "public"."invitations"("email");
CREATE UNIQUE INDEX "invitations_pending_email_unique" ON "public"."invitations" (lower(email)) WHERE status = 'PENDING';

CREATE INDEX "student_profiles_college_id_idx" ON "public"."student_profiles"("college_id");
CREATE INDEX "student_profiles_branch_id_idx" ON "public"."student_profiles"("branch_id");
CREATE UNIQUE INDEX "student_profiles_college_id_enrollment_number_key" ON "public"."student_profiles"("college_id", "enrollment_number");
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_cgpa_check" CHECK (cgpa >= 0.00 AND cgpa <= 10.00);
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_active_backlogs_check" CHECK (active_backlogs >= 0);
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_batch_year_check" CHECK (batch_year >= 2000 AND batch_year <= 2100);

CREATE UNIQUE INDEX "skills_name_key" ON "public"."skills"("name");

CREATE INDEX "student_skills_college_id_idx" ON "public"."student_skills"("college_id");
CREATE INDEX "student_skills_skill_id_idx" ON "public"."student_skills"("skill_id");

CREATE INDEX "consent_records_user_id_idx" ON "public"."consent_records"("user_id");
CREATE INDEX "data_requests_user_id_idx" ON "public"."data_requests"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_lower_email_idx" ON "public"."user_profiles" (lower(email));

-- Foreign Keys
ALTER TABLE "public"."branches" ADD CONSTRAINT "branches_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_branch_id_college_id_fkey" FOREIGN KEY ("branch_id", "college_id") REFERENCES "public"."branches"("id", "college_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."student_skills" ADD CONSTRAINT "student_skills_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."student_skills" ADD CONSTRAINT "student_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."student_skills" ADD CONSTRAINT "student_skills_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."data_requests" ADD CONSTRAINT "data_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Updated_At Triggers for New Mutable Tables
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON "public"."branches" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON "public"."student_profiles" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON "public"."skills" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_requests_updated_at BEFORE UPDATE ON "public"."data_requests" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Hardening Helper Functions (SECURITY DEFINER with search_path = '')
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text AS $$
    SELECT coalesce(
        auth.jwt() -> 'app_metadata' ->> 'role',
        (SELECT role::text FROM public.user_profiles WHERE id = auth.uid()),
        ''
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.auth_college_id()
RETURNS uuid AS $$
    SELECT coalesce(
        (auth.jwt() -> 'app_metadata' ->> 'college_id')::uuid,
        (SELECT college_id FROM public.user_profiles WHERE id = auth.uid()),
        NULL
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 7. Block Direct User Profile Updates for Authenticated Users (Must go via backend)
DROP POLICY IF EXISTS "user_profiles_self_update" ON "public"."user_profiles";

-- 8. Append-Only Trigger for Immutable Records (audit_logs & consent_records)
CREATE OR REPLACE FUNCTION public.prevent_record_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Table % records are append-only and cannot be updated or deleted', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS audit_logs_immutable_trigger ON "public"."audit_logs";
CREATE TRIGGER audit_logs_immutable_trigger
BEFORE UPDATE OR DELETE ON "public"."audit_logs"
FOR EACH ROW EXECUTE FUNCTION public.prevent_record_mutation();

DROP TRIGGER IF EXISTS consent_records_immutable_trigger ON "public"."consent_records";
CREATE TRIGGER consent_records_immutable_trigger
BEFORE UPDATE OR DELETE ON "public"."consent_records"
FOR EACH ROW EXECUTE FUNCTION public.prevent_record_mutation();

-- 9. Hardened Signup Trigger (ignoring raw_user_meta_data for roles/colleges, defaulting to STUDENT/ONBOARDING)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role, status, college_id)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Student User'),
        'STUDENT'::public.role_enum,
        'ONBOARDING'::public.user_status_enum,
        NULL
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 10. Clean Orphan Profiles (Profiles with no corresponding auth.users)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DELETE FROM public.user_profiles up
        WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = up.id);
    END IF;
END $$;

-- 11. Enable Row Level Security (RLS) on All New Tables
ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."consent_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."data_requests" ENABLE ROW LEVEL SECURITY;

-- Branches Policies
CREATE POLICY "branches_college_read" ON "public"."branches"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "branches_super_admin_manage" ON "public"."branches"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Invitations Policies
CREATE POLICY "invitations_college_read" ON "public"."invitations"
FOR SELECT USING (
    (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "invitations_super_admin_manage" ON "public"."invitations"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Student Profiles Policies
CREATE POLICY "student_profiles_self_read" ON "public"."student_profiles"
FOR SELECT USING (
    user_id = auth.uid()
    OR (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "student_profiles_super_admin_manage" ON "public"."student_profiles"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Skills Catalog Policies (Global read for authenticated)
CREATE POLICY "skills_authenticated_read" ON "public"."skills"
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "skills_super_admin_manage" ON "public"."skills"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Student Skills Policies
CREATE POLICY "student_skills_read" ON "public"."student_skills"
FOR SELECT USING (
    student_id = auth.uid()
    OR (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "student_skills_super_admin_manage" ON "public"."student_skills"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Consent Records Policies
CREATE POLICY "consent_records_self_read" ON "public"."consent_records"
FOR SELECT USING (
    user_id = auth.uid()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "consent_records_insert" ON "public"."consent_records"
FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

-- Data Requests Policies
CREATE POLICY "data_requests_self_read" ON "public"."data_requests"
FOR SELECT USING (
    user_id = auth.uid()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "data_requests_insert" ON "public"."data_requests"
FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "data_requests_super_admin_manage" ON "public"."data_requests"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- 12. REVOKE ALL on All Public Schema Objects from anon and authenticated
-- Force all API access through NestJS service connection
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;
