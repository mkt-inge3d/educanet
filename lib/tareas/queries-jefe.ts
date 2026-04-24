/**
 * Prompt 18 · UX jefe — queries para la vista por miembro + drill-down.
 */
import { prisma } from "@/lib/prisma";
import { rangoMes } from "@/lib/gamificacion/periodo";
import { TOPE_MENSUAL_COMPROMISOS, obtenerProyeccionMesUsuario } from "./helpers";

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

  const filas = await Promise.all(
    miembros.map(async (m) => {
      const proyeccion = await obtenerProyeccionMesUsuario(m.id);

      const [tareasAgg, rangoMes, adHocPorValidar, bloqueadas, vencidas] =
        await Promise.all([
          prisma.tareaInstancia.groupBy({
            by: ["estado"],
            where: {
              OR: [{ asignadoAId: m.id }, { ejecutadaRealmenteId: m.id }],
              fechaEstimadaFin: { gte: inicio, lte: fin },
            },
            _count: true,
          }),
          prisma.rangoMensual.findUnique({
            where: {
              userId_periodoMes_periodoAnio: {
                userId: m.id,
                periodoMes: params.mes,
                periodoAnio: params.anio,
              },
            },
          }),
          prisma.tareaInstancia.count({
            where: {
              asignadoAId: m.id,
              requiereValidacionJefe: true,
              validadaEn: null,
              estado: "EN_REVISION",
            },
          }),
          prisma.tareaInstancia.count({
            where: {
              OR: [{ asignadoAId: m.id }, { ejecutadaRealmenteId: m.id }],
              estado: "BLOQUEADA",
            },
          }),
          prisma.tareaInstancia.count({
            where: {
              OR: [{ asignadoAId: m.id }, { ejecutadaRealmenteId: m.id }],
              estado: "VENCIDA",
              fechaEstimadaFin: { gte: inicio, lte: fin },
            },
          }),
        ]);

      const completadasCount =
        tareasAgg.find((t) => t.estado === "COMPLETADA")?._count ?? 0;
      const totalTareas = tareasAgg.reduce((s, t) => s + t._count, 0);

      const puntosEjePrograma = proyeccion.puntosOtorgadosReales;

      // Semáforo
      let semaforo: "verde" | "amarillo" | "rojo" = "verde";
      if (vencidas > 0 || (rangoMes?.cumplimientoKpis ?? 100) < 50) {
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
        puntosOtorgadosReales: puntosEjePrograma,
        topePuntos: TOPE_MENSUAL_COMPROMISOS,
        acumuladoBruto: proyeccion.acumuladoBruto,
        proyectadoPendiente: proyeccion.proyectadoPendiente,
        totalProyectado: proyeccion.totalProyectado,
        factorProrrateo: proyeccion.factor,
        cumplimientoKpis: rangoMes?.cumplimientoKpis ?? null,
        rangoActual: rangoMes?.rango ?? null,
        totalTareas,
        completadas: completadasCount,
        bloqueadas,
        vencidas,
        adHocPorValidar,
        semaforo,
      };
    }),
  );

  return filas;
}

/**
 * Tareas del miembro, agrupadas por estado para kanban del drill-down.
 */
export async function obtenerTareasDeMiembro(params: {
  userId: string;
  mes: number;
  anio: number;
}) {
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
    },
    orderBy: { fechaEstimadaFin: "asc" },
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
