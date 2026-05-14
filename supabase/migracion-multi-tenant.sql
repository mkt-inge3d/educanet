-- ════════════════════════════════════════════════════════════════════════════
-- Migración multi-tenant Educanet — MVP
-- Aplicar contra DIRECT_URL (no pooler). Idempotente para reintento.
-- Objetivos:
--   1. Crear models Organization, OrganizationMember, OrigenExterno
--   2. Agregar organizationId a User, CatalogoTarea, WorkflowPlantilla,
--      WorkflowInstancia, TareaInstancia
--   3. Backfill: crear org "Semco" y asignar todos los registros existentes
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 0. Enums nuevos ──────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "RolOrg" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PlanOrg" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 1. Organization ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Organization" (
  "id"            TEXT PRIMARY KEY,
  "slug"          TEXT NOT NULL UNIQUE,
  "nombre"        TEXT NOT NULL,
  "plan"          "PlanOrg" NOT NULL DEFAULT 'STARTER',
  "webhookSecret" TEXT,
  "activa"        BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "Organization_slug_idx" ON "Organization"("slug");

-- Insertar la org por defecto (Semco) si no existe
INSERT INTO "Organization" ("id", "slug", "nombre", "plan", "updatedAt")
VALUES ('org_semco_default', 'semco', 'Semco', 'ENTERPRISE', NOW())
ON CONFLICT ("id") DO NOTHING;

-- ─── 2. OrganizationMember ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id"             TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "rol"            "RolOrg" NOT NULL DEFAULT 'MEMBER',
  "esPrincipal"    BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMember_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "OrganizationMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_organizationId_userId_key"
  ON "OrganizationMember"("organizationId", "userId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_idx"
  ON "OrganizationMember"("userId");

-- ─── 3. User: agregar organizationId + currentOrgId ───────────────────────────
DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "User" ADD COLUMN "currentOrgId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

UPDATE "User"
SET "organizationId" = 'org_semco_default',
    "currentOrgId"   = 'org_semco_default'
WHERE "organizationId" IS NULL;

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");

-- Crear OrganizationMember para todos los usuarios existentes (idempotente)
INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "rol", "esPrincipal")
SELECT
  'om_' || u."id",
  'org_semco_default',
  u."id",
  CASE WHEN u."rol" = 'ADMIN' THEN 'OWNER'::"RolOrg" ELSE 'MEMBER'::"RolOrg" END,
  TRUE
FROM "User" u
ON CONFLICT ("organizationId", "userId") DO NOTHING;

-- ─── 4. CatalogoTarea ─────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "CatalogoTarea" ADD COLUMN "organizationId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

UPDATE "CatalogoTarea" SET "organizationId" = 'org_semco_default'
WHERE "organizationId" IS NULL;

ALTER TABLE "CatalogoTarea" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "CatalogoTarea" ADD CONSTRAINT "CatalogoTarea_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Cambiar unique global de codigo → compuesto (org, codigo)
DO $$ BEGIN
  ALTER TABLE "CatalogoTarea" DROP CONSTRAINT IF EXISTS "CatalogoTarea_codigo_key";
EXCEPTION WHEN undefined_object THEN NULL; END $$;
DROP INDEX IF EXISTS "CatalogoTarea_codigo_key";

CREATE UNIQUE INDEX IF NOT EXISTS "CatalogoTarea_organizationId_codigo_key"
  ON "CatalogoTarea"("organizationId", "codigo");

DROP INDEX IF EXISTS "CatalogoTarea_categoria_activa_idx";
CREATE INDEX IF NOT EXISTS "CatalogoTarea_organizationId_categoria_activa_idx"
  ON "CatalogoTarea"("organizationId", "categoria", "activa");

-- ─── 5. WorkflowPlantilla ─────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "WorkflowPlantilla" ADD COLUMN "organizationId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

UPDATE "WorkflowPlantilla" SET "organizationId" = 'org_semco_default'
WHERE "organizationId" IS NULL;

ALTER TABLE "WorkflowPlantilla" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "WorkflowPlantilla" ADD CONSTRAINT "WorkflowPlantilla_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowPlantilla" DROP CONSTRAINT IF EXISTS "WorkflowPlantilla_codigo_key";
EXCEPTION WHEN undefined_object THEN NULL; END $$;
DROP INDEX IF EXISTS "WorkflowPlantilla_codigo_key";

CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowPlantilla_organizationId_codigo_key"
  ON "WorkflowPlantilla"("organizationId", "codigo");

CREATE INDEX IF NOT EXISTS "WorkflowPlantilla_organizationId_categoria_activo_idx"
  ON "WorkflowPlantilla"("organizationId", "categoria", "activo");

-- ─── 6. WorkflowInstancia ─────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "WorkflowInstancia" ADD COLUMN "organizationId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

UPDATE "WorkflowInstancia" SET "organizationId" = 'org_semco_default'
WHERE "organizationId" IS NULL;

ALTER TABLE "WorkflowInstancia" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "WorkflowInstancia" ADD CONSTRAINT "WorkflowInstancia_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP INDEX IF EXISTS "WorkflowInstancia_fechaHito_estadoGeneral_idx";
CREATE INDEX IF NOT EXISTS "WorkflowInstancia_organizationId_fechaHito_estadoGeneral_idx"
  ON "WorkflowInstancia"("organizationId", "fechaHito", "estadoGeneral");

-- ─── 7. TareaInstancia ────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "TareaInstancia" ADD COLUMN "organizationId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

UPDATE "TareaInstancia" SET "organizationId" = 'org_semco_default'
WHERE "organizationId" IS NULL;

ALTER TABLE "TareaInstancia" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "TareaInstancia" ADD CONSTRAINT "TareaInstancia_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "TareaInstancia_organizationId_asignadoAId_estado_idx"
  ON "TareaInstancia"("organizationId", "asignadoAId", "estado");

-- ─── 8. OrigenExterno ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "OrigenExterno" (
  "id"                  TEXT PRIMARY KEY,
  "organizationId"      TEXT NOT NULL,
  "sourceApp"           TEXT NOT NULL,
  "sourceProjectId"     TEXT NOT NULL,
  "workflowInstanciaId" TEXT UNIQUE,
  "recibidoEn"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload"             JSONB NOT NULL,
  "procesadoOk"         BOOLEAN NOT NULL DEFAULT TRUE,
  "errorMensaje"        TEXT,
  CONSTRAINT "OrigenExterno_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "OrigenExterno_workflowInstanciaId_fkey"
    FOREIGN KEY ("workflowInstanciaId") REFERENCES "WorkflowInstancia"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrigenExterno_organizationId_sourceApp_sourceProjectId_key"
  ON "OrigenExterno"("organizationId", "sourceApp", "sourceProjectId");
CREATE INDEX IF NOT EXISTS "OrigenExterno_organizationId_sourceApp_idx"
  ON "OrigenExterno"("organizationId", "sourceApp");

COMMIT;

-- ─── Verificación post-migración (opcional, correr aparte) ────────────────────
-- SELECT 'User sin org' AS check, COUNT(*) FROM "User" WHERE "organizationId" IS NULL
-- UNION ALL
-- SELECT 'Plantillas sin org', COUNT(*) FROM "WorkflowPlantilla" WHERE "organizationId" IS NULL
-- UNION ALL
-- SELECT 'Instancias sin org', COUNT(*) FROM "WorkflowInstancia" WHERE "organizationId" IS NULL
-- UNION ALL
-- SELECT 'Tareas sin org', COUNT(*) FROM "TareaInstancia" WHERE "organizationId" IS NULL
-- UNION ALL
-- SELECT 'Catalogo sin org', COUNT(*) FROM "CatalogoTarea" WHERE "organizationId" IS NULL
-- UNION ALL
-- SELECT 'Users sin membership', COUNT(*) FROM "User" u
--   LEFT JOIN "OrganizationMember" om ON om."userId" = u."id"
--   WHERE om."id" IS NULL;
