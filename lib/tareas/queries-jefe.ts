/**
 * Prompt 18 · UX jefe — queries para la vista por miembro + drill-down.
 */
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { rangoMes } from "@/lib/gamificacion/periodo";
import { TOPE_MENSUAL_TAREAS_OPERATIVAS, obtenerProyeccionMesUsuario } from "./helpers";

/**
 * Estado general del equipo: un row por miembro con puntos acumulados,
 * proyección, cumplimiento KPI y semáforo.
 */
export async function obtenerPanelEquipoJefe(params: {
  areaId: string;
  jefeId: string;
  mes: number;
  anio: number;
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("panel-equipo", `panel-equipo-${params.areaId}`);
  const { inicio, fin } = rangoMes(params.mes, params.anio);

  const miembros = await prisma.user.findMany({
    where: {
      areaId: params.areaId,
      activo: true,
      id: { not: params.jefeId },
    },
    include: {
      puesto: { select: { nombre: true } },
    },
    orderBy: { nombre: "asc" },
  });

  if (miembros.length === 0) return [];
  const ids = miembros.map((m) => m.id);

  // Batch a nivel de área — 7 queries fijas independientes del N de miembros
  const [
    puntosPorUserFuente,
    rangosMes,
    adHocsPorUser,
    tareasMesAsignadas,
    tareasMesEjecutadas,
    bloqueadasAsignadas,
    bloqueadasEjecutadas,
  ] = await Promise.all([
    prisma.eventoGamificacion.groupBy({
      by: ["userId", "fuente"],
      where: {
        userId: { in: ids },
        fuente: { in: ["TAREAS_OPERATIVAS", "COMPROMISOS"] },
        mesPeriodo: params.mes,
        anioPeriodo: params.anio,
      },
      _sum: { cantidad: true },
    }),
    prisma.rangoMensual.findMany({
      where: {
        userId: { in: ids },
        periodoMes: params.mes,
        periodoAnio: params.anio,
      },
    }),
    prisma.tareaInstancia.groupBy({
      by: ["asignadoAId"],
      where: {
        asignadoAId: { in: ids },
        requiereValidacionJefe: true,
        validadaEn: null,
        estado: "EN_REVISION",
      },
      _count: true,
    }),
    prisma.tareaInstancia.groupBy({
      by: ["asignadoAId", "estado"],
      where: {
        asignadoAId: { in: ids },
        fechaEstimadaFin: { gte: inicio, lte: fin },
      },
      _count: true,
    }),
    prisma.tareaInstancia.groupBy({
      by: ["ejecutadaRealmenteId", "estado"],
      where: {
        ejecutadaRealmenteId: { in: ids },
        fechaEstimadaFin: { gte: inicio, lte: fin },
      },
      _count: true,
    }),
    prisma.tareaInstancia.groupBy({
      by: ["asignadoAId"],
      where: { asignadoAId: { in: ids }, estado: "BLOQUEADA" },
      _count: true,
    }),
    prisma.tareaInstancia.groupBy({
      by: ["ejecutadaRealmenteId"],
      where: { ejecutadaRealmenteId: { in: ids }, estado: "BLOQUEADA" },
      _count: true,
    }),
  ]);

  // Mapas por userId
  const mapaPuntos = new Map<string, { tareas: number; compromisos: number }>();
  for (const r of puntosPorUserFuente) {
    const e = mapaPuntos.get(r.userId) ?? { tareas: 0, compromisos: 0 };
    if (r.fuente === "TAREAS_OPERATIVAS") e.tareas += r._sum.cantidad ?? 0;
    if (r.fuente === "COMPROMISOS") e.compromisos += r._sum.cantidad ?? 0;
    mapaPuntos.set(r.userId, e);
  }
  const mapaRango = new Map(rangosMes.map((r) => [r.userId, r]));
  const mapaAdHoc = new Map(adHocsPorUser.map((r) => [r.asignadoAId, r._count]));

  type EstadoCount = { total: number; completadas: number; vencidas: number };
  const mapaTareas = new Map<string, EstadoCount>();
  const sumarTarea = (uid: string | null, estado: string, count: number) => {
    if (!uid) return;
    const e = mapaTareas.get(uid) ?? { total: 0, completadas: 0, vencidas: 0 };
    e.total += count;
    if (estado === "COMPLETADA") e.completadas += count;
    if (estado === "VENCIDA") e.vencidas += count;
    mapaTareas.set(uid, e);
  };
  for (const r of tareasMesAsignadas) sumarTarea(r.asignadoAId, r.estado, r._count);
  for (const r of tareasMesEjecutadas) sumarTarea(r.ejecutadaRealmenteId, r.estado, r._count);

  const mapaBloqueadas = new Map<string, number>();
  for (const r of bloqueadasAsignadas) {
    mapaBloqueadas.set(r.asignadoAId, (mapaBloqueadas.get(r.asignadoAId) ?? 0) + r._count);
  }
  for (const r of bloqueadasEjecutadas) {
    if (!r.ejecutadaRealmenteId) continue;
    mapaBloqueadas.set(
      r.ejecutadaRealmenteId,
      (mapaBloqueadas.get(r.ejecutadaRealmenteId) ?? 0) + r._count,
    );
  }

  // Proyecciones por miembro — cacheadas individualmente, baratas en hits subsiguientes
  const proyecciones = await Promise.all(
    miembros.map((m) => obtenerProyeccionMesUsuario(m.id)),
  );

  return miembros.map((m, i) => {
    const proyeccion = proyecciones[i];
    const puntos = mapaPuntos.get(m.id) ?? { tareas: 0, compromisos: 0 };
    const tareasAgg = mapaTareas.get(m.id) ?? { total: 0, completadas: 0, vencidas: 0 };
    const rango = mapaRango.get(m.id);
    const adHocPorValidar = mapaAdHoc.get(m.id) ?? 0;
    const bloqueadas = mapaBloqueadas.get(m.id) ?? 0;

    let semaforo: "verde" | "amarillo" | "rojo" = "verde";
    if (tareasAgg.vencidas > 0 || (rango?.cumplimientoKpis ?? 100) < 50) {
      semaforo = "rojo";
    } else if (bloqueadas > 0 || adHocPorValidar > 0) {
      semaforo = "amarillo";
    }

    return {
      id: m.id,
      nombre: m.nombre,
      apellido: m.apellido,
      puestoNombre: m.puesto?.nombre ?? "Sin puesto",
      avatarUrl: m.avatarUrl,
      puntosOtorgadosReales: proyeccion.puntosOtorgadosReales,
      topePuntos: TOPE_MENSUAL_TAREAS_OPERATIVAS,
      puntosTareasOperativas: puntos.tareas,
      puntosCompromisos: puntos.compromisos,
      acumuladoBruto: proyeccion.acumuladoBruto,
      proyectadoPendiente: proyeccion.proyectadoPendiente,
      totalProyectado: proyeccion.totalProyectado,
      factorProrrateo: proyeccion.factor,
      cumplimientoKpis: rango?.cumplimientoKpis ?? null,
      rangoActual: rango?.rango ?? null,
      totalTareas: tareasAgg.total,
      completadas: tareasAgg.completadas,
      bloqueadas,
      vencidas: tareasAgg.vencidas,
      adHocPorValidar,
      semaforo,
    };
  });
}

/**
 * Tareas del miembro, agrupadas por estado para kanban del drill-down.
 */
export async function obtenerTareasDeMiembro(params: {
  userId: string;
  mes: number;
  anio: number;
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("tareas", `tareas-${params.userId}`);
  const { inicio, fin } = rangoMes(params.mes, params.anio);

  const tareas = await prisma.tareaInstancia.findMany({
    where: {
      OR: [{ asignadoAId: params.userId }, { ejecutadaRealmenteId: params.userId }],
    },
    include: {
      catalogoTarea: {
        include: { checklistItems: { orderBy: { orden: "asc" } } },
      },
      workflowInstancia: { select: { id: true, nombre: true, fechaHito: true, contextoMarca: true } },
      checklistMarcados: true,
      hijos: { select: { id: true, estado: true } },
    },
    orderBy: [{ fechaEstimadaInicio: "asc" }, { fechaEstimadaFin: "asc" }],
  });

  // Filtrar: mostrar no-completadas todas + completadas del mes corriente
  const relevantes = tareas.filter((t) => {
    if (t.estado !== "COMPLETADA" && t.estado !== "OMITIDA") return true;
    return t.completadaEn && t.completadaEn >= inicio && t.completadaEn <= fin;
  });

  return relevantes;
}

/**
 * Tareas ad-hoc del miembro que requieren validación del jefe (pendientes).
 */
export async function obtenerAdHocsPendientesValidacion(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("tareas", `tareas-${userId}`);
  return prisma.tareaInstancia.findMany({
    where: {
      asignadoAId: userId,
      requiereValidacionJefe: true,
      validadaEn: null,
      estado: "EN_REVISION",
    },
    include: {
      catalogoTarea: true,
    },
    orderBy: { completadaEn: "desc" },
  });
}

/**
 * Datos del miembro para la página drill-down.
 */
export async function obtenerDatosMiembro(userId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("usuario-detalle", `usuario-${userId}`);
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      puesto: { select: { nombre: true } },
      area: { select: { nombre: true } },
    },
  });
}

/**
 * Catálogo de tareas disponible para asignar al miembro (filtrado por su puesto).
 */
export async function obtenerCatalogoAsignableA(puestoId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogo-tareas", `catalogo-puesto-${puestoId}`);
  return prisma.catalogoTarea.findMany({
    where: {
      rolResponsableId: puestoId,
      activa: true,
    },
    orderBy: [{ categoria: "asc" }, { orden: "asc" }],
    select: {
      id: true,
      codigo: true,
      nombre: true,
      categoria: true,
      tiempoMinimoMin: true,
      tiempoMaximoMin: true,
      puntosBase: true,
    },
  });
}
