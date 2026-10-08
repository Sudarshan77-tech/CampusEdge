-- CreateEnum
CREATE TYPE "public"."role_enum" AS ENUM ('STUDENT', 'COLLEGE_ADMIN', 'SUPER_ADMIN');
CREATE TYPE "public"."college_status_enum" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateTable colleges
CREATE TABLE "public"."colleges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "status" "public"."college_status_enum" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable user_profiles
CREATE TABLE "public"."user_profiles" (
    "id" UUID NOT NULL,
    "college_id" UUID,
    "role" "public"."role_enum" NOT NULL DEFAULT 'STUDENT',
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable audit_logs
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "college_id" UUID,
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colleges_slug_key" ON "public"."colleges"("slug");
CREATE UNIQUE INDEX "user_profiles_email_key" ON "public"."user_profiles"("email");
CREATE INDEX "user_profiles_college_id_idx" ON "public"."user_profiles"("college_id");
CREATE INDEX "audit_logs_college_id_idx" ON "public"."audit_logs"("college_id");
CREATE INDEX "audit_logs_actor_id_idx" ON "public"."audit_logs"("actor_id");

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- Helper Functions & Triggers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_colleges_updated_at
BEFORE UPDATE ON "public"."colleges"
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON "public"."user_profiles"
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text AS $$
    SELECT coalesce(
        auth.jwt() -> 'app_metadata' ->> 'role',
        (SELECT role::text FROM public.user_profiles WHERE id = auth.uid()),
        ''
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_college_id()
RETURNS uuid AS $$
    SELECT coalesce(
        (auth.jwt() -> 'app_metadata' ->> 'college_id')::uuid,
        (SELECT college_id FROM public.user_profiles WHERE id = auth.uid()),
        NULL
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."colleges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

-- Colleges Policies
CREATE POLICY "colleges_read_policy" ON "public"."colleges"
FOR SELECT USING (
    id = public.auth_college_id()
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "colleges_super_admin_manage" ON "public"."colleges"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- User Profiles Policies
CREATE POLICY "user_profiles_self_read" ON "public"."user_profiles"
FOR SELECT USING (id = auth.uid() OR public.auth_user_role() = 'SUPER_ADMIN');

CREATE POLICY "user_profiles_self_update" ON "public"."user_profiles"
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_college_admin_read" ON "public"."user_profiles"
FOR SELECT USING (
    (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

CREATE POLICY "user_profiles_super_admin_all" ON "public"."user_profiles"
FOR ALL USING (public.auth_user_role() = 'SUPER_ADMIN')
WITH CHECK (public.auth_user_role() = 'SUPER_ADMIN');

-- Audit Logs Policies
CREATE POLICY "audit_logs_insert" ON "public"."audit_logs"
FOR INSERT WITH CHECK (true);

CREATE POLICY "audit_logs_read" ON "public"."audit_logs"
FOR SELECT USING (
    (public.auth_user_role() = 'COLLEGE_ADMIN' AND college_id = public.auth_college_id())
    OR public.auth_user_role() = 'SUPER_ADMIN'
);

-- Auth User Signup Sync Function and Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role, college_id)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Student User'),
        coalesce((new.raw_app_meta_data->>'role')::public.role_enum, 'STUDENT'::public.role_enum),
        (new.raw_app_meta_data->>'college_id')::uuid
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;
