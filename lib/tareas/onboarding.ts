import { prisma } from "@/lib/prisma";

/**
 * Cuando un nuevo usuario se registra, hereda las TareaInstancia de los
 * proyectos (WorkflowInstancia) activos que corresponden a su puesto.
 * Se crean copias de esas tareas asignadas al nuevo usuario, manteniendo
 * el estado actual, fechas y jerarquía padre-hijo tal como el equipo las
 * tiene en ese momento.
 */
export async function asignarTareasOnboarding(
  userId: string,
  puestoId: string,
): Promise<void> {
  // Resolver org del usuario para filtrar referencias y asignar las nuevas
  const userInfo = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  const organizationId = userInfo?.organizationId;
  if (!organizationId) return; // sin org no podemos crear tareas tenant

  // Buscar un usuario de referencia con el mismo puesto en la misma org
  const usuarioReferencia = await prisma.user.findFirst({
    where: {
      puestoId,
      organizationId,
      id: { not: userId },
      activo: true,
    },
    select: { id: true },
  });

  if (!usuarioReferencia) return;

  // Buscar tareas de workflows asignadas a ese usuario de referencia (misma org)
  const tareasReferencia = await prisma.tareaInstancia.findMany({
    where: {
      organizationId,
      workflowInstanciaId: { not: null },
      asignadoAId: usuarioReferencia.id,
    },
    orderBy: [{ workflowInstanciaId: "asc" }, { ordenGantt: "asc" }],
  });

  if (tareasReferencia.length === 0) return;

  // Primera pasada: crear todas las tareas sin parentId
  const creadas = await Promise.all(
    tareasReferencia.map((ref) =>
      prisma.tareaInstancia.create({
        data: {
          organizationId,
          workflowInstanciaId:    ref.workflowInstanciaId,
          catalogoTareaId:        ref.catalogoTareaId,
          asignadoAId:            userId,
          origen:                 "AUTO_WORKFLOW",
          estado:                 ref.estado,
          negocio:                ref.negocio ?? undefined,
          nombreAdHoc:            ref.nombreAdHoc ?? undefined,
          descripcionAdHoc:       ref.descripcionAdHoc ?? undefined,
          puntosBaseAdHoc:        ref.puntosBaseAdHoc ?? undefined,
          tiempoEstimadoMinAdHoc: ref.tiempoEstimadoMinAdHoc ?? undefined,
          tiempoEstimadoMaxAdHoc: ref.tiempoEstimadoMaxAdHoc ?? undefined,
          fechaEstimadaInicio:    ref.fechaEstimadaInicio,
          fechaEstimadaFin:       ref.fechaEstimadaFin,
          puntosBrutos:           ref.puntosBrutos,
          ordenGantt:             ref.ordenGantt,
          duracionMinutos:        ref.duracionMinutos ?? undefined,
          esHito:                 ref.esHito,
          baselineInicio:         ref.baselineInicio ?? undefined,
          baselineFin:            ref.baselineFin ?? undefined,
          baselineDuracion:       ref.baselineDuracion ?? undefined,
          requiereValidacionJefe: false,
        },
        select: { id: true },
      })
    )
  );

  // Construir mapa refId → nuevoId para reasignar parentId
  const mapaIds = new Map<string, string>();
  tareasReferencia.forEach((ref, i) => {
    mapaIds.set(ref.id, creadas[i].id);
  });

  // Segunda pasada: asignar parentId donde corresponda
  const conParent = tareasReferencia.filter((ref) => ref.parentId !== null);
  if (conParent.length > 0) {
    await Promise.all(
      conParent.map((ref) => {
        const nuevoParentId = mapaIds.get(ref.parentId!);
        if (!nuevoParentId) return Promise.resolve();
        return prisma.tareaInstancia.update({
          where: { id: mapaIds.get(ref.id)! },
          data: { parentId: nuevoParentId },
        });
      })
    );
  }
}
