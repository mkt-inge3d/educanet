import { prisma } from "@/lib/prisma";

export type ResultadoOnboarding =
  | { ok: true; asignadas: number; modo: "WORKFLOW_REFERENCIA" | "CATALOGO" }
  | {
      ok: false;
      asignadas: 0;
      motivo:
        | "SIN_ORG"
        | "SIN_REFERENCIA_NI_CATALOGO"
        | "CATALOGO_VACIO";
    };

/**
 * Asigna tareas iniciales a un usuario nuevo. Estrategia:
 *
 * 1. Si existe un compañero activo del mismo puesto en la org, clona sus
 *    TareaInstancia de workflows (preserva fechas/estados del equipo).
 * 2. Si no, instancia tareas a partir del CatalogoTarea del puesto
 *    (sin workflowInstanciaId), con fechas en función del tiempo estimado.
 * 3. Si no hay catálogo tampoco, retorna sin tocar nada.
 */
export async function asignarTareasOnboarding(
  userId: string,
  puestoId: string,
): Promise<ResultadoOnboarding> {
  const userInfo = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, areaId: true },
  });

  let organizationId = userInfo?.organizationId ?? null;

  // Recuperación: si el usuario quedó sin org (bug del registro), derivar
  // desde otro usuario activo de la misma área que sí tenga.
  if (!organizationId && userInfo?.areaId) {
    const ref = await prisma.user.findFirst({
      where: {
        areaId: userInfo.areaId,
        organizationId: { not: null },
        activo: true,
      },
      select: { organizationId: true },
    });
    if (ref?.organizationId) {
      organizationId = ref.organizationId;
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId },
      });
    }
  }

  if (!organizationId) {
    return { ok: false, asignadas: 0, motivo: "SIN_ORG" };
  }

  // Estrategia 1: clonar de un compañero del mismo puesto
  const usuarioReferencia = await prisma.user.findFirst({
    where: {
      puestoId,
      organizationId,
      id: { not: userId },
      activo: true,
    },
    select: { id: true },
  });

  if (usuarioReferencia) {
    const tareasReferencia = await prisma.tareaInstancia.findMany({
      where: {
        organizationId,
        workflowInstanciaId: { not: null },
        asignadoAId: usuarioReferencia.id,
      },
      orderBy: [{ workflowInstanciaId: "asc" }, { ordenGantt: "asc" }],
    });

    if (tareasReferencia.length > 0) {
      const creadas = await Promise.all(
        tareasReferencia.map((ref) =>
          prisma.tareaInstancia.create({
            data: {
              organizationId,
              workflowInstanciaId: ref.workflowInstanciaId,
              catalogoTareaId: ref.catalogoTareaId,
              asignadoAId: userId,
              origen: "AUTO_WORKFLOW",
              estado: ref.estado,
              negocio: ref.negocio ?? undefined,
              nombreAdHoc: ref.nombreAdHoc ?? undefined,
              descripcionAdHoc: ref.descripcionAdHoc ?? undefined,
              puntosBaseAdHoc: ref.puntosBaseAdHoc ?? undefined,
              tiempoEstimadoMinAdHoc: ref.tiempoEstimadoMinAdHoc ?? undefined,
              tiempoEstimadoMaxAdHoc: ref.tiempoEstimadoMaxAdHoc ?? undefined,
              fechaEstimadaInicio: ref.fechaEstimadaInicio,
              fechaEstimadaFin: ref.fechaEstimadaFin,
              puntosBrutos: ref.puntosBrutos,
              ordenGantt: ref.ordenGantt,
              duracionMinutos: ref.duracionMinutos ?? undefined,
              esHito: ref.esHito,
              baselineInicio: ref.baselineInicio ?? undefined,
              baselineFin: ref.baselineFin ?? undefined,
              baselineDuracion: ref.baselineDuracion ?? undefined,
              requiereValidacionJefe: false,
            },
            select: { id: true },
          }),
        ),
      );

      const mapaIds = new Map<string, string>();
      tareasReferencia.forEach((ref, i) => {
        mapaIds.set(ref.id, creadas[i].id);
      });

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
          }),
        );
      }

      return {
        ok: true,
        asignadas: creadas.length,
        modo: "WORKFLOW_REFERENCIA",
      };
    }
  }

  // Estrategia 2: fallback al CatalogoTarea del puesto
  const catalogo = await prisma.catalogoTarea.findMany({
    where: {
      organizationId,
      rolResponsableId: puestoId,
      activa: true,
    },
    orderBy: [{ categoria: "asc" }, { orden: "asc" }],
  });

  if (catalogo.length === 0) {
    return { ok: false, asignadas: 0, motivo: "CATALOGO_VACIO" };
  }

  const ahora = new Date();
  const inicioDia = new Date(ahora);
  inicioDia.setHours(9, 0, 0, 0);

  const creadas = await Promise.all(
    catalogo.map((c) => {
      const fin = new Date(inicioDia);
      const duracionMin = Math.max(c.tiempoMaximoMin, c.tiempoMinimoMin);
      fin.setMinutes(fin.getMinutes() + duracionMin);
      return prisma.tareaInstancia.create({
        data: {
          organizationId,
          catalogoTareaId: c.id,
          asignadoAId: userId,
          origen: "AUTO_WORKFLOW",
          estado: "PENDIENTE",
          fechaEstimadaInicio: inicioDia,
          fechaEstimadaFin: fin,
          puntosBrutos: c.puntosBase,
          duracionMinutos: duracionMin,
          requiereValidacionJefe: false,
        },
        select: { id: true },
      });
    }),
  );

  return {
    ok: true,
    asignadas: creadas.length,
    modo: "CATALOGO",
  };
}
