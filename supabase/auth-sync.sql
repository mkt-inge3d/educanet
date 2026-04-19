-- ============================================================================
-- Educanet — Sincronizacion Supabase Auth ↔ tabla "User" de Prisma
-- ============================================================================
--
-- CUANDO APLICAR:
--   Antes de crear usuarios en Supabase Auth. Ejecutar ANTES de
--   rls-policies.sql (este archivo crea las funciones helper que
--   las politicas RLS necesitan).
--
-- COMO APLICAR:
--   1. Abrir Supabase Dashboard → SQL Editor → New query
--   2. Pegar todo este archivo (excepto el bloque final de backfill)
--   3. Ejecutar (Run)
--   4. Verificar que aparezca "Success. No rows returned"
--
-- DECISION DE DISENO:
--   - El id de "User" es el UUID de auth.users (no cuid)
--   - Al borrar un usuario de auth, lo marcamos como activo=false
--     en "User" en lugar de eliminarlo. Esto preserva historico de
--     progreso, certificados y metricas para reportes.
--   - El rol se guarda tanto en "User".rol como en
--     auth.users.raw_user_meta_data.rol para poder leerlo en el
--     middleware sin consultar la DB.
-- ============================================================================

-- ─── 1.1 Funcion: crear User al registrarse en Auth ────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" (
    id,
    email,
    nombre,
    apellido,
    rol,
    "areaId",
    "puestoId",
    activo,
    "createdAt",
    "updatedAt"
  ) VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Sin nombre'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    'TRABAJADOR',
    NULLIF(NEW.raw_user_meta_data->>'areaId', ''),
    NULLIF(NEW.raw_user_meta_data->>'puestoId', ''),
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Trigger: se dispara despues de insertar en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── 1.2 Funcion: sincronizar cambios en Auth ──────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sincronizar email si cambio
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public."User"
    SET email = NEW.email, "updatedAt" = NOW()
    WHERE id = NEW.id::text;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_updated();

-- ─── 1.3 Funcion: desactivar User al borrar de Auth ────────────────────────
-- Nota: no eliminamos el registro para preservar historico de progreso,
-- certificados y metricas. Solo marcamos activo=false.

CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public."User"
  SET activo = false, "updatedAt" = NOW()
  WHERE id = OLD.id::text;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deleted();

-- ─── 1.4 Helper: obtener rol del usuario autenticado ────────────────────────
-- Usado por las politicas RLS. SECURITY DEFINER para leer "User"
-- saltandose RLS. STABLE para caching dentro de la misma query.

CREATE OR REPLACE FUNCTION public.current_user_rol()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol::text FROM public."User"
  WHERE id = auth.uid()::text;
$$;

-- ─── 1.5 Helper: verificar si el usuario es admin o RRHH ───────────────────

CREATE OR REPLACE FUNCTION public.is_admin_or_rrhh()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = auth.uid()::text
    AND rol IN ('ADMIN', 'RRHH')
  );
$$;

-- ============================================================================
-- BACKFILL DE USUARIOS SEED
-- ============================================================================
--
-- ESTRATEGIA ELEGIDA: Borrar los usuarios seed de "User" y crearlos
-- desde cero via Supabase Auth, dejando que el trigger los cree
-- automaticamente en "User". Luego correr seed-post-auth.ts para
-- completar datos (puesto, area, puntos, progreso, etc.).
--
-- PASOS (ejecutar en orden):
--
-- 1. Borrar datos derivados de los usuarios seed (progreso, badges, etc.)
--    y luego los usuarios mismos. Ejecutar este bloque SOLO si los seeds
--    del Prompt 2 ya fueron aplicados:
--
--    DELETE FROM public."Notificacion" WHERE "userId" LIKE 'seed-%';
--    DELETE FROM public."MetricaDesempeno" WHERE "userId" LIKE 'seed-%';
--    DELETE FROM public."UserBadge" WHERE "userId" LIKE 'seed-%';
--    DELETE FROM public."TransaccionPuntos" WHERE "userId" LIKE 'seed-%';
--    DELETE FROM public."ProgresoLeccion" WHERE "userId" LIKE 'seed-%';
--    DELETE FROM public."LeccionNota" WHERE "userId" LIKE 'seed-%';
--    DELETE FROM public."IntentoQuiz" WHERE "userId" LIKE 'seed-%';
--    DELETE FROM public."Certificado" WHERE "userId" LIKE 'seed-%';
--    DELETE FROM public."User" WHERE id LIKE 'seed-%';
--
-- 2. Crear los usuarios en Supabase Auth desde el dashboard:
--    Authentication → Users → Add user → Create new user
--    Marcar "Auto Confirm User" para cada uno.
--
--    | Email                          | Password      |
--    |--------------------------------|---------------|
--    | admin@educanet.local           | educanet2026  |
--    | jefe.marketing@educanet.local  | educanet2026  |
--    | ana.garcia@educanet.local      | educanet2026  |
--    | carlos.lopez@educanet.local    | educanet2026  |
--    | maria.torres@educanet.local    | educanet2026  |
--
--    IMPORTANTE: al crearlos desde el dashboard NO se pasa metadata
--    (nombre/apellido), asi que el trigger insertara 'Sin nombre'.
--    El script seed-post-auth.ts corregira esto.
--
-- 3. Asignar roles admin en user_metadata (SQL Editor):
--
--    UPDATE auth.users
--    SET raw_user_meta_data = raw_user_meta_data || '{"rol": "ADMIN"}'::jsonb
--    WHERE email IN ('admin@educanet.local', 'jefe.marketing@educanet.local');
--
--    UPDATE auth.users
--    SET raw_user_meta_data = raw_user_meta_data || '{"rol": "TRABAJADOR"}'::jsonb
--    WHERE email IN (
--      'ana.garcia@educanet.local',
--      'carlos.lopez@educanet.local',
--      'maria.torres@educanet.local'
--    );
--
-- 4. Correr en terminal: npm run db:seed-post-auth
--    Esto asigna puestos, areas, puntos, progresos, badges, etc.
-- ============================================================================
