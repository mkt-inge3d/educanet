# Checklist pre-deploy

## Supabase
- [ ] Proyecto creado
- [ ] SQLs aplicados: auth-sync.sql, rls-policies.sql, storage-policies.sql
- [ ] Buckets creados: certificados (privado), avatares (publico), cursos (publico), kpi-evidencias (privado)
- [ ] Usuarios iniciales creados con roles asignados
- [ ] Auth Settings: Site URL y Redirect URLs actualizados al dominio de produccion
- [ ] Replication activado para tabla Notificacion (realtime)

## Vercel
- [ ] Proyecto conectado al repo
- [ ] Variables de entorno configuradas (Production + Preview)
- [ ] Build pasa en preview
- [ ] Dominio custom configurado

## Bunny Stream (opcional)
- [ ] Libreria creada
- [ ] Video IDs asignados a lecciones desde panel admin
- [ ] Variables BUNNY_* configuradas en Vercel

## Resend (opcional)
- [ ] Dominio verificado en Resend
- [ ] EMAIL_ENABLED=true en Vercel
- [ ] RESEND_API_KEY configurada
- [ ] EMAIL_FROM con dominio verificado

## Contenido
- [ ] Curso de induccion creado con contenido real
- [ ] 2-3 cursos adicionales
- [ ] Rutas de carrera definidas
- [ ] Badges configurados
- [ ] Config de empresa actualizada (lib/config/empresa.ts)

## Usuarios
- [ ] Admin(s) con passwords seguros
- [ ] Usuario RRHH creado
- [ ] Primer grupo de trabajadores creados
- [ ] Roles asignados en user_metadata

## Post-launch
- [ ] Monitoreo configurado (health check: /api/health)
- [ ] Backup de DB verificado (Supabase lo hace por defecto)
- [ ] Plan de iteraciones
