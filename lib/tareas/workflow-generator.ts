/**
 * Prompt 18 — Motor de workflow: auto-generación de tareas.
 *
 * Al programar un webinar (o cualquier workflow) el jefe elige plantilla +
 * fecha hito + responsable general. Esto genera todas las TareaInstancia
 * distribuidas entre los usuarios del área según el rol responsable de
 * cada tarea del catálogo.
 */
import { addDays, addMinutes } from "date-fns";

import { prisma } from "@/lib/prisma";

export type CrearWorkflowInput = {
  plantillaId: string;
  nombre: string;
  contextoMarca?: string;
  negocio?: import("@prisma/client").Negocio | null;
  fechaHito: Date;
  responsableGeneralId: string;
  /** Área donde buscar al usuario del puesto correspondiente. Si se omite,
   *  se toma la del responsable general. */
  areaId?: string;
  notas?: string;
  calendarId?: string;
};

export type CrearWorkflowResult = {
  workflowInstanciaId: string;
  tareasCreadas: number;
  tareasOmitidas: Array<{ codigo: string; motivo: string }>;
};

export async function crearWorkflowDesdeTemplate(
  params: CrearWorkflowInput,
): Promise<CrearWorkflowResult> {
  const plantilla = await prisma.workflowPlantilla.findUnique({
    where: { id: params.plantillaId },
    include: {
      tareas: {
        include: {
          catalogoTarea: { include: { rolResponsable: true } },
        },
        orderBy: { ordenEjecucion: "asc" },
      },
    },
  });
  if (!plantilla) throw new Error("Plantilla de workflow no encontrada");

  // Determinar área base
  let areaId = params.areaId;
  if (!areaId) {
    const responsable = await prisma.user.findUnique({
      where: { id: params.responsableGeneralId },
      select: { areaId: true },
    });
    areaId = responsable?.areaId ?? undefined;
  }
  if (!areaId) {
    throw new Error(
      "No se pudo determinar el área del workflow. Pasa areaId o asegurá que el responsable tenga área.",
    );
  }

  const workflow = await prisma.workflowInstancia.create({
    data: {
      plantillaId: params.plantillaId,
      nombre: params.nombre,
      contextoMarca: params.contextoMarca,
      negocio: params.negocio ?? null,
      fechaHito: params.fechaHito,
      responsableGeneralId: params.responsableGeneralId,
      notas: params.notas,
      calendarId: params.calendarId ?? null,
      estadoGeneral: "ACTIVO",
    },
  });

  const tareasOmitidas: Array<{ codigo: string; motivo: string }> = [];
  let tareasCreadas = 0;

  for (const tareaPlantilla of plantilla.tareas) {
    const cat = tareaPlantilla.catalogoTarea;

    // Buscar usuario del área con el puesto requerido
    const usuarioAsignado = await prisma.user.findFirst({
      where: {
        puestoId: cat.rolResponsableId,
        areaId,
        activo: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!usuarioAsignado) {
      tareasOmitidas.push({
        codigo: cat.codigo,
        motivo: `Sin usuario con puesto "${cat.rolResponsable.nombre}" en el área`,
      });
      continue;
    }

    const fechaEstimadaInicio = addDays(
      params.fechaHito,
      -tareaPlantilla.diasAntesDelHito,
    );
    const fechaEstimadaFin = addMinutes(fechaEstimadaInicio, cat.tiempoMaximoMin);

    await prisma.tareaInstancia.create({
      data: {
        workflowInstanciaId: workflow.id,
        catalogoTareaId: cat.id,
        asignadoAId: usuarioAsignado.id,
        fechaEstimadaInicio,
        fechaEstimadaFin,
        estado: "PENDIENTE",
        requiereValidacionJefe: true,
      },
    });
    tareasCreadas++;
  }

  return {
    workflowInstanciaId: workflow.id,
    tareasCreadas,
    tareasOmitidas,
  };
}

/**
 * Desbloquea tareas que dependían de la que acaba de completarse.
 * Retorna los IDs de tareas desbloqueadas para notificar.
 */
export async function desbloquearTareasDependientes(
  tareaCompletadaId: string,
): Promise<string[]> {
  const tarea = await prisma.tareaInstancia.findUnique({
    where: { id: tareaCompletadaId },
    include: { catalogoTarea: true },
  });
  if (!tarea) return [];
  // Ad-hoc tasks don't have dependencies
  if (!tarea.catalogoTareaId) return [];

  const dependencias = await prisma.dependenciaTarea.findMany({
    where: {
      tareaOrigenId: tarea.catalogoTareaId,
      tipoDependencia: "FIN_A_INICIO",
    },
    include: { tareaDestino: true },
  });

  const desbloqueadas: string[] = [];

  for (const dep of dependencias) {
    const tareaDependiente = await prisma.tareaInstancia.findFirst({
      where: {
        workflowInstanciaId: tarea.workflowInstanciaId,
        catalogoTareaId: dep.tareaDestinoId,
        estado: { in: ["PENDIENTE", "BLOQUEADA"] },
      },
    });

    if (!tareaDependiente) continue;

    if (tareaDependiente.estado === "BLOQUEADA") {
      await prisma.tareaInstancia.update({
        where: { id: tareaDependiente.id },
        data: { estado: "PENDIENTE" },
      });
    }

    await prisma.notificacion.create({
      data: {
        userId: tareaDependiente.asignadoAId,
        tipo: "RECORDATORIO",
        titulo: "Tarea desbloqueada",
        mensaje: `Ya puedes comenzar "${dep.tareaDestino.nombre}".`,
        url: `/tareas/${tareaDependiente.id}`,
      },
    });
    desbloqueadas.push(tareaDependiente.id);
  }

  return desbloqueadas;
}

/**
 * Notificar tareas próximas (fecha estimada de inicio dentro de las
 * próximas 24h). Ideal para cron diario.
 */
export async function notificarTareasProximas(): Promise<number> {
  const ahora = new Date();
  const manana = addDays(ahora, 1);

  const tareasProximas = await prisma.tareaInstancia.findMany({
    where: {
      estado: "PENDIENTE",
      fechaEstimadaInicio: { lte: manana, gte: ahora },
    },
    include: {
      catalogoTarea: { select: { nombre: true } },
      workflowInstancia: { select: { nombre: true } },
    },
    // Also include nombreAdHoc field in selection via default
  });

  let enviadas = 0;
  for (const tarea of tareasProximas) {
    const nombre = tarea.catalogoTarea?.nombre ?? tarea.nombreAdHoc ?? "Tarea";
    const workflow = tarea.workflowInstancia?.nombre;
    await prisma.notificacion.create({
      data: {
        userId: tarea.asignadoAId,
        tipo: "RECORDATORIO",
        titulo: `Tarea próxima: ${nombre}`,
        mensaje: workflow
          ? `Para "${workflow}". Inicia ${tarea.fechaEstimadaInicio.toLocaleDateString("es")}.`
          : `Inicia ${tarea.fechaEstimadaInicio.toLocaleDateString("es")}.`,
        url: `/tareas/${tarea.id}`,
      },
    });
    enviadas++;
  }
  return enviadas;
}

/**
 * Marca tareas vencidas: fecha estimada fin pasó y siguen PENDIENTE/BLOQUEADA/EN_PROGRESO.
 * Ideal para cron diario.
 */
export async function marcarTareasVencidas(): Promise<number> {
  const ahora = new Date();
  const result = await prisma.tareaInstancia.updateMany({
    where: {
      estado: { in: ["PENDIENTE", "EN_PROGRESO"] },
      fechaEstimadaFin: { lt: ahora },
    },
    data: { estado: "VENCIDA" },
  });
  return result.count;
}
