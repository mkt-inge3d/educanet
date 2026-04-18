-- ============================================================================
-- Educanet — Row Level Security Policies
-- ============================================================================
--
-- CUANDO APLICAR:
--   En el Prompt 3, una vez que Supabase Auth este conectado con la tabla User
--   mediante un trigger que sincronice auth.users → public."User".
--
-- COMO APLICAR:
--   1. Abrir el SQL Editor en Supabase Dashboard
--   2. Pegar este archivo completo
--   3. Ejecutar
--   4. Verificar en Database → Policies que las politicas aparezcan
--
-- IMPORTANTE:
--   - El id de User coincide con auth.uid() (se configura en Prompt 3)
--   - Prisma usa nombres de tabla con mayuscula inicial (ej. "User", "Curso")
--   - Las comillas dobles son necesarias para tablas con mayusculas
-- ============================================================================

-- ─── Helper function: obtener rol del usuario autenticado ───────────────────

CREATE OR REPLACE FUNCTION public.current_user_rol()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT rol::text FROM public."User" WHERE id = auth.uid()::text;
$$;

-- ─── Helper: verificar si el usuario es admin o RRHH ────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin_or_rrhh()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = auth.uid()::text
    AND rol IN ('ADMIN', 'RRHH')
  );
$$;

-- ============================================================================
-- ENABLE RLS en todas las tablas
-- ============================================================================

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Area" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Puesto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RutaCarrera" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RutaCarreraCurso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RutaCarreraMetrica" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Curso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Modulo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Leccion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RecursoLeccion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeccionNota" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProgresoLeccion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pregunta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OpcionRespuesta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IntentoQuiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Badge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserBadge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TransaccionPuntos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Certificado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MetricaDesempeno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notificacion" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER — Perfil del usuario
-- ============================================================================

-- Cada usuario ve su propio perfil; admin/rrhh ven todos
CREATE POLICY "user_select_own_or_admin" ON public."User"
  FOR SELECT USING (
    id = auth.uid()::text OR public.is_admin_or_rrhh()
  );

-- Solo el usuario puede actualizar sus datos basicos (no rol, puesto, area)
CREATE POLICY "user_update_own" ON public."User"
  FOR UPDATE USING (id = auth.uid()::text)
  WITH CHECK (
    id = auth.uid()::text
    -- Proteger campos sensibles: solo admin/rrhh pueden cambiar rol, puesto, area
    AND (
      (rol = (SELECT rol FROM public."User" WHERE id = auth.uid()::text))
      OR public.is_admin_or_rrhh()
    )
    AND (
      ("puestoId" = (SELECT "puestoId" FROM public."User" WHERE id = auth.uid()::text))
      OR public.is_admin_or_rrhh()
    )
    AND (
      ("areaId" = (SELECT "areaId" FROM public."User" WHERE id = auth.uid()::text))
      OR public.is_admin_or_rrhh()
    )
  );

-- Admin/RRHH puede actualizar cualquier usuario
CREATE POLICY "user_update_admin" ON public."User"
  FOR UPDATE USING (public.is_admin_or_rrhh());

-- Insert solo via service role (trigger de auth o backend)
CREATE POLICY "user_insert_service" ON public."User"
  FOR INSERT WITH CHECK (false);
  -- El service role bypasea RLS, asi que esto bloquea insert via anon/authenticated

-- ============================================================================
-- PROGRESO LECCION — Cada usuario ve y modifica su propio progreso
-- ============================================================================

CREATE POLICY "progreso_select_own_or_admin" ON public."ProgresoLeccion"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR public.is_admin_or_rrhh()
  );

CREATE POLICY "progreso_insert_own" ON public."ProgresoLeccion"
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "progreso_update_own" ON public."ProgresoLeccion"
  FOR UPDATE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- INTENTO QUIZ — Cada usuario ve y crea sus propios intentos
-- ============================================================================

CREATE POLICY "intento_select_own_or_admin" ON public."IntentoQuiz"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR public.is_admin_or_rrhh()
  );

CREATE POLICY "intento_insert_own" ON public."IntentoQuiz"
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- LECCION NOTA — Notas personales del usuario
-- ============================================================================

CREATE POLICY "nota_select_own_or_admin" ON public."LeccionNota"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR public.is_admin_or_rrhh()
  );

CREATE POLICY "nota_insert_own" ON public."LeccionNota"
  FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "nota_update_own" ON public."LeccionNota"
  FOR UPDATE USING ("userId" = auth.uid()::text);

CREATE POLICY "nota_delete_own" ON public."LeccionNota"
  FOR DELETE USING ("userId" = auth.uid()::text);

-- ============================================================================
-- TRANSACCION PUNTOS — Solo lectura para el usuario; admin puede insertar
-- ============================================================================

CREATE POLICY "transaccion_select_own_or_admin" ON public."TransaccionPuntos"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR public.is_admin_or_rrhh()
  );

CREATE POLICY "transaccion_insert_admin" ON public."TransaccionPuntos"
  FOR INSERT WITH CHECK (public.is_admin_or_rrhh());
  -- Tambien se inserta via service role desde la logica de negocio

-- ============================================================================
-- CERTIFICADO — El usuario ve los suyos; admin ve todos
-- ============================================================================

CREATE POLICY "certificado_select_own_or_admin" ON public."Certificado"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR public.is_admin_or_rrhh()
  );

CREATE POLICY "certificado_insert_service" ON public."Certificado"
  FOR INSERT WITH CHECK (false);
  -- Solo via service role (backend genera certificados)

-- ============================================================================
-- NOTIFICACION — El usuario ve y marca como leida las suyas
-- ============================================================================

CREATE POLICY "notificacion_select_own" ON public."Notificacion"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "notificacion_update_own" ON public."Notificacion"
  FOR UPDATE USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);
  -- Solo puede marcar como leida

-- ============================================================================
-- METRICA DESEMPENO — El usuario ve las suyas; solo admin/rrhh modifica
-- ============================================================================

CREATE POLICY "metrica_select_own_or_admin" ON public."MetricaDesempeno"
  FOR SELECT USING (
    "userId" = auth.uid()::text OR public.is_admin_or_rrhh()
  );

CREATE POLICY "metrica_insert_admin" ON public."MetricaDesempeno"
  FOR INSERT WITH CHECK (public.is_admin_or_rrhh());

CREATE POLICY "metrica_update_admin" ON public."MetricaDesempeno"
  FOR UPDATE USING (public.is_admin_or_rrhh());

CREATE POLICY "metrica_delete_admin" ON public."MetricaDesempeno"
  FOR DELETE USING (public.is_admin_or_rrhh());

-- ============================================================================
-- BADGE — Todos los autenticados pueden ver; solo admin modifica
-- ============================================================================

CREATE POLICY "badge_select_authenticated" ON public."Badge"
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "badge_modify_admin" ON public."Badge"
  FOR ALL USING (public.is_admin_or_rrhh());

-- ============================================================================
-- USER BADGE — Todos los autenticados pueden ver; solo admin/service role otorga
-- ============================================================================

CREATE POLICY "userbadge_select_authenticated" ON public."UserBadge"
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "userbadge_insert_service" ON public."UserBadge"
  FOR INSERT WITH CHECK (false);
  -- Solo via service role (logica de gamificacion)

-- ============================================================================
-- CURSO — Trabajadores solo ven publicados; admin ve todos y modifica
-- ============================================================================

CREATE POLICY "curso_select_published_or_admin" ON public."Curso"
  FOR SELECT USING (
    publicado = true OR public.is_admin_or_rrhh()
  );

CREATE POLICY "curso_insert_admin" ON public."Curso"
  FOR INSERT WITH CHECK (public.is_admin_or_rrhh());

CREATE POLICY "curso_update_admin" ON public."Curso"
  FOR UPDATE USING (public.is_admin_or_rrhh());

CREATE POLICY "curso_delete_admin" ON public."Curso"
  FOR DELETE USING (public.is_admin_or_rrhh());

-- ============================================================================
-- MODULO, LECCION, QUIZ, PREGUNTA, OPCION, RECURSO
-- Todos los autenticados pueden leer; solo admin modifica
-- ============================================================================

-- Modulo
CREATE POLICY "modulo_select_authenticated" ON public."Modulo"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "modulo_modify_admin" ON public."Modulo"
  FOR ALL USING (public.is_admin_or_rrhh());

-- Leccion
CREATE POLICY "leccion_select_authenticated" ON public."Leccion"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "leccion_modify_admin" ON public."Leccion"
  FOR ALL USING (public.is_admin_or_rrhh());

-- Quiz
CREATE POLICY "quiz_select_authenticated" ON public."Quiz"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "quiz_modify_admin" ON public."Quiz"
  FOR ALL USING (public.is_admin_or_rrhh());

-- Pregunta
CREATE POLICY "pregunta_select_authenticated" ON public."Pregunta"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "pregunta_modify_admin" ON public."Pregunta"
  FOR ALL USING (public.is_admin_or_rrhh());

-- OpcionRespuesta
CREATE POLICY "opcion_select_authenticated" ON public."OpcionRespuesta"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "opcion_modify_admin" ON public."OpcionRespuesta"
  FOR ALL USING (public.is_admin_or_rrhh());

-- RecursoLeccion
CREATE POLICY "recurso_select_authenticated" ON public."RecursoLeccion"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "recurso_modify_admin" ON public."RecursoLeccion"
  FOR ALL USING (public.is_admin_or_rrhh());

-- ============================================================================
-- AREA, PUESTO, RUTA CARRERA y tablas relacionadas
-- Todos los autenticados pueden leer; solo admin/rrhh modifica
-- ============================================================================

-- Area
CREATE POLICY "area_select_authenticated" ON public."Area"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "area_modify_admin" ON public."Area"
  FOR ALL USING (public.is_admin_or_rrhh());

-- Puesto
CREATE POLICY "puesto_select_authenticated" ON public."Puesto"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "puesto_modify_admin" ON public."Puesto"
  FOR ALL USING (public.is_admin_or_rrhh());

-- RutaCarrera
CREATE POLICY "ruta_select_authenticated" ON public."RutaCarrera"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ruta_modify_admin" ON public."RutaCarrera"
  FOR ALL USING (public.is_admin_or_rrhh());

-- RutaCarreraCurso
CREATE POLICY "rutacurso_select_authenticated" ON public."RutaCarreraCurso"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rutacurso_modify_admin" ON public."RutaCarreraCurso"
  FOR ALL USING (public.is_admin_or_rrhh());

-- RutaCarreraMetrica
CREATE POLICY "rutametrica_select_authenticated" ON public."RutaCarreraMetrica"
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rutametrica_modify_admin" ON public."RutaCarreraMetrica"
  FOR ALL USING (public.is_admin_or_rrhh());

-- ============================================================================
-- COMENTARIO / LIKE / REPORTE (Prompt 14)
-- ============================================================================

ALTER TABLE public."Comentario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ComentarioLike" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ReporteComentario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CursoRelacionado" ENABLE ROW LEVEL SECURITY;

-- Comentario
CREATE POLICY "comentarios_select_publico" ON public."Comentario"
  FOR SELECT TO authenticated
  USING (oculto = false OR public.current_user_rol() IN ('ADMIN', 'RRHH'));

CREATE POLICY "comentarios_insert_autenticado" ON public."Comentario"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "comentarios_update_propio_o_admin" ON public."Comentario"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = "userId" OR public.current_user_rol() IN ('ADMIN', 'RRHH'));

CREATE POLICY "comentarios_delete_propio_o_admin" ON public."Comentario"
  FOR DELETE TO authenticated
  USING (auth.uid()::text = "userId" OR public.current_user_rol() IN ('ADMIN', 'RRHH'));

-- ComentarioLike
CREATE POLICY "likes_select_publico" ON public."ComentarioLike"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "likes_manage_propio" ON public."ComentarioLike"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- ReporteComentario
CREATE POLICY "reportes_select_admin_o_propio" ON public."ReporteComentario"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = "reportadorId" OR public.current_user_rol() IN ('ADMIN', 'RRHH'));

CREATE POLICY "reportes_insert_autenticado" ON public."ReporteComentario"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = "reportadorId");

CREATE POLICY "reportes_update_admin" ON public."ReporteComentario"
  FOR UPDATE TO authenticated
  USING (public.current_user_rol() IN ('ADMIN', 'RRHH'));

-- CursoRelacionado
CREATE POLICY "cursos_relacionados_select" ON public."CursoRelacionado"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cursos_relacionados_admin" ON public."CursoRelacionado"
  FOR ALL TO authenticated
  USING (public.current_user_rol() = 'ADMIN');
