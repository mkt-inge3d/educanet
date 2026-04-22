-- ============================================================================
-- Educanet — Politicas de Storage
-- ============================================================================
-- Aplicar despues de crear los buckets "certificados" y "avatares"
-- en Supabase Dashboard > Storage.
-- ============================================================================

-- BUCKET: certificados (privado)
-- Path: certificados/{userId}/{certificadoId}.pdf

CREATE POLICY "Usuarios pueden ver sus propios certificados"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificados'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin_or_rrhh()
  )
);

-- BUCKET: avatares (publico para lectura)

CREATE POLICY "Cualquiera puede ver avatares"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatares');

CREATE POLICY "Usuarios pueden subir su propio avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatares'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuarios pueden actualizar su propio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatares'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuarios pueden borrar su propio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatares'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- BUCKET: kpi-evidencias (privado)
-- Path: kpi-evidencias/{userId}/{instanciaId}.{ext}
-- Subir solo el dueño. Leer el dueño + admin/RRHH/jefe (jefe via service role).

CREATE POLICY "Usuarios pueden subir su propia evidencia KPI"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kpi-evidencias'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuarios pueden actualizar su propia evidencia KPI"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kpi-evidencias'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuarios pueden ver su propia evidencia KPI"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kpi-evidencias'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin_or_rrhh()
  )
);
-- Nota: El visor del jefe usa URL firmada generada con SERVICE_ROLE,
-- por eso no es necesario una policy explicita para "jefe del area".
