import { prisma } from "@/lib/prisma";
import { rangoMes } from "@/lib/gamificacion/periodo";
import type {
  CategoriaTarea,
  EstadoTareaInstancia,
} from "@prisma/client";

/** Tareas activas (no cerradas) de un usuario, incluyendo las que ejecuta
 *  por ayuda cruzada. */
export async function obtenerTareasUsuario(userId: string) {
  return prisma.tareaInstancia.findMany({
    where: {
      OR: [{ asignadoAId: userId }, { ejecutadaRealmenteId: userId }],
      estado: { notIn: ["COMPLETADA", "OMITIDA"] },
    },
    include: {
      catalogoTarea: {
        include: {
          checklistItems: { orderBy: { orden: "asc" } },
        },
      },
      workflowInstancia: { select: { id: true, nombre: true, fechaHito: true, contextoMarca: true } },
      checklistMarcados: true,
    },
    orderBy: { fechaEstimadaFin: "asc" },
  });
}

export async function obtenerTareaDetalle(tareaId: string, userId: string) {
  const tarea = await prisma.tareaInstancia.findUnique({
    where: { id: tareaId },
    include: {
      catalogoTarea: {
        include: {
          checklistItems: { orderBy: { orden: "asc" } },
          rolResponsable: true,
        },
      },
      workflowInstancia: {
        select: {
          id: true,
          nombre: true,
          fechaHito: true,
          contextoMarca: true,
          responsableGeneralId: true,
        },
      },
      asignadoA: { select: { id: true, nombre: true, apellido: true, puesto: { select: { nombre: true } } } },
      ejecutadaRealmente: { select: { id: true, nombre: true, apellido: true } },
      checklistMarcados: true,
    },
  });

  if (!tarea) return null;

  const esPropia =
    tarea.asignadoAId === userId ||
    tarea.ejecutadaRealmenteId === userId ||
    tarea.workflowInstancia?.responsableGeneralId === userId;

  return { tarea, esPropia };
}

/**
 * Tarea en progreso activa (la que más recientemente se inició). Útil para
 * el widget "Tarea actual" del home.
 */
export async function obtenerTareaActual(userId: string) {
  return prisma.tareaInstancia.findFirst({
    where: {
      OR: [{ asignadoAId: userId }, { ejecutadaRealmenteId: userId }],
      estado: "EN_PROGRESO",
    },
    include: {
      catalogoTarea: {
        include: { checklistItems: { select: { id: true, obligatorio: true } } },
      },
      workflowInstancia: { select: { nombre: true, fechaHito: true } },
      checklistMarcados: { where: { marcado: true }, select: { plantillaItemId: true } },
    },
    orderBy: { fechaInicioReal: "desc" },
  });
}

export async function obtenerEstadisticasTareasUsuario(params: {
  userId: string;
  mes: number;
  anio: number;
}) {
  const { inicio, fin } = rangoMes(params.mes, params.anio);

  const tareas = await prisma.tareaInstancia.findMany({
    where: {
      OR: [{ asignadoAId: params.userId }, { ejecutadaRealmenteId: params.userId }],
      completadaEn: { gte: inicio, lte: fin },
    },
    include: { catalogoTarea: { select: { categoria: true } } },
  });

  const completadas = tareas.filter((t) => t.estado === "COMPLETADA");
  const aTiempo = completadas.filter((t) => t.puntosATiempo);
  const ayudaCruzadaDada = completadas.filter(
    (t) => t.ejecutadaRealmenteId === params.userId && t.asignadoAId !== params.userId,
  );
  const bloqueosReportados = tareas.filter((t) => t.bloqueoExternoDesde !== null);

  const tiempoTotalMin = completadas.reduce(
    (s, t) => s + (t.tiempoInvertidoMin ?? 0),
    0,
  );

  const porCategoria: Record<string, { count: number; tiempoMin: number }> = {};
  for (const t of completadas) {
    const cat = t.catalogoTarea?.categoria ?? "COORDINACION_GENERAL";
    if (!porCategoria[cat]) porCategoria[cat] = { count: 0, tiempoMin: 0 };
    porCategoria[cat].count++;
    porCategoria[cat].tiempoMin += t.tiempoInvertidoMin ?? 0;
  }

  return {
    totalCompletadas: completadas.length,
    aTiempo: aTiempo.length,
    tasaATiempo: completadas.length > 0 ? (aTiempo.length / completadas.length) * 100 : 0,
    ayudaCruzadaDada: ayudaCruzadaDada.length,
    bloqueosReportados: bloqueosReportados.length,
    tiempoTotalHoras: Math.round((tiempoTotalMin / 60) * 10) / 10,
    porCategoria,
  };
}

export async function obtenerWorkflowsActivos(areaId: string) {
  // Todas las instancias donde haya tareas asignadas a gente del área.
  const workflows = await prisma.workflowInstancia.findMany({
    where: {
      estadoGeneral: "ACTIVO",
      OR: [
        { responsableGeneral: { areaId } },
        { tareas: { some: { asignadoA: { areaId } } } },
      ],
    },
    include: {
      plantilla: { select: { codigo: true, nombre: true } },
      tareas: {
        select: { id: true, estado: true, fechaEstimadaFin: true, bloqueoExternoDesde: true },
      },
      responsableGeneral: {
        select: { id: true, nombre: true, apellido: true },
      },
    },
    orderBy: { fechaHito: "asc" },
  });

  return workflows.map((w) => {
    const total = w.tareas.length;
    const completadas = w.tareas.filter((t) => t.estado === "COMPLETADA").length;
    const bloqueadas = w.tareas.filter((t) => t.estado === "BLOQUEADA").length;
    const vencidas = w.tareas.filter((t) => t.estado === "VENCIDA").length;
    return {
      id: w.id,
      nombre: w.nombre,
      contextoMarca: w.contextoMarca,
      fechaHito: w.fechaHito,
      responsable: w.responsableGeneral,
      plantillaCodigo: w.plantilla.codigo,
      totalTareas: total,
      completadas,
      bloqueadas,
      vencidas,
      progreso: total > 0 ? Math.round((completadas / total) * 100) : 0,
    };
  });
}

/**
 * Cuellos de botella: tareas BLOQUEADAs con >=3 días esperando.
 */
export async function obtenerCuellosBottella(areaId: string) {
  const hace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return prisma.tareaInstancia.findMany({
    where: {
      estado: "BLOQUEADA",
      bloqueoExternoDesde: { lte: hace3Dias },
      asignadoA: { areaId },
    },
    include: {
      catalogoTarea: { select: { nombre: true } },
      workflowInstancia: { select: { nombre: true } },
      asignadoA: { select: { nombre: true, apellido: true } },
    },
    orderBy: { bloqueoExternoDesde: "asc" },
  });
}

/**
 * Matriz de ayuda cruzada: quién ayudó a quién este mes.
 */
export async function obtenerMatrizAyudaCruzada(params: {
  areaId: string;
  mes: number;
  anio: number;
}) {
  const { inicio, fin } = rangoMes(params.mes, params.anio);
  const ayudas = await prisma.tareaInstancia.findMany({
    where: {
      ejecutadaPorOtro: true,
      completadaEn: { gte: inicio, lte: fin },
      asignadoA: { areaId: params.areaId },
    },
    include: {
      asignadoA: { select: { id: true, nombre: true, apellido: true } },
      ejecutadaRealmente: { select: { id: true, nombre: true, apellido: true } },
      catalogoTarea: { select: { nombre: true, codigo: true } },
    },
  });

  // Agrupar por (asignadoA, ejecutadaRealmente)
  const matriz = new Map<
    string,
    {
      asignado: { id: string; nombre: string };
      ejecutor: { id: string; nombre: string };
      count: number;
      tareas: string[];
    }
  >();

  for (const a of ayudas) {
    if (!a.ejecutadaRealmente) continue;
    const nombreTarea = a.catalogoTarea?.nombre ?? a.nombreAdHoc ?? "Tarea ad-hoc";
    const key = `${a.asignadoAId}→${a.ejecutadaRealmenteId}`;
    const existing = matriz.get(key);
    if (existing) {
      existing.count++;
      existing.tareas.push(nombreTarea);
    } else {
      matriz.set(key, {
        asignado: {
          id: a.asignadoA.id,
          nombre: `${a.asignadoA.nombre} ${a.asignadoA.apellido}`,
        },
        ejecutor: {
          id: a.ejecutadaRealmente.id,
          nombre: `${a.ejecutadaRealmente.nombre} ${a.ejecutadaRealmente.apellido}`,
        },
        count: 0,
        tareas: [nombreTarea],
      });
      matriz.get(key)!.count = 1;
    }
  }

  return Array.from(matriz.values()).sort((a, b) => b.count - a.count);
}

/**
 * Variabilidad de tiempos: tareas donde el tiempo real excede el máximo
 * estimado en más del 50% (indica que la definición del catálogo quizá
 * subestima el tiempo real).
 */
export async function obtenerVariabilidadTiempos(areaId: string) {
  const completadas = await prisma.tareaInstancia.findMany({
    where: {
      estado: "COMPLETADA",
      tiempoInvertidoMin: { not: null },
      catalogoTareaId: { not: null },
      asignadoA: { areaId },
    },
    include: { catalogoTarea: true },
  });

  // Agrupar por catalogoTareaId (solo del catálogo, las ad-hoc no aplican)
  const porTarea = new Map<
    string,
    { catalogoNombre: string; tiempoMaxEstimado: number; instancias: number; promedioReal: number; excedidas: number }
  >();

  for (const t of completadas) {
    if (!t.catalogoTareaId || !t.catalogoTarea) continue;
    const key = t.catalogoTareaId;
    const entry =
      porTarea.get(key) ??
      {
        catalogoNombre: t.catalogoTarea.nombre,
        tiempoMaxEstimado: t.catalogoTarea.tiempoMaximoMin,
        instancias: 0,
        promedioReal: 0,
        excedidas: 0,
      };
    entry.instancias++;
    entry.promedioReal += t.tiempoInvertidoMin ?? 0;
    if ((t.tiempoInvertidoMin ?? 0) > t.catalogoTarea.tiempoMaximoMin * 1.5) {
      entry.excedidas++;
    }
    porTarea.set(key, entry);
  }

  return Array.from(porTarea.values())
    .map((e) => ({
      ...e,
      promedioReal: e.instancias > 0 ? Math.round(e.promedioReal / e.instancias) : 0,
    }))
    .filter((e) => e.excedidas >= 3 || e.instancias >= 3)
    .sort((a, b) => b.excedidas - a.excedidas);
}

/**
 * Tiempo invertido por categoría por miembro del equipo este mes.
 */
export async function obtenerTiempoPorCategoriaEquipo(params: {
  areaId: string;
  mes: number;
  anio: number;
}) {
  const { inicio, fin } = rangoMes(params.mes, params.anio);

  const tareas = await prisma.tareaInstancia.findMany({
    where: {
      completadaEn: { gte: inicio, lte: fin },
      estado: "COMPLETADA",
      OR: [
        { asignadoA: { areaId: params.areaId } },
        { ejecutadaRealmente: { areaId: params.areaId } },
      ],
    },
    include: {
      catalogoTarea: { select: { categoria: true } },
      asignadoA: { select: { id: true, nombre: true, apellido: true } },
      ejecutadaRealmente: { select: { id: true, nombre: true, apellido: true } },
    },
  });

  type Celda = { categoria: CategoriaTarea; tiempoMin: number; count: number };
  const porMiembro = new Map<
    string,
    { nombre: string; porCategoria: Record<string, Celda> }
  >();

  for (const t of tareas) {
    const ejecutor = t.ejecutadaRealmente ?? t.asignadoA;
    const nombreEjecutor = `${ejecutor.nombre} ${ejecutor.apellido}`;
    const entry =
      porMiembro.get(ejecutor.id) ?? { nombre: nombreEjecutor, porCategoria: {} };
    const cat: CategoriaTarea = t.catalogoTarea?.categoria ?? "COORDINACION_GENERAL";
    const cell =
      entry.porCategoria[cat] ?? { categoria: cat, tiempoMin: 0, count: 0 };
    cell.tiempoMin += t.tiempoInvertidoMin ?? 0;
    cell.count++;
    entry.porCategoria[cat] = cell;
    porMiembro.set(ejecutor.id, entry);
  }

  return Array.from(porMiembro.entries()).map(([id, data]) => ({
    userId: id,
    nombre: data.nombre,
    categorias: Object.values(data.porCategoria),
  }));
}

/** Lista de plantillas activas (para el modal de "programar workflow"). */
export async function obtenerPlantillasActivas() {
  return prisma.workflowPlantilla.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      descripcion: true,
      categoria: true,
      duracionTotalDias: true,
      _count: { select: { tareas: true } },
    },
  });
}

/** Compañeros del área (para selector de ayuda cruzada). */
export async function obtenerCompanerosArea(params: {
  areaId: string;
  excluirUserId: string;
}) {
  return prisma.user.findMany({
    where: {
      areaId: params.areaId,
      id: { not: params.excluirUserId },
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      puesto: { select: { nombre: true } },
    },
    orderBy: { nombre: "asc" },
  });
}

export type FiltroEstadoTarea = EstadoTareaInstancia | "todos";
