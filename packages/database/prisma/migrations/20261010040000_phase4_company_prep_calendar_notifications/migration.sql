-- =============================================================================
-- Migration: 20261010040000_phase4_company_prep_calendar_notifications
-- Purpose: Phase 4 Company Intelligence, Preparation Mode, Match Score, Calendar, Notifications
-- =============================================================================

-- 1. Create Enums
CREATE TYPE "college_feature_type_enum" AS ENUM ('COMPANY_PREP', 'COMPANY_MATCH', 'CALENDAR', 'EMAIL_NOTIFICATIONS', 'INTERVIEW_BANK');
CREATE TYPE "drive_event_kind_enum" AS ENUM ('REGISTRATION_OPENS', 'REGISTRATION_DEADLINE', 'PRE_PLACEMENT_TALK', 'APTITUDE_TEST', 'CODING_TEST', 'GROUP_DISCUSSION', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'RESULTS', 'DOCUMENT_DEADLINE', 'OTHER');
CREATE TYPE "event_mode_enum" AS ENUM ('ONLINE', 'OFFLINE');
CREATE TYPE "event_audience_enum" AS ENUM ('ALL_ELIGIBLE', 'REGISTERED', 'SHORTLISTED');
CREATE TYPE "event_status_enum" AS ENUM ('SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'DONE');
CREATE TYPE "college_event_audience_enum" AS ENUM ('ALL', 'BY_BRANCH', 'BY_BATCH_YEAR');
CREATE TYPE "prep_resource_type_enum" AS ENUM ('LINK', 'FILE', 'NOTE');
CREATE TYPE "prep_resource_status_enum" AS ENUM ('DRAFT', 'APPROVED', 'RETIRED');
CREATE TYPE "interview_question_category_enum" AS ENUM ('HR', 'BEHAVIORAL', 'TECHNICAL', 'PROJECT', 'ROLE_SPECIFIC');
CREATE TYPE "interview_question_progress_status_enum" AS ENUM ('NOT_STARTED', 'PRACTICING', 'CONFIDENT');
CREATE TYPE "company_match_confidence_enum" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "company_priority_tier_enum" AS ENUM ('PREPARE_NOW', 'PREPARE_NEXT', 'ON_RADAR', 'NOT_ELIGIBLE');
CREATE TYPE "notification_category_enum" AS ENUM ('ACCOUNT_SECURITY', 'ACCOUNT_APPROVAL', 'DRIVE_PUBLISHED', 'REGISTRATION_DEADLINE', 'EVENT_REMINDER', 'APPLICATION_STATUS', 'TEST_SCHEDULED', 'TEST_REMINDER', 'NOTICE', 'EXPERIENCE_REVIEW', 'PREP_NUDGE', 'WEEKLY_DIGEST');
CREATE TYPE "notification_channel_enum" AS ENUM ('IN_APP', 'EMAIL');
CREATE TYPE "email_outbox_status_enum" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'SUPPRESSED', 'SKIPPED', 'BOUNCED', 'COMPLAINED');
CREATE TYPE "company_size_band_enum" AS ENUM ('STARTUP', 'MID_SIZE', 'ENTERPRISE', 'LARGE_ENTERPRISE');
CREATE TYPE "role_family_enum" AS ENUM ('SOFTWARE_DEV', 'DATA_ANALYTICS', 'QA_TESTING', 'SUPPORT_OPERATIONS', 'CORE_ENGINEERING', 'CONSULTING_BUSINESS', 'OTHER');
CREATE TYPE "email_suppression_reason_enum" AS ENUM ('BOUNCE', 'COMPLAINT', 'MANUAL', 'UNSUBSCRIBE_ALL');

-- 2. Create Tables
CREATE TABLE "college_features" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "feature" "college_feature_type_enum" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "enabled_at" TIMESTAMPTZ(6),
    "enabled_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_features_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "drive_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drive_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "round_id" UUID,
    "kind" "drive_event_kind_enum" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "mode" "event_mode_enum" NOT NULL DEFAULT 'OFFLINE',
    "location" VARCHAR(255),
    "meeting_url" VARCHAR(500),
    "audience" "event_audience_enum" NOT NULL DEFAULT 'ALL_ELIGIBLE',
    "status" "event_status_enum" NOT NULL DEFAULT 'SCHEDULED',
    "notify_on_create" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "drive_events_ends_at_check" CHECK (ends_at >= starts_at)
);

CREATE TABLE "college_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "mode" "event_mode_enum" NOT NULL DEFAULT 'OFFLINE',
    "location" VARCHAR(255),
    "meeting_url" VARCHAR(500),
    "audience" "college_event_audience_enum" NOT NULL DEFAULT 'ALL',
    "target_branch_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "target_batch_years" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "status" "event_status_enum" NOT NULL DEFAULT 'SCHEDULED',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "college_events_ends_at_check" CHECK (ends_at >= starts_at)
);

CREATE TABLE "calendar_feed_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_accessed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_feed_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_follows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_follows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "college_company_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_company_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prep_resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" "content_scope_enum" NOT NULL DEFAULT 'COLLEGE',
    "college_id" UUID,
    "company_id" UUID,
    "topic_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "prep_resource_type_enum" NOT NULL DEFAULT 'LINK',
    "url" VARCHAR(1000),
    "storage_path" VARCHAR(500),
    "content" TEXT,
    "status" "prep_resource_status_enum" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prep_resources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" "content_scope_enum" NOT NULL DEFAULT 'COLLEGE',
    "college_id" UUID,
    "company_id" UUID,
    "role_family" "role_family_enum" DEFAULT 'SOFTWARE_DEV',
    "category" "interview_question_category_enum" NOT NULL DEFAULT 'TECHNICAL',
    "question" TEXT NOT NULL,
    "answer_guide" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "question_status_enum" NOT NULL DEFAULT 'DRAFT',
    "source" "question_source_enum" NOT NULL DEFAULT 'AUTHORED',
    "source_experience_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview_question_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "status" "interview_question_progress_status_enum" NOT NULL DEFAULT 'NOT_STARTED',
    "student_notes" TEXT,
    "last_practiced_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_question_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_company_scores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "drive_id" UUID,
    "formula_version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "match_score" DOUBLE PRECISION,
    "match_confidence" "company_match_confidence_enum" NOT NULL DEFAULT 'LOW',
    "match_components" JSONB NOT NULL DEFAULT '{}',
    "priority_tier" "company_priority_tier_enum" NOT NULL DEFAULT 'ON_RADAR',
    "priority_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority_components" JSONB NOT NULL DEFAULT '{}',
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_company_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "college_id" UUID,
    "category" "notification_category_enum" NOT NULL,
    "channel" "notification_channel_enum" NOT NULL DEFAULT 'IN_APP',
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "link_url" VARCHAR(500),
    "read_at" TIMESTAMPTZ(6),
    "dedupe_key" VARCHAR(255),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "college_id" UUID,
    "category" "notification_category_enum" NOT NULL,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_outbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "college_id" UUID,
    "recipient_email" VARCHAR(255) NOT NULL,
    "recipient_name" VARCHAR(255),
    "category" "notification_category_enum" NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_text" TEXT NOT NULL,
    "status" "email_outbox_status_enum" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_attempt_at" TIMESTAMPTZ(6),
    "next_attempt_at" TIMESTAMPTZ(6),
    "provider_message_id" VARCHAR(255),
    "last_error" TEXT,
    "dedupe_key" VARCHAR(255),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "size_band" "company_size_band_enum" NOT NULL DEFAULT 'MID_SIZE',
    "primary_role_family" "role_family_enum" NOT NULL DEFAULT 'SOFTWARE_DEV',
    "overview" TEXT,
    "website_url" VARCHAR(500),
    "logo_url" VARCHAR(500),
    "hq_city" VARCHAR(100),
    "hq_country" VARCHAR(100) DEFAULT 'India',
    "glassdoor_rating" DOUBLE PRECISION,
    "tech_stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selection_process_summary" TEXT,
    "typical_rounds_count" INTEGER DEFAULT 3,
    "ctc_breakup_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_suppressions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "reason" "email_suppression_reason_enum" NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" VARCHAR(50) NOT NULL,
    "event_id" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- 3. Indexes & Constraints
CREATE UNIQUE INDEX "college_features_college_id_feature_key" ON "college_features"("college_id", "feature");

CREATE INDEX "drive_events_drive_id_idx" ON "drive_events"("drive_id");
CREATE INDEX "drive_events_college_id_idx" ON "drive_events"("college_id");
CREATE INDEX "drive_events_starts_at_idx" ON "drive_events"("starts_at");
CREATE UNIQUE INDEX "drive_events_id_college_id_key" ON "drive_events"("id", "college_id");

CREATE INDEX "college_events_college_id_idx" ON "college_events"("college_id");
CREATE INDEX "college_events_starts_at_idx" ON "college_events"("starts_at");
CREATE UNIQUE INDEX "college_events_id_college_id_key" ON "college_events"("id", "college_id");

CREATE UNIQUE INDEX "calendar_feed_tokens_token_hash_key" ON "calendar_feed_tokens"("token_hash");
CREATE INDEX "calendar_feed_tokens_token_hash_idx" ON "calendar_feed_tokens"("token_hash");
CREATE UNIQUE INDEX "calendar_feed_tokens_user_id_college_id_key" ON "calendar_feed_tokens"("user_id", "college_id");

CREATE INDEX "company_follows_student_id_idx" ON "company_follows"("student_id");
CREATE INDEX "company_follows_college_id_idx" ON "company_follows"("college_id");
CREATE INDEX "company_follows_company_id_idx" ON "company_follows"("company_id");
CREATE UNIQUE INDEX "company_follows_student_id_company_id_key" ON "company_follows"("student_id", "company_id");

CREATE INDEX "college_company_notes_college_id_idx" ON "college_company_notes"("college_id");
CREATE INDEX "college_company_notes_company_id_idx" ON "college_company_notes"("company_id");
CREATE UNIQUE INDEX "college_company_notes_college_id_company_id_key" ON "college_company_notes"("college_id", "company_id");

CREATE INDEX "prep_resources_college_id_idx" ON "prep_resources"("college_id");
CREATE INDEX "prep_resources_company_id_idx" ON "prep_resources"("company_id");
CREATE INDEX "prep_resources_topic_id_idx" ON "prep_resources"("topic_id");
CREATE INDEX "prep_resources_status_idx" ON "prep_resources"("status");
CREATE UNIQUE INDEX "prep_resources_id_college_id_key" ON "prep_resources"("id", "college_id");

CREATE INDEX "interview_questions_college_id_idx" ON "interview_questions"("college_id");
CREATE INDEX "interview_questions_company_id_idx" ON "interview_questions"("company_id");
CREATE INDEX "interview_questions_role_family_idx" ON "interview_questions"("role_family");
CREATE INDEX "interview_questions_category_idx" ON "interview_questions"("category");
CREATE INDEX "interview_questions_status_idx" ON "interview_questions"("status");
CREATE UNIQUE INDEX "interview_questions_id_college_id_key" ON "interview_questions"("id", "college_id");

CREATE INDEX "interview_question_progress_student_id_idx" ON "interview_question_progress"("student_id");
CREATE INDEX "interview_question_progress_college_id_idx" ON "interview_question_progress"("college_id");
CREATE INDEX "interview_question_progress_question_id_idx" ON "interview_question_progress"("question_id");
CREATE UNIQUE INDEX "interview_question_progress_student_id_question_id_key" ON "interview_question_progress"("student_id", "question_id");

CREATE INDEX "student_company_scores_student_id_idx" ON "student_company_scores"("student_id");
CREATE INDEX "student_company_scores_college_id_idx" ON "student_company_scores"("college_id");
CREATE INDEX "student_company_scores_company_id_idx" ON "student_company_scores"("company_id");
CREATE INDEX "student_company_scores_priority_tier_idx" ON "student_company_scores"("priority_tier");
CREATE UNIQUE INDEX "student_company_scores_student_id_company_id_key" ON "student_company_scores"("student_id", "company_id");

CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX "notifications_college_id_idx" ON "notifications"("college_id");
CREATE INDEX "notifications_dedupe_key_idx" ON "notifications"("dedupe_key");

CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");
CREATE UNIQUE INDEX "notification_preferences_user_id_category_key" ON "notification_preferences"("user_id", "category");

CREATE INDEX "email_outbox_status_next_attempt_at_idx" ON "email_outbox"("status", "next_attempt_at");
CREATE INDEX "email_outbox_user_id_idx" ON "email_outbox"("user_id");
CREATE INDEX "email_outbox_college_id_idx" ON "email_outbox"("college_id");
CREATE INDEX "email_outbox_dedupe_key_idx" ON "email_outbox"("dedupe_key");

CREATE UNIQUE INDEX "company_profiles_company_id_key" ON "company_profiles"("company_id");
CREATE INDEX "company_profiles_size_band_idx" ON "company_profiles"("size_band");
CREATE INDEX "company_profiles_primary_role_family_idx" ON "company_profiles"("primary_role_family");

CREATE INDEX "email_suppressions_email_idx" ON "email_suppressions"("email");
CREATE UNIQUE INDEX "email_suppressions_email_reason_key" ON "email_suppressions"("email", "reason");

CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");
CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "webhook_events"("provider", "event_id");

-- 4. Foreign Keys
ALTER TABLE "college_features" ADD CONSTRAINT "college_features_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "college_features" ADD CONSTRAINT "college_features_enabled_by_fkey" FOREIGN KEY ("enabled_by") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "drive_events" ADD CONSTRAINT "drive_events_drive_id_college_id_fkey" FOREIGN KEY ("drive_id", "college_id") REFERENCES "drives"("id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "drive_events" ADD CONSTRAINT "drive_events_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "drive_events" ADD CONSTRAINT "drive_events_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "drive_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "college_events" ADD CONSTRAINT "college_events_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "college_events" ADD CONSTRAINT "college_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "calendar_feed_tokens" ADD CONSTRAINT "calendar_feed_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_feed_tokens" ADD CONSTRAINT "calendar_feed_tokens_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_follows" ADD CONSTRAINT "company_follows_student_id_college_id_fkey" FOREIGN KEY ("student_id", "college_id") REFERENCES "student_profiles"("user_id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_follows" ADD CONSTRAINT "company_follows_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_follows" ADD CONSTRAINT "company_follows_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "college_company_notes" ADD CONSTRAINT "college_company_notes_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "college_company_notes" ADD CONSTRAINT "college_company_notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "college_company_notes" ADD CONSTRAINT "college_company_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prep_resources" ADD CONSTRAINT "prep_resources_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prep_resources" ADD CONSTRAINT "prep_resources_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prep_resources" ADD CONSTRAINT "prep_resources_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prep_resources" ADD CONSTRAINT "prep_resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_source_experience_id_fkey" FOREIGN KEY ("source_experience_id") REFERENCES "experiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "interview_question_progress" ADD CONSTRAINT "interview_question_progress_student_id_college_id_fkey" FOREIGN KEY ("student_id", "college_id") REFERENCES "student_profiles"("user_id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_question_progress" ADD CONSTRAINT "interview_question_progress_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_question_progress" ADD CONSTRAINT "interview_question_progress_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_company_scores" ADD CONSTRAINT "student_company_scores_student_id_college_id_fkey" FOREIGN KEY ("student_id", "college_id") REFERENCES "student_profiles"("user_id", "college_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_company_scores" ADD CONSTRAINT "student_company_scores_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_company_scores" ADD CONSTRAINT "student_company_scores_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_company_scores" ADD CONSTRAINT "student_company_scores_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "drives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. DB Trigger: Max 15 Followed Companies per Student
CREATE OR REPLACE FUNCTION public.check_max_company_follows()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM public.company_follows WHERE student_id = NEW.student_id) >= 15 THEN
    RAISE EXCEPTION 'A student cannot follow more than 15 companies simultaneously.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_max_company_follows ON public.company_follows;
CREATE TRIGGER trg_check_max_company_follows
  BEFORE INSERT ON public.company_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_company_follows();

-- 6. Row Level Security Policies
ALTER TABLE "public"."college_features" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."drive_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."college_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."calendar_feed_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."college_company_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."prep_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."interview_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."interview_question_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_company_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_outbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_suppressions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;

-- College Features Policies
CREATE POLICY "college_features_read" ON "public"."college_features"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "college_features_super_admin" ON "public"."college_features"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Drive Events Policies
CREATE POLICY "drive_events_read" ON "public"."drive_events"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "drive_events_college_admin" ON "public"."drive_events"
FOR ALL USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "drive_events_super_admin" ON "public"."drive_events"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- College Events Policies
CREATE POLICY "college_events_read" ON "public"."college_events"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "college_events_college_admin" ON "public"."college_events"
FOR ALL USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "college_events_super_admin" ON "public"."college_events"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Calendar Feed Tokens Policies
CREATE POLICY "calendar_feed_tokens_user" ON "public"."calendar_feed_tokens"
FOR ALL USING (
    user_id = auth.uid() AND college_id = public.auth_college_id()
) WITH CHECK (
    user_id = auth.uid() AND college_id = public.auth_college_id()
);

CREATE POLICY "calendar_feed_tokens_super_admin" ON "public"."calendar_feed_tokens"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Company Follows Policies
CREATE POLICY "company_follows_student" ON "public"."company_follows"
FOR ALL USING (
    student_id = auth.uid() AND college_id = public.auth_college_id()
) WITH CHECK (
    student_id = auth.uid() AND college_id = public.auth_college_id()
);

CREATE POLICY "company_follows_college_admin_read" ON "public"."company_follows"
FOR SELECT USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "company_follows_super_admin" ON "public"."company_follows"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- College Company Notes Policies
CREATE POLICY "college_company_notes_college_admin" ON "public"."college_company_notes"
FOR ALL USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "college_company_notes_super_admin" ON "public"."college_company_notes"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Prep Resources Policies
CREATE POLICY "prep_resources_read" ON "public"."prep_resources"
FOR SELECT USING (
    (scope = 'GLOBAL' AND (status = 'APPROVED' OR public.auth_user_role() = 'SUPER_ADMIN'))
    OR (college_id = public.auth_college_id() AND (status = 'APPROVED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "prep_resources_college_admin" ON "public"."prep_resources"
FOR ALL USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "prep_resources_super_admin" ON "public"."prep_resources"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Interview Questions Policies
CREATE POLICY "interview_questions_read" ON "public"."interview_questions"
FOR SELECT USING (
    (scope = 'GLOBAL' AND (status = 'APPROVED' OR public.auth_user_role() = 'SUPER_ADMIN'))
    OR (college_id = public.auth_college_id() AND (status = 'APPROVED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "interview_questions_college_admin" ON "public"."interview_questions"
FOR ALL USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "interview_questions_super_admin" ON "public"."interview_questions"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Interview Question Progress Policies
CREATE POLICY "interview_question_progress_student" ON "public"."interview_question_progress"
FOR ALL USING (
    student_id = auth.uid() AND college_id = public.auth_college_id()
) WITH CHECK (
    student_id = auth.uid() AND college_id = public.auth_college_id()
);

CREATE POLICY "interview_question_progress_super_admin" ON "public"."interview_question_progress"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Student Company Scores Policies
CREATE POLICY "student_company_scores_student_read" ON "public"."student_company_scores"
FOR SELECT USING (
    student_id = auth.uid() AND college_id = public.auth_college_id()
);

CREATE POLICY "student_company_scores_college_admin_read" ON "public"."student_company_scores"
FOR SELECT USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "student_company_scores_super_admin" ON "public"."student_company_scores"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Notifications Policies
CREATE POLICY "notifications_user" ON "public"."notifications"
FOR ALL USING (
    user_id = auth.uid()
) WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "notifications_super_admin" ON "public"."notifications"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Notification Preferences Policies
CREATE POLICY "notification_preferences_user" ON "public"."notification_preferences"
FOR ALL USING (
    user_id = auth.uid()
) WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "notification_preferences_super_admin" ON "public"."notification_preferences"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Email Outbox Policies
CREATE POLICY "email_outbox_college_admin_read" ON "public"."email_outbox"
FOR SELECT USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "email_outbox_super_admin" ON "public"."email_outbox"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Company Profiles Policies
CREATE POLICY "company_profiles_read" ON "public"."company_profiles"
FOR SELECT USING (true);

CREATE POLICY "company_profiles_college_admin_update" ON "public"."company_profiles"
FOR UPDATE USING (
    public.auth_user_role() = 'COLLEGE_ADMIN'
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN'
);

CREATE POLICY "company_profiles_super_admin" ON "public"."company_profiles"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Email Suppressions Policies
CREATE POLICY "email_suppressions_super_admin" ON "public"."email_suppressions"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Webhook Events Policies
CREATE POLICY "webhook_events_super_admin" ON "public"."webhook_events"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- 7. PostgREST Lockdown: Revoke direct access from anon and authenticated
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
