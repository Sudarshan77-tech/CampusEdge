-- =============================================================================
-- Migration: 20261009025000_phase3_enums
-- Add new values to existing enums for Phase 3 (Committed prior to usage)
-- =============================================================================

ALTER TYPE "public"."consent_type_enum" ADD VALUE IF NOT EXISTS 'PERFORMANCE_SHARING';
ALTER TYPE "public"."import_job_type_enum" ADD VALUE IF NOT EXISTS 'QUESTIONS';
