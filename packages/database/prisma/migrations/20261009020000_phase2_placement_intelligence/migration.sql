-- =============================================================================
-- Migration: 20261009020000_phase2_placement_intelligence
-- CampusEdge Phase 2 Placement Cell Cockpit, Intelligence, RLS & Composite FKs
-- =============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. New Enums
CREATE TYPE "public"."company_status_enum" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'MERGED');
CREATE TYPE "public"."topic_category_enum" AS ENUM ('APTITUDE', 'VERBAL', 'LOGICAL', 'DSA', 'PROGRAMMING', 'DBMS', 'SQL', 'OS', 'NETWORKS', 'OOP', 'SOFTWARE_ENGINEERING', 'SYSTEM_DESIGN', 'HR', 'OTHER');
CREATE TYPE "public"."drive_type_enum" AS ENUM ('ON_CAMPUS', 'OFF_CAMPUS', 'POOL', 'VIRTUAL');
CREATE TYPE "public"."drive_category_enum" AS ENUM ('MASS_RECRUITER', 'REGULAR', 'DREAM', 'SUPER_DREAM');
CREATE TYPE "public"."drive_status_enum" AS ENUM ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "public"."job_type_enum" AS ENUM ('FULL_TIME', 'INTERNSHIP', 'INTERN_PLUS_PPO');
CREATE TYPE "public"."round_type_enum" AS ENUM ('APTITUDE', 'TECHNICAL_MCQ', 'CODING', 'GROUP_DISCUSSION', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'MANAGERIAL', 'CASE_STUDY', 'OTHER');
CREATE TYPE "public"."round_mode_enum" AS ENUM ('ONLINE', 'OFFLINE');
CREATE TYPE "public"."application_status_enum" AS ENUM ('REGISTERED', 'WITHDRAWN', 'SHORTLISTED', 'SELECTED', 'REJECTED');
CREATE TYPE "public"."notice_audience_enum" AS ENUM ('ALL', 'BY_BRANCH', 'BY_BATCH_YEAR');
CREATE TYPE "public"."notice_status_enum" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "public"."experience_outcome_enum" AS ENUM ('SELECTED', 'NOT_SELECTED', 'NOT_DISCLOSED');
CREATE TYPE "public"."experience_status_enum" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'REMOVED');
CREATE TYPE "public"."import_job_type_enum" AS ENUM ('HISTORICAL_DRIVES', 'APPLICATION_RESULTS');
CREATE TYPE "public"."import_job_status_enum" AS ENUM ('UPLOADED', 'VALIDATED', 'FAILED', 'COMMITTING', 'COMPLETED');

ALTER TYPE "public"."consent_type_enum" ADD VALUE IF NOT EXISTS 'PLACEMENT_SHARING';

-- 3. Alter Existing Tables
ALTER TABLE "public"."colleges"
    ADD COLUMN IF NOT EXISTS "enforce_one_offer_policy" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."consent_records"
    ADD COLUMN IF NOT EXISTS "drive_id" UUID;

ALTER TABLE "public"."student_profiles"
    ADD CONSTRAINT "student_profiles_user_id_college_id_key" UNIQUE ("user_id", "college_id");

-- 4. Create New Global Tables
CREATE TABLE "public"."companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "normalized_name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "website" VARCHAR(255),
    "industry" VARCHAR(100),
    "logo_url" VARCHAR(500),
    "status" "public"."company_status_enum" NOT NULL DEFAULT 'PENDING_REVIEW',
    "merged_into_id" UUID,
    "created_by_college_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "companies_normalized_name_key" UNIQUE ("normalized_name"),
    CONSTRAINT "companies_slug_key" UNIQUE ("slug"),
    CONSTRAINT "companies_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "public"."topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "category" "public"."topic_category_enum" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "topics_name_key" UNIQUE ("name"),
    CONSTRAINT "topics_slug_key" UNIQUE ("slug")
);

-- 5. Create New Tenant-Scoped Tables
CREATE TABLE "public"."placement_seasons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "batch_year" INTEGER NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_seasons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "placement_seasons_college_id_label_key" UNIQUE ("college_id", "label"),
    CONSTRAINT "placement_seasons_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "placement_seasons_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."drives" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "drive_type" "public"."drive_type_enum" NOT NULL DEFAULT 'ON_CAMPUS',
    "category" "public"."drive_category_enum" NOT NULL DEFAULT 'REGULAR',
    "status" "public"."drive_status_enum" NOT NULL DEFAULT 'DRAFT',
    "is_historical" BOOLEAN NOT NULL DEFAULT false,
    "visit_date" TIMESTAMPTZ(6),
    "registration_opens_at" TIMESTAMPTZ(6),
    "registration_deadline" TIMESTAMPTZ(6),
    "venue" VARCHAR(255),
    "registered_count" INTEGER,
    "shortlisted_count" INTEGER,
    "selected_count" INTEGER,
    "created_by" UUID,
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drives_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "drives_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "drives_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "drives_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "drives_season_id_college_id_fkey" FOREIGN KEY ("season_id", "college_id") REFERENCES "public"."placement_seasons"("id", "college_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "drives_selected_count_check" CHECK (selected_count IS NULL OR registered_count IS NULL OR selected_count <= registered_count)
);

CREATE TABLE "public"."drive_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drive_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "job_type" "public"."job_type_enum" NOT NULL DEFAULT 'FULL_TIME',
    "ctc_lpa_min" DECIMAL(6,2) NOT NULL,
    "ctc_lpa_max" DECIMAL(6,2) NOT NULL,
    "stipend_monthly" INTEGER,
    "location" VARCHAR(100),
    "openings" INTEGER,
    "bond_months" INTEGER,
    "description" TEXT,
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_roles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "drive_roles_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "drive_roles_drive_id_college_id_fkey" FOREIGN KEY ("drive_id", "college_id") REFERENCES "public"."drives"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_roles_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_roles_ctc_check" CHECK (ctc_lpa_min >= 0 AND ctc_lpa_min <= ctc_lpa_max),
    CONSTRAINT "drive_roles_stipend_check" CHECK (stipend_monthly IS NULL OR stipend_monthly >= 0)
);

CREATE TABLE "public"."drive_role_skills" (
    "drive_role_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_role_skills_pkey" PRIMARY KEY ("drive_role_id", "skill_id"),
    CONSTRAINT "drive_role_skills_drive_role_id_college_id_fkey" FOREIGN KEY ("drive_role_id", "college_id") REFERENCES "public"."drive_roles"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_role_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "public"."drive_eligibilities" (
    "drive_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "min_cgpa" DECIMAL(4,2),
    "max_active_backlogs" INTEGER,
    "allowed_degrees" "public"."degree_enum"[] DEFAULT ARRAY[]::"public"."degree_enum"[],
    "allowed_batch_years" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_eligibilities_pkey" PRIMARY KEY ("drive_id"),
    CONSTRAINT "drive_eligibilities_drive_id_college_id_key" UNIQUE ("drive_id", "college_id"),
    CONSTRAINT "drive_eligibilities_drive_id_college_id_fkey" FOREIGN KEY ("drive_id", "college_id") REFERENCES "public"."drives"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_eligibilities_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."drive_eligible_branches" (
    "drive_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_eligible_branches_pkey" PRIMARY KEY ("drive_id", "branch_id"),
    CONSTRAINT "drive_eligible_branches_drive_id_college_id_fkey" FOREIGN KEY ("drive_id", "college_id") REFERENCES "public"."drive_eligibilities"("drive_id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_eligible_branches_branch_id_college_id_fkey" FOREIGN KEY ("branch_id", "college_id") REFERENCES "public"."branches"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."drive_rounds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drive_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "round_type" "public"."round_type_enum" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "duration_minutes" INTEGER,
    "difficulty" INTEGER,
    "mode" "public"."round_mode_enum" NOT NULL DEFAULT 'ONLINE',
    "platform_note" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_rounds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "drive_rounds_drive_id_sequence_key" UNIQUE ("drive_id", "sequence"),
    CONSTRAINT "drive_rounds_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "drive_rounds_drive_id_college_id_fkey" FOREIGN KEY ("drive_id", "college_id") REFERENCES "public"."drives"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_rounds_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_rounds_difficulty_check" CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5))
);

CREATE TABLE "public"."drive_round_topics" (
    "round_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_round_topics_pkey" PRIMARY KEY ("round_id", "topic_id"),
    CONSTRAINT "drive_round_topics_round_id_college_id_fkey" FOREIGN KEY ("round_id", "college_id") REFERENCES "public"."drive_rounds"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_round_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "public"."drive_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drive_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "status" "public"."application_status_enum" NOT NULL DEFAULT 'REGISTERED',
    "offered_role_id" UUID,
    "offered_ctc_lpa" DECIMAL(6,2),
    "status_updated_by" UUID,
    "status_updated_at" TIMESTAMPTZ(6),
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_applications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "drive_applications_drive_id_student_id_key" UNIQUE ("drive_id", "student_id"),
    CONSTRAINT "drive_applications_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "drive_applications_drive_id_college_id_fkey" FOREIGN KEY ("drive_id", "college_id") REFERENCES "public"."drives"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_applications_student_id_college_id_fkey" FOREIGN KEY ("student_id", "college_id") REFERENCES "public"."student_profiles"("user_id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_applications_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "drive_applications_offered_role_id_college_id_fkey" FOREIGN KEY ("offered_role_id", "college_id") REFERENCES "public"."drive_roles"("id", "college_id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "public"."consent_records"
    ADD CONSTRAINT "consent_records_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "public"."drives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "public"."notices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "audience" "public"."notice_audience_enum" NOT NULL DEFAULT 'ALL',
    "target_branch_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_batch_years" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "drive_id" UUID,
    "status" "public"."notice_status_enum" NOT NULL DEFAULT 'DRAFT',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notices_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "notices_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notices_drive_id_college_id_fkey" FOREIGN KEY ("drive_id", "college_id") REFERENCES "public"."drives"("id", "college_id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "public"."notice_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "notice_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "storage_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_attachments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notice_attachments_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "notice_attachments_notice_id_college_id_fkey" FOREIGN KEY ("notice_id", "college_id") REFERENCES "public"."notices"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."experiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "drive_id" UUID,
    "author_id" UUID NOT NULL,
    "role_title" VARCHAR(100) NOT NULL,
    "season_label" VARCHAR(50) NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "outcome" "public"."experience_outcome_enum" NOT NULL,
    "overall_summary" TEXT NOT NULL,
    "tips" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."experience_status_enum" NOT NULL DEFAULT 'DRAFT',
    "reviewer_id" UUID,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "experiences_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "experiences_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "experiences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "experiences_drive_id_college_id_fkey" FOREIGN KEY ("drive_id", "college_id") REFERENCES "public"."drives"("id", "college_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "experiences_author_id_college_id_fkey" FOREIGN KEY ("author_id", "college_id") REFERENCES "public"."student_profiles"("user_id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "experiences_difficulty_check" CHECK (difficulty >= 1 AND difficulty <= 5)
);

CREATE TABLE "public"."experience_rounds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "experience_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "round_type" "public"."round_type_enum" NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_rounds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "experience_rounds_experience_id_sequence_key" UNIQUE ("experience_id", "sequence"),
    CONSTRAINT "experience_rounds_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "experience_rounds_experience_id_college_id_fkey" FOREIGN KEY ("experience_id", "college_id") REFERENCES "public"."experiences"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "experience_rounds_difficulty_check" CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5))
);

CREATE TABLE "public"."experience_round_topics" (
    "round_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_round_topics_pkey" PRIMARY KEY ("round_id", "topic_id"),
    CONSTRAINT "experience_round_topics_round_id_college_id_fkey" FOREIGN KEY ("round_id", "college_id") REFERENCES "public"."experience_rounds"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "experience_round_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "public"."experience_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "experience_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "experience_reports_experience_id_reporter_id_key" UNIQUE ("experience_id", "reporter_id"),
    CONSTRAINT "experience_reports_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "experience_reports_experience_id_college_id_fkey" FOREIGN KEY ("experience_id", "college_id") REFERENCES "public"."experiences"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."import_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "type" "public"."import_job_type_enum" NOT NULL,
    "status" "public"."import_job_status_enum" NOT NULL DEFAULT 'UPLOADED',
    "file_hash" VARCHAR(64) NOT NULL,
    "storage_path" VARCHAR(500),
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "valid_rows" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "summary" JSONB,
    "created_by" UUID,
    "committed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "import_jobs_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "import_jobs_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "import_jobs_row_counts_check" CHECK (total_rows >= 0 AND valid_rows >= 0 AND error_count >= 0)
);

CREATE TABLE "public"."import_row_errors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "column" VARCHAR(100),
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_row_errors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "import_row_errors_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "import_row_errors_job_id_college_id_fkey" FOREIGN KEY ("job_id", "college_id") REFERENCES "public"."import_jobs"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Indexes
CREATE INDEX "companies_status_idx" ON "public"."companies"("status");
CREATE INDEX "companies_normalized_name_trgm_idx" ON "public"."companies" USING gin ("normalized_name" gin_trgm_ops);

CREATE INDEX "placement_seasons_college_id_idx" ON "public"."placement_seasons"("college_id");
CREATE UNIQUE INDEX "placement_seasons_one_current_per_college_idx" ON "public"."placement_seasons" ("college_id") WHERE "is_current" = true;

CREATE INDEX "drives_college_id_idx" ON "public"."drives"("college_id");
CREATE INDEX "drives_company_id_idx" ON "public"."drives"("company_id");
CREATE INDEX "drives_season_id_idx" ON "public"."drives"("season_id");
CREATE INDEX "drives_status_idx" ON "public"."drives"("status");

CREATE INDEX "drive_roles_college_id_idx" ON "public"."drive_roles"("college_id");
CREATE INDEX "drive_roles_drive_id_idx" ON "public"."drive_roles"("drive_id");

CREATE INDEX "drive_role_skills_college_id_idx" ON "public"."drive_role_skills"("college_id");

CREATE INDEX "drive_eligibilities_college_id_idx" ON "public"."drive_eligibilities"("college_id");

CREATE INDEX "drive_eligible_branches_college_id_idx" ON "public"."drive_eligible_branches"("college_id");

CREATE INDEX "drive_rounds_college_id_idx" ON "public"."drive_rounds"("college_id");
CREATE INDEX "drive_rounds_drive_id_idx" ON "public"."drive_rounds"("drive_id");

CREATE INDEX "drive_round_topics_college_id_idx" ON "public"."drive_round_topics"("college_id");

CREATE INDEX "drive_applications_college_id_idx" ON "public"."drive_applications"("college_id");
CREATE INDEX "drive_applications_student_id_idx" ON "public"."drive_applications"("student_id");
CREATE INDEX "drive_applications_status_idx" ON "public"."drive_applications"("status");

CREATE INDEX "consent_records_drive_id_idx" ON "public"."consent_records"("drive_id");

CREATE INDEX "notices_college_id_idx" ON "public"."notices"("college_id");
CREATE INDEX "notices_status_idx" ON "public"."notices"("status");

CREATE INDEX "notice_attachments_college_id_idx" ON "public"."notice_attachments"("college_id");
CREATE INDEX "notice_attachments_notice_id_idx" ON "public"."notice_attachments"("notice_id");

CREATE INDEX "experiences_college_id_idx" ON "public"."experiences"("college_id");
CREATE INDEX "experiences_company_id_idx" ON "public"."experiences"("company_id");
CREATE INDEX "experiences_status_idx" ON "public"."experiences"("status");

CREATE INDEX "experience_rounds_college_id_idx" ON "public"."experience_rounds"("college_id");
CREATE INDEX "experience_round_topics_college_id_idx" ON "public"."experience_round_topics"("college_id");

CREATE INDEX "experience_reports_college_id_idx" ON "public"."experience_reports"("college_id");

CREATE INDEX "import_jobs_college_id_idx" ON "public"."import_jobs"("college_id");
CREATE INDEX "import_jobs_file_hash_idx" ON "public"."import_jobs"("file_hash");

CREATE INDEX "import_row_errors_college_id_idx" ON "public"."import_row_errors"("college_id");
CREATE INDEX "import_row_errors_job_id_idx" ON "public"."import_row_errors"("job_id");

-- 7. Updated_at Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "set_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_topics_updated_at" BEFORE UPDATE ON "public"."topics" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_placement_seasons_updated_at" BEFORE UPDATE ON "public"."placement_seasons" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_drives_updated_at" BEFORE UPDATE ON "public"."drives" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_drive_roles_updated_at" BEFORE UPDATE ON "public"."drive_roles" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_drive_eligibilities_updated_at" BEFORE UPDATE ON "public"."drive_eligibilities" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_drive_rounds_updated_at" BEFORE UPDATE ON "public"."drive_rounds" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_drive_applications_updated_at" BEFORE UPDATE ON "public"."drive_applications" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_notices_updated_at" BEFORE UPDATE ON "public"."notices" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_experiences_updated_at" BEFORE UPDATE ON "public"."experiences" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER "set_import_jobs_updated_at" BEFORE UPDATE ON "public"."import_jobs" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Enable Row Level Security (RLS) on All New Tables
ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."topics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."placement_seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drives" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drive_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drive_role_skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drive_eligibilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drive_eligible_branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drive_rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drive_round_topics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drive_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notice_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."experiences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."experience_rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."experience_round_topics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."experience_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."import_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."import_row_errors" ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies

-- Global Catalog: Companies
CREATE POLICY "companies_read_policy" ON "public"."companies"
FOR SELECT USING (
    status = 'VERIFIED'
    OR (created_by_college_id IS NOT NULL AND created_by_college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "companies_super_admin_manage" ON "public"."companies"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Global Catalog: Topics
CREATE POLICY "topics_authenticated_read" ON "public"."topics"
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "topics_super_admin_manage" ON "public"."topics"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Placement Seasons
CREATE POLICY "placement_seasons_college_read" ON "public"."placement_seasons"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "placement_seasons_super_admin_manage" ON "public"."placement_seasons"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Drives
CREATE POLICY "drives_college_read" ON "public"."drives"
FOR SELECT USING (
    (college_id = public.auth_college_id() AND (status != 'DRAFT' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "drives_super_admin_manage" ON "public"."drives"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Drive Roles
CREATE POLICY "drive_roles_college_read" ON "public"."drive_roles"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "drive_roles_super_admin_manage" ON "public"."drive_roles"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Drive Role Skills
CREATE POLICY "drive_role_skills_college_read" ON "public"."drive_role_skills"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "drive_role_skills_super_admin_manage" ON "public"."drive_role_skills"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Drive Eligibilities
CREATE POLICY "drive_eligibilities_college_read" ON "public"."drive_eligibilities"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "drive_eligibilities_super_admin_manage" ON "public"."drive_eligibilities"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Drive Eligible Branches
CREATE POLICY "drive_eligible_branches_college_read" ON "public"."drive_eligible_branches"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "drive_eligible_branches_super_admin_manage" ON "public"."drive_eligible_branches"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Drive Rounds
CREATE POLICY "drive_rounds_college_read" ON "public"."drive_rounds"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "drive_rounds_super_admin_manage" ON "public"."drive_rounds"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Drive Round Topics
CREATE POLICY "drive_round_topics_college_read" ON "public"."drive_round_topics"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "drive_round_topics_super_admin_manage" ON "public"."drive_round_topics"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Drive Applications
CREATE POLICY "drive_applications_read" ON "public"."drive_applications"
FOR SELECT USING (
    (student_id = auth.uid() AND college_id = public.auth_college_id())
    OR (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "drive_applications_student_insert" ON "public"."drive_applications"
FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND college_id = public.auth_college_id()
);

CREATE POLICY "drive_applications_super_admin_manage" ON "public"."drive_applications"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Notices
CREATE POLICY "notices_read" ON "public"."notices"
FOR SELECT USING (
    (college_id = public.auth_college_id() AND (status = 'PUBLISHED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "notices_super_admin_manage" ON "public"."notices"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Notice Attachments
CREATE POLICY "notice_attachments_college_read" ON "public"."notice_attachments"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "notice_attachments_super_admin_manage" ON "public"."notice_attachments"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Experiences
CREATE POLICY "experiences_read" ON "public"."experiences"
FOR SELECT USING (
    (college_id = public.auth_college_id() AND (status = 'APPROVED' OR author_id = auth.uid() OR public.auth_user_role() = 'COLLEGE_ADMIN'))
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "experiences_student_insert" ON "public"."experiences"
FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND college_id = public.auth_college_id()
);

CREATE POLICY "experiences_super_admin_manage" ON "public"."experiences"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Experience Rounds
CREATE POLICY "experience_rounds_college_read" ON "public"."experience_rounds"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "experience_rounds_super_admin_manage" ON "public"."experience_rounds"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Experience Round Topics
CREATE POLICY "experience_round_topics_college_read" ON "public"."experience_round_topics"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "experience_round_topics_super_admin_manage" ON "public"."experience_round_topics"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Experience Reports
CREATE POLICY "experience_reports_read" ON "public"."experience_reports"
FOR SELECT USING (
    (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "experience_reports_student_insert" ON "public"."experience_reports"
FOR INSERT WITH CHECK (
    reporter_id = auth.uid()
    AND college_id = public.auth_college_id()
);

CREATE POLICY "experience_reports_super_admin_manage" ON "public"."experience_reports"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Import Jobs
CREATE POLICY "import_jobs_college_read" ON "public"."import_jobs"
FOR SELECT USING (
    (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "import_jobs_super_admin_manage" ON "public"."import_jobs"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Tenant Table: Import Row Errors
CREATE POLICY "import_row_errors_college_read" ON "public"."import_row_errors"
FOR SELECT USING (
    (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "import_row_errors_super_admin_manage" ON "public"."import_row_errors"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- 10. PostgREST Lockdown: Revoke direct access from anon and authenticated
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

-- Ensure service_role has complete access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
