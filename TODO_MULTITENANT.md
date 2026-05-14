# Roadmap multi-tenant Educanet — pendientes

Esta sesión introdujo el MVP de multi-tenancy: `Organization`, `OrganizationMember`,
`organizationId` en `User`, `CatalogoTarea`, `WorkflowPlantilla`, `WorkflowInstancia`,
`TareaInstancia`. La integración Estratega→Educanet usa `prismaForOrg(orgId)` y aísla
correctamente desde el día 1.

Mientras solo exista 1 organización en la DB (Semco), el aislamiento de la UI es de facto
correcto. **Antes de registrar la organización #2**, hay que migrar estas queries a
`prismaForOrg(orgId)` o agregar `organizationId` manualmente al `where`:

## Queries pendientes de scope por org

### Tareas y workflows operativos
- `lib/tareas/queries.ts` — listados del empleado
- `lib/tareas/queries-jefe.ts` — listados del jefe
- `lib/tareas/actions.ts` — server actions de tareas
- `lib/tareas/subtarea-actions.ts` — gestión de subtareas
- `lib/tareas/onboarding.ts` — `asignarTareasOnboarding` (busca usuario referencia por puesto)
- `lib/tareas/workflow-generator.ts` — generación de instancias desde plantilla
- `lib/tareas/helpers.ts` — utilidades varias
- `lib/tareas/validacion-cobertura.ts` — validación de cobertura por puesto
- `lib/tareas/kpis-autocalculo.ts` — cálculos automáticos KPI desde tareas

### Gantt y proyectos
- `lib/gantt/queries.ts` — datos para el Gantt
- `lib/gantt/actions.ts` — server actions del Gantt
- `app/(dashboard)/proyectos/page.tsx` — listado de proyectos
- `app/(dashboard)/proyectos/[id]/gantt/page.tsx` — Gantt por proyecto

### Flujograma BPMN
- `app/(dashboard)/flujograma/page.tsx`
- `app/(dashboard)/flujograma/[id]/page.tsx`

### Admin
- `app/(admin)/admin/workflows/page.tsx` — admin de plantillas
- `app/(admin)/admin/catalogo-tareas/page.tsx` — admin de catálogo
- `lib/admin/webinar-instancia-actions.ts` — actions de webinars
- `lib/admin/cobertura-puestos.ts` — análisis de cobertura

### Otros
- `lib/calendarios/actions.ts` — calendarios laborales
- `lib/kpis/auto-calculos.ts` — auto-cálculos KPI que tocan tareas

## Scripts y seeds (no app)

Los siguientes archivos consultan/escriben a tablas tenant pero solo se usan en dev/setup,
así que pueden quedar single-tenant explícito (hardcodean `org_semco_default`):

- `scripts/fix_nombres_roles.ts`
- `scripts/fix_onboarding_nuevo_usuario.ts`
- `scripts/reorder_tareas.ts`
- `scripts/seed_webinars_v2.ts`
- `scripts/debug-proyectos*.ts`
- `scripts/fix-proyecto-responsable.ts`
- `prisma/seed*.ts`
- `prisma/export-tareas-activas.ts`

## Tablas Educanet que NO son multi-tenant todavía (Fase 2)

Para vender a un segundo cliente, también hay que migrar:

- `Area`, `Puesto`, `RutaCarrera`, `RutaCarreraCurso`, `RutaCarreraMetrica`
- `Curso`, `Modulo`, `Leccion`, `Quiz`, `Pregunta`, `OpcionRespuesta`, `RecursoLeccion`
- `Badge`, `CategoriaReconocimiento`, `Reconocimiento`, `Mision`, `Compromiso`
- `PuestoKpiDefinicion`, `KpiAsignacionMes`, `KpiInstancia`, `KpiAsignacion`,
  `KpiRegistroSemanal`, `KpiResultadoMensual`, `RangoMensual`, `EventoGamificacion`
- `ConfiguracionPiloto`, `EncuestaSemanal`
- `CalendarioLaboral`, `Feriado`
- `DefinicionProceso`, `NodoProceso`, `TransicionProceso`
- `Notificacion`, `Comentario`, `ComentarioLike`, `ReporteComentario`
- `Certificado`, `MetricaDesempeno`, `LeccionNota`, `ProgresoLeccion`,
  `IntentoQuiz`, `UserBadge`, `TransaccionPuntos`

Cada una requiere: agregar `organizationId String`, FK a `Organization`, índice,
backfill SQL, refactor de queries.

## RLS Supabase

Las policies de RLS están escritas para single-tenant. Antes del cliente #2, reescribir
todas las policies para incluir verificación de `organizationId` (probablemente vía un JWT
claim o una función `current_org_id()` que lea de la session).

Archivos en `supabase/`:
- `auth-sync.sql`
- `rls-policies.sql`
- `storage-policies.sql`
