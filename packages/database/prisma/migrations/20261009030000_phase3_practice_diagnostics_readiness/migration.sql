-- =============================================================================
-- Migration: 20261009030000_phase3_practice_diagnostics_readiness
-- CampusEdge Phase 3: Practice, Diagnostics, Readiness Engine, Security & RLS
-- =============================================================================

-- 1. Create Enums
CREATE TYPE "public"."question_type_enum" AS ENUM ('MCQ_SINGLE', 'MCQ_MULTI', 'NUMERIC');
CREATE TYPE "public"."content_scope_enum" AS ENUM ('GLOBAL', 'COLLEGE');
CREATE TYPE "public"."question_status_enum" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'RETIRED', 'FLAGGED');
CREATE TYPE "public"."question_source_enum" AS ENUM ('ORIGINAL_SEED', 'AUTHORED', 'IMPORTED', 'LICENSED');
CREATE TYPE "public"."question_report_reason_enum" AS ENUM ('WRONG_ANSWER', 'UNCLEAR', 'DUPLICATE', 'OFFENSIVE', 'COPYRIGHT', 'OTHER');
CREATE TYPE "public"."test_template_kind_enum" AS ENUM ('DIAGNOSTIC', 'PRACTICE', 'MOCK', 'COLLEGE_TEST');
CREATE TYPE "public"."test_template_status_enum" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "public"."test_generation_mode_enum" AS ENUM ('GENERATED', 'FIXED');
CREATE TYPE "public"."test_track_enum" AS ENUM ('ALL', 'SOFTWARE');
CREATE TYPE "public"."technical_track_enum" AS ENUM ('SOFTWARE', 'OTHER');
CREATE TYPE "public"."test_schedule_audience_enum" AS ENUM ('ALL', 'BY_BRANCH', 'BY_BATCH_YEAR');
CREATE TYPE "public"."results_release_policy_enum" AS ENUM ('IMMEDIATE', 'AFTER_WINDOW_CLOSES', 'MANUAL');
CREATE TYPE "public"."test_schedule_status_enum" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "public"."attempt_status_enum" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'ABANDONED', 'VOIDED');
CREATE TYPE "public"."attempt_event_type_enum" AS ENUM ('BLUR', 'FOCUS', 'FULLSCREEN_EXIT', 'VISIBILITY_HIDDEN', 'PASTE', 'RECONNECT');
CREATE TYPE "public"."topic_mastery_level_enum" AS ENUM ('STRONG', 'MODERATE', 'WEAK', 'INSUFFICIENT_DATA');
CREATE TYPE "public"."readiness_band_enum" AS ENUM ('GETTING_STARTED', 'BUILDING', 'COMPETITIVE', 'STRONG');
CREATE TYPE "public"."readiness_confidence_enum" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "public"."readiness_trigger_enum" AS ENUM ('ATTEMPT_SUBMITTED', 'DAILY', 'MANUAL');
CREATE TYPE "public"."roadmap_plan_status_enum" AS ENUM ('ACTIVE', 'SUPERSEDED');
CREATE TYPE "public"."roadmap_task_kind_enum" AS ENUM ('PRACTICE_TOPIC', 'TAKE_TEST', 'REVIEW_MISTAKES', 'MAINTENANCE', 'DRIVE_PREP');
CREATE TYPE "public"."roadmap_task_status_enum" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- 2. Alter Existing Tables
ALTER TABLE "public"."topics"
    ADD COLUMN IF NOT EXISTS "parent_id" UUID,
    ADD COLUMN IF NOT EXISTS "track" "public"."test_track_enum" NOT NULL DEFAULT 'ALL',
    ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0,
    ADD CONSTRAINT "topics_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."student_profiles"
    ADD COLUMN IF NOT EXISTS "technical_track" "public"."technical_track_enum" NOT NULL DEFAULT 'SOFTWARE',
    ADD COLUMN IF NOT EXISTS "study_hours_per_day" DECIMAL(3, 1) NOT NULL DEFAULT 1.5,
    ADD COLUMN IF NOT EXISTS "target_date" TIMESTAMPTZ(6),
    ADD CONSTRAINT "student_profiles_study_hours_check" CHECK ("study_hours_per_day" >= 0.5 AND "study_hours_per_day" <= 8.0);

ALTER TABLE "public"."consent_records"
    ADD COLUMN IF NOT EXISTS "granted" BOOLEAN NOT NULL DEFAULT true;

-- 3. Create Content & Question Tables
CREATE TABLE "public"."question_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" "public"."content_scope_enum" NOT NULL DEFAULT 'COLLEGE',
    "college_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "image_path" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_groups_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "question_groups_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "question_groups_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_groups_scope_college_check" CHECK (
        ("scope" = 'GLOBAL' AND "college_id" IS NULL) OR
        ("scope" = 'COLLEGE' AND "college_id" IS NOT NULL)
    )
);

CREATE TABLE "public"."questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" "public"."content_scope_enum" NOT NULL DEFAULT 'COLLEGE',
    "college_id" UUID,
    "topic_id" UUID NOT NULL,
    "subtopic_id" UUID,
    "type" "public"."question_type_enum" NOT NULL DEFAULT 'MCQ_SINGLE',
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "group_id" UUID,
    "status" "public"."question_status_enum" NOT NULL DEFAULT 'DRAFT',
    "current_version_id" UUID,
    "source" "public"."question_source_enum" NOT NULL DEFAULT 'AUTHORED',
    "license_note" TEXT,
    "text_hash" VARCHAR(64) NOT NULL,
    "needs_human_review" BOOLEAN NOT NULL DEFAULT true,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "expected_time_seconds" INTEGER NOT NULL DEFAULT 60,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "questions_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "questions_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "questions_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "questions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."question_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "questions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "questions_scope_college_check" CHECK (
        ("scope" = 'GLOBAL' AND "college_id" IS NULL) OR
        ("scope" = 'COLLEGE' AND "college_id" IS NOT NULL)
    ),
    CONSTRAINT "questions_difficulty_check" CHECK ("difficulty" >= 1 AND "difficulty" <= 5),
    CONSTRAINT "questions_expected_time_check" CHECK ("expected_time_seconds" >= 10 AND "expected_time_seconds" <= 600)
);

CREATE TABLE "public"."question_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stem" TEXT NOT NULL,
    "image_path" VARCHAR(500),
    "explanation" TEXT NOT NULL,
    "numeric_answer" DOUBLE PRECISION,
    "numeric_tolerance" DOUBLE PRECISION DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "question_versions_question_id_version_key" UNIQUE ("question_id", "version"),
    CONSTRAINT "question_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Circular FK for current_version_id
ALTER TABLE "public"."questions"
    ADD CONSTRAINT "questions_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "public"."question_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "public"."question_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version_id" UUID NOT NULL,
    "key" VARCHAR(5) NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "question_options_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."question_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."question_stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "avg_time_ms" INTEGER NOT NULL DEFAULT 0,
    "report_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_stats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "question_stats_question_id_key" UNIQUE ("question_id"),
    CONSTRAINT "question_stats_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."question_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" "public"."question_report_reason_enum" NOT NULL,
    "note" VARCHAR(500) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "question_reports_question_id_reporter_id_key" UNIQUE ("question_id", "reporter_id"),
    CONSTRAINT "question_reports_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."question_bookmarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_bookmarks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "question_bookmarks_student_id_question_id_key" UNIQUE ("student_id", "question_id"),
    CONSTRAINT "question_bookmarks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_bookmarks_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_bookmarks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Create Test Engine & Schedule Tables
CREATE TABLE "public"."test_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" "public"."content_scope_enum" NOT NULL DEFAULT 'COLLEGE',
    "college_id" UUID,
    "kind" "public"."test_template_kind_enum" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "company_id" UUID,
    "duration_minutes" INTEGER NOT NULL,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT true,
    "shuffle_options" BOOLEAN NOT NULL DEFAULT true,
    "generation_mode" "public"."test_generation_mode_enum" NOT NULL DEFAULT 'GENERATED',
    "status" "public"."test_template_status_enum" NOT NULL DEFAULT 'DRAFT',
    "track" "public"."test_track_enum" NOT NULL DEFAULT 'ALL',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "test_templates_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "test_templates_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "test_templates_scope_college_check" CHECK (
        ("scope" = 'GLOBAL' AND "college_id" IS NULL) OR
        ("scope" = 'COLLEGE' AND "college_id" IS NOT NULL)
    ),
    CONSTRAINT "test_templates_duration_check" CHECK ("duration_minutes" >= 5 AND "duration_minutes" <= 300)
);

CREATE TABLE "public"."test_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "marks_per_question" DOUBLE PRECISION NOT NULL,
    "negative_marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "section_time_limit_minutes" INTEGER,
    "question_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_sections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "test_sections_template_id_sequence_key" UNIQUE ("template_id", "sequence"),
    CONSTRAINT "test_sections_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."test_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_sections_marks_check" CHECK ("marks_per_question" > 0),
    CONSTRAINT "test_sections_negative_marks_check" CHECK ("negative_marks" >= 0),
    CONSTRAINT "test_sections_question_count_check" CHECK ("question_count" >= 1)
);

CREATE TABLE "public"."test_section_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "section_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "subtopic_id" UUID,
    "count" INTEGER NOT NULL,
    "difficulty_min" INTEGER NOT NULL DEFAULT 1,
    "difficulty_max" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "test_section_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "test_section_rules_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."test_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_section_rules_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "test_section_rules_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "test_section_rules_count_check" CHECK ("count" >= 1),
    CONSTRAINT "test_section_rules_difficulty_check" CHECK ("difficulty_min" >= 1 AND "difficulty_max" <= 5 AND "difficulty_min" <= "difficulty_max")
);

CREATE TABLE "public"."test_section_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "section_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "test_section_questions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "test_section_questions_section_id_position_key" UNIQUE ("section_id", "position"),
    CONSTRAINT "test_section_questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."test_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_section_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."test_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "audience" "public"."test_schedule_audience_enum" NOT NULL DEFAULT 'ALL',
    "target_branch_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    "target_batch_years" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "results_release" "public"."results_release_policy_enum" NOT NULL DEFAULT 'IMMEDIATE',
    "results_released_at" TIMESTAMPTZ(6),
    "status" "public"."test_schedule_status_enum" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_schedules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "test_schedules_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "test_schedules_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_schedules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."test_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "schedule_id" UUID,
    "kind" "public"."test_template_kind_enum" NOT NULL,
    "status" "public"."attempt_status_enum" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline_at" TIMESTAMPTZ(6) NOT NULL,
    "submitted_at" TIMESTAMPTZ(6),
    "seed" INTEGER NOT NULL,
    "total_marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "section_scores" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "formula_version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "integrity_flag_count" INTEGER NOT NULL DEFAULT 0,
    "user_agent" TEXT,
    "void_reason" TEXT,
    "voided_at" TIMESTAMPTZ(6),
    "voided_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "attempts_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempts_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."test_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attempts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."test_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "attempts_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "attempts_percent_check" CHECK ("percent" >= 0.0 AND "percent" <= 100.0)
);

-- Partial Unique Index: Strictly at most ONE IN_PROGRESS attempt per student
CREATE UNIQUE INDEX "attempts_student_in_progress_key" ON "public"."attempts"("student_id") WHERE "status" = 'IN_PROGRESS';

CREATE TABLE "public"."attempt_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "section_seq" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "question_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "option_order" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "selected_option_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    "numeric_response" DOUBLE PRECISION,
    "is_correct" BOOLEAN,
    "marks_awarded" DOUBLE PRECISION,
    "answered_at" TIMESTAMPTZ(6),
    "time_spent_ms" INTEGER NOT NULL DEFAULT 0,
    "marked_for_review" BOOLEAN NOT NULL DEFAULT false,
    "visited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attempt_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "attempt_items_attempt_id_position_key" UNIQUE ("attempt_id", "position"),
    CONSTRAINT "attempt_items_id_college_id_key" UNIQUE ("id", "college_id"),
    CONSTRAINT "attempt_items_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempt_items_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempt_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attempt_items_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "public"."attempt_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "type" "public"."attempt_event_type_enum" NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB NOT NULL DEFAULT '{}'::JSONB,

    CONSTRAINT "attempt_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "attempt_events_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempt_events_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Analytics, Readiness & Roadmap Tables
CREATE TABLE "public"."student_topic_stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "scored_count" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "level" "public"."topic_mastery_level_enum" NOT NULL DEFAULT 'INSUFFICIENT_DATA',
    "last_practiced_at" TIMESTAMPTZ(6),
    "formula_version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_topic_stats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_topic_stats_student_id_topic_id_key" UNIQUE ("student_id", "topic_id"),
    CONSTRAINT "student_topic_stats_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_topic_stats_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_topic_stats_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_topic_stats_mastery_check" CHECK ("mastery" >= 0.0 AND "mastery" <= 1.0)
);

CREATE TABLE "public"."readiness_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formula_version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "score" DOUBLE PRECISION NOT NULL,
    "band" "public"."readiness_band_enum" NOT NULL,
    "confidence" "public"."readiness_confidence_enum" NOT NULL,
    "components" JSONB NOT NULL,
    "trigger" "public"."readiness_trigger_enum" NOT NULL DEFAULT 'ATTEMPT_SUBMITTED',

    CONSTRAINT "readiness_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "readiness_snapshots_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "readiness_snapshots_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "readiness_snapshots_score_check" CHECK ("score" >= 0.0 AND "score" <= 100.0)
);

CREATE TABLE "public"."roadmap_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "status" "public"."roadmap_plan_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horizon_days" INTEGER NOT NULL DEFAULT 28,
    "inputs" JSONB NOT NULL DEFAULT '{}'::JSONB,
    "formula_version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',

    CONSTRAINT "roadmap_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "roadmap_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "roadmap_plans_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."roadmap_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "scheduled_date" VARCHAR(10) NOT NULL,
    "kind" "public"."roadmap_task_kind_enum" NOT NULL,
    "topic_id" UUID,
    "drive_id" UUID,
    "target_question_count" INTEGER NOT NULL,
    "status" "public"."roadmap_task_status_enum" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMPTZ(6),
    "priority" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "roadmap_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."roadmap_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "roadmap_tasks_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "roadmap_tasks_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "public"."drives"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "public"."feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "college_id" UUID,
    "role" "public"."role_enum" NOT NULL,
    "page" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "feedback_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 6. Indexes & Trigram Search
CREATE INDEX "questions_text_hash_idx" ON "public"."questions"("text_hash");
CREATE INDEX "questions_stem_trgm_idx" ON "public"."questions" USING gin ("text_hash" gin_trgm_ops);
CREATE INDEX "questions_topic_id_idx" ON "public"."questions"("topic_id");
CREATE INDEX "questions_subtopic_id_idx" ON "public"."questions"("subtopic_id");
CREATE INDEX "questions_status_idx" ON "public"."questions"("status");
CREATE INDEX "questions_college_id_idx" ON "public"."questions"("college_id");

CREATE INDEX "test_templates_college_id_idx" ON "public"."test_templates"("college_id");
CREATE INDEX "test_templates_kind_idx" ON "public"."test_templates"("kind");
CREATE INDEX "test_templates_status_idx" ON "public"."test_templates"("status");

CREATE INDEX "test_schedules_college_id_idx" ON "public"."test_schedules"("college_id");
CREATE INDEX "test_schedules_template_id_idx" ON "public"."test_schedules"("template_id");

CREATE INDEX "attempts_student_id_idx" ON "public"."attempts"("student_id");
CREATE INDEX "attempts_college_id_idx" ON "public"."attempts"("college_id");
CREATE INDEX "attempts_template_id_idx" ON "public"."attempts"("template_id");
CREATE INDEX "attempts_schedule_id_idx" ON "public"."attempts"("schedule_id");
CREATE INDEX "attempts_status_idx" ON "public"."attempts"("status");

CREATE INDEX "attempt_items_attempt_id_idx" ON "public"."attempt_items"("attempt_id");
CREATE INDEX "attempt_items_college_id_idx" ON "public"."attempt_items"("college_id");
CREATE INDEX "attempt_items_question_id_idx" ON "public"."attempt_items"("question_id");

CREATE INDEX "attempt_events_attempt_id_idx" ON "public"."attempt_events"("attempt_id");
CREATE INDEX "attempt_events_college_id_idx" ON "public"."attempt_events"("college_id");

CREATE INDEX "student_topic_stats_student_id_idx" ON "public"."student_topic_stats"("student_id");
CREATE INDEX "student_topic_stats_college_id_idx" ON "public"."student_topic_stats"("college_id");
CREATE INDEX "student_topic_stats_topic_id_idx" ON "public"."student_topic_stats"("topic_id");

CREATE INDEX "readiness_snapshots_student_id_idx" ON "public"."readiness_snapshots"("student_id");
CREATE INDEX "readiness_snapshots_college_id_idx" ON "public"."readiness_snapshots"("college_id");
CREATE INDEX "readiness_snapshots_computed_at_idx" ON "public"."readiness_snapshots"("computed_at");

CREATE INDEX "roadmap_plans_student_id_idx" ON "public"."roadmap_plans"("student_id");
CREATE INDEX "roadmap_plans_college_id_idx" ON "public"."roadmap_plans"("college_id");
CREATE INDEX "roadmap_tasks_plan_id_idx" ON "public"."roadmap_tasks"("plan_id");
CREATE INDEX "roadmap_tasks_scheduled_date_idx" ON "public"."roadmap_tasks"("scheduled_date");
CREATE INDEX "feedback_user_id_idx" ON "public"."feedback"("user_id");

-- 7. Database Triggers (Immutability & Auto-Flagging)

-- Question Versions Immutability Trigger
CREATE OR REPLACE FUNCTION public.block_question_version_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'Security Refusal: question_versions rows are immutable and cannot be updated or deleted.';
END;
$$;

CREATE TRIGGER "question_versions_immutability_trigger"
BEFORE UPDATE OR DELETE ON "public"."question_versions"
FOR EACH ROW
EXECUTE FUNCTION public.block_question_version_mutation();

-- Question Reports Auto-Flag Trigger (>= 3 distinct reports)
CREATE OR REPLACE FUNCTION public.check_question_report_auto_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    distinct_reports INTEGER;
BEGIN
    SELECT COUNT(DISTINCT reporter_id) INTO distinct_reports
    FROM public.question_reports
    WHERE question_id = NEW.question_id;

    IF distinct_reports >= 3 THEN
        UPDATE public.questions
        SET status = 'FLAGGED', updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.question_id AND status != 'FLAGGED';
    END IF;

    UPDATE public.question_stats
    SET report_count = distinct_reports, updated_at = CURRENT_TIMESTAMP
    WHERE question_id = NEW.question_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "question_reports_auto_flag_trigger"
AFTER INSERT ON "public"."question_reports"
FOR EACH ROW
EXECUTE FUNCTION public.check_question_report_auto_flag();

-- Updated At Triggers
CREATE TRIGGER "set_question_groups_updated_at"
BEFORE UPDATE ON "public"."question_groups"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER "set_questions_updated_at"
BEFORE UPDATE ON "public"."questions"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER "set_test_templates_updated_at"
BEFORE UPDATE ON "public"."test_templates"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER "set_test_sections_updated_at"
BEFORE UPDATE ON "public"."test_sections"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER "set_test_schedules_updated_at"
BEFORE UPDATE ON "public"."test_schedules"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER "set_attempts_updated_at"
BEFORE UPDATE ON "public"."attempts"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER "set_student_topic_stats_updated_at"
BEFORE UPDATE ON "public"."student_topic_stats"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Row Level Security Activation
ALTER TABLE "public"."question_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."question_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."question_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."question_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."question_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."question_bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_section_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_section_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attempt_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attempt_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_topic_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."readiness_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roadmap_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roadmap_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies

-- Question Groups Policies
CREATE POLICY "question_groups_read" ON "public"."question_groups"
FOR SELECT USING (
    scope = 'GLOBAL'
    OR (college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "question_groups_manage_college" ON "public"."question_groups"
FOR ALL USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "question_groups_super_admin" ON "public"."question_groups"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Questions Policies
CREATE POLICY "questions_read" ON "public"."questions"
FOR SELECT USING (
    (scope = 'GLOBAL' AND (status = 'APPROVED' OR public.auth_user_role() = 'SUPER_ADMIN'))
    OR (college_id = public.auth_college_id() AND (status = 'APPROVED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "questions_college_admin_manage" ON "public"."questions"
FOR ALL USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "questions_super_admin" ON "public"."questions"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Question Versions Policies
CREATE POLICY "question_versions_read" ON "public"."question_versions"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.questions q
        WHERE q.id = question_versions.question_id
        AND (
            (q.scope = 'GLOBAL' AND (q.status = 'APPROVED' OR public.auth_user_role() = 'SUPER_ADMIN'))
            OR (q.college_id = public.auth_college_id() AND (q.status = 'APPROVED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
            OR public.auth_user_role() = 'SUPER_ADMIN'
        )
    )
);

CREATE POLICY "question_versions_insert" ON "public"."question_versions"
FOR INSERT WITH CHECK (
    public.auth_user_role() = 'SUPER_ADMIN'
    OR (
        public.auth_user_role() = 'COLLEGE_ADMIN'
        AND EXISTS (
            SELECT 1 FROM public.questions q
            WHERE q.id = question_versions.question_id
            AND q.college_id = public.auth_college_id()
        )
    )
);

-- Question Options Policies
CREATE POLICY "question_options_read" ON "public"."question_options"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.question_versions v
        JOIN public.questions q ON q.id = v.question_id
        WHERE v.id = question_options.version_id
        AND (
            (q.scope = 'GLOBAL' AND (q.status = 'APPROVED' OR public.auth_user_role() = 'SUPER_ADMIN'))
            OR (q.college_id = public.auth_college_id() AND (q.status = 'APPROVED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
            OR public.auth_user_role() = 'SUPER_ADMIN'
        )
    )
);

CREATE POLICY "question_options_insert" ON "public"."question_options"
FOR INSERT WITH CHECK (
    public.auth_user_role() = 'SUPER_ADMIN'
    OR (
        public.auth_user_role() = 'COLLEGE_ADMIN'
        AND EXISTS (
            SELECT 1 FROM public.question_versions v
            JOIN public.questions q ON q.id = v.question_id
            WHERE v.id = question_options.version_id
            AND q.college_id = public.auth_college_id()
        )
    )
);

-- Question Stats Policies
CREATE POLICY "question_stats_read" ON "public"."question_stats"
FOR SELECT USING (
    public.auth_user_role() IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
);

CREATE POLICY "question_stats_super_admin" ON "public"."question_stats"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Question Reports Policies
CREATE POLICY "question_reports_read" ON "public"."question_reports"
FOR SELECT USING (
    reporter_id = auth.uid()
    OR public.auth_user_role() IN ('SUPER_ADMIN', 'COLLEGE_ADMIN')
);

CREATE POLICY "question_reports_insert" ON "public"."question_reports"
FOR INSERT WITH CHECK (
    reporter_id = auth.uid()
);

CREATE POLICY "question_reports_super_admin" ON "public"."question_reports"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Question Bookmarks Policies
CREATE POLICY "question_bookmarks_student" ON "public"."question_bookmarks"
FOR ALL USING (
    student_id = auth.uid() AND college_id = public.auth_college_id()
) WITH CHECK (
    student_id = auth.uid() AND college_id = public.auth_college_id()
);

-- Test Templates Policies
CREATE POLICY "test_templates_read" ON "public"."test_templates"
FOR SELECT USING (
    (scope = 'GLOBAL' AND (status = 'PUBLISHED' OR public.auth_user_role() = 'SUPER_ADMIN'))
    OR (college_id = public.auth_college_id() AND (status = 'PUBLISHED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "test_templates_college_admin" ON "public"."test_templates"
FOR ALL USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "test_templates_super_admin" ON "public"."test_templates"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Test Sections & Rules & Questions Policies (Inherited from template)
CREATE POLICY "test_sections_read" ON "public"."test_sections"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.test_templates t
        WHERE t.id = test_sections.template_id
        AND (
            (t.scope = 'GLOBAL' AND (t.status = 'PUBLISHED' OR public.auth_user_role() = 'SUPER_ADMIN'))
            OR (t.college_id = public.auth_college_id() AND (t.status = 'PUBLISHED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
            OR public.auth_user_role() = 'SUPER_ADMIN'
        )
    )
);

CREATE POLICY "test_sections_super_admin" ON "public"."test_sections"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

CREATE POLICY "test_section_rules_read" ON "public"."test_section_rules"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.test_sections s
        JOIN public.test_templates t ON t.id = s.template_id
        WHERE s.id = test_section_rules.section_id
        AND (
            (t.scope = 'GLOBAL' AND (t.status = 'PUBLISHED' OR public.auth_user_role() = 'SUPER_ADMIN'))
            OR (t.college_id = public.auth_college_id() AND (t.status = 'PUBLISHED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
            OR public.auth_user_role() = 'SUPER_ADMIN'
        )
    )
);

CREATE POLICY "test_section_rules_super_admin" ON "public"."test_section_rules"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

CREATE POLICY "test_section_questions_read" ON "public"."test_section_questions"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.test_sections s
        JOIN public.test_templates t ON t.id = s.template_id
        WHERE s.id = test_section_questions.section_id
        AND (
            (t.scope = 'GLOBAL' AND (t.status = 'PUBLISHED' OR public.auth_user_role() = 'SUPER_ADMIN'))
            OR (t.college_id = public.auth_college_id() AND (t.status = 'PUBLISHED' OR public.auth_user_role() = 'COLLEGE_ADMIN'))
            OR public.auth_user_role() = 'SUPER_ADMIN'
        )
    )
);

CREATE POLICY "test_section_questions_super_admin" ON "public"."test_section_questions"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Test Schedules Policies
CREATE POLICY "test_schedules_read" ON "public"."test_schedules"
FOR SELECT USING (
    college_id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "test_schedules_college_admin" ON "public"."test_schedules"
FOR ALL USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
) WITH CHECK (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "test_schedules_super_admin" ON "public"."test_schedules"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Attempts Policies
CREATE POLICY "attempts_student" ON "public"."attempts"
FOR ALL USING (
    student_id = auth.uid() AND college_id = public.auth_college_id()
) WITH CHECK (
    student_id = auth.uid() AND college_id = public.auth_college_id()
);

CREATE POLICY "attempts_college_admin_read" ON "public"."attempts"
FOR SELECT USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "attempts_super_admin" ON "public"."attempts"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Attempt Items Policies
CREATE POLICY "attempt_items_student" ON "public"."attempt_items"
FOR ALL USING (
    college_id = public.auth_college_id()
    AND EXISTS (
        SELECT 1 FROM public.attempts a
        WHERE a.id = attempt_items.attempt_id
        AND a.student_id = auth.uid()
    )
) WITH CHECK (
    college_id = public.auth_college_id()
    AND EXISTS (
        SELECT 1 FROM public.attempts a
        WHERE a.id = attempt_items.attempt_id
        AND a.student_id = auth.uid()
    )
);

CREATE POLICY "attempt_items_college_admin_read" ON "public"."attempt_items"
FOR SELECT USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "attempt_items_super_admin" ON "public"."attempt_items"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Attempt Events Policies
CREATE POLICY "attempt_events_student_insert" ON "public"."attempt_events"
FOR INSERT WITH CHECK (
    college_id = public.auth_college_id()
    AND EXISTS (
        SELECT 1 FROM public.attempts a
        WHERE a.id = attempt_events.attempt_id
        AND a.student_id = auth.uid()
    )
);

CREATE POLICY "attempt_events_college_admin_read" ON "public"."attempt_events"
FOR SELECT USING (
    (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "attempt_events_super_admin" ON "public"."attempt_events"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Student Topic Stats Policies
CREATE POLICY "student_topic_stats_student" ON "public"."student_topic_stats"
FOR ALL USING (
    student_id = auth.uid() AND college_id = public.auth_college_id()
) WITH CHECK (
    student_id = auth.uid() AND college_id = public.auth_college_id()
);

CREATE POLICY "student_topic_stats_college_admin_read" ON "public"."student_topic_stats"
FOR SELECT USING (
    public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id()
);

CREATE POLICY "student_topic_stats_super_admin" ON "public"."student_topic_stats"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Readiness Snapshots Policies (Consented performance sharing)
CREATE POLICY "readiness_snapshots_student" ON "public"."readiness_snapshots"
FOR ALL USING (
    student_id = auth.uid() AND college_id = public.auth_college_id()
) WITH CHECK (
    student_id = auth.uid() AND college_id = public.auth_college_id()
);

CREATE POLICY "readiness_snapshots_college_admin_read" ON "public"."readiness_snapshots"
FOR SELECT USING (
    public.auth_user_role() = 'COLLEGE_ADMIN'
    AND college_id = public.auth_college_id()
    AND EXISTS (
        SELECT 1 FROM public.consent_records c
        WHERE c.user_id = readiness_snapshots.student_id
        AND c.consent_type = 'PERFORMANCE_SHARING'
        AND c.granted = true
    )
);

CREATE POLICY "readiness_snapshots_super_admin" ON "public"."readiness_snapshots"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Roadmap Plans & Tasks Policies
CREATE POLICY "roadmap_plans_student" ON "public"."roadmap_plans"
FOR ALL USING (
    student_id = auth.uid() AND college_id = public.auth_college_id()
) WITH CHECK (
    student_id = auth.uid() AND college_id = public.auth_college_id()
);

CREATE POLICY "roadmap_plans_super_admin" ON "public"."roadmap_plans"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

CREATE POLICY "roadmap_tasks_student" ON "public"."roadmap_tasks"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.roadmap_plans p
        WHERE p.id = roadmap_tasks.plan_id
        AND p.student_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.roadmap_plans p
        WHERE p.id = roadmap_tasks.plan_id
        AND p.student_id = auth.uid()
    )
);

CREATE POLICY "roadmap_tasks_super_admin" ON "public"."roadmap_tasks"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Feedback Policies
CREATE POLICY "feedback_insert" ON "public"."feedback"
FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "feedback_super_admin" ON "public"."feedback"
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
