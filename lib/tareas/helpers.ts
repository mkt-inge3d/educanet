/**
 * Prompt 18 · Mejora UX jefe — helpers para manejar tareas con catálogo
 * Y tareas ad-hoc uniformemente.
 */
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { rangoMes, mesActual } from "@/lib/gamificacion/periodo";

// Re-export las funciones puras para que server-only consumers puedan seguir
// importando desde "./helpers" como antes.
export { datosTarea, TOPE_MENSUAL_TAREAS_OPERATIVAS } from "./tarea-datos";
import { TOPE_MENSUAL_TAREAS_OPERATIVAS } from "./tarea-datos";

/**
 * Prorrateo de puntos (opción B): si la proyección del mes (acumulado +
 * esta tarea + pendientes restantes del mes) excede el tope de
 * TAREAS_OPERATIVAS (350), se escalan proporcionalmente para que el total
 * llegue al tope.
 *
 * Nota: el motor seguirá aplicando el tope duro de 350 como último
 * recurso, así que este cálculo es una optimización para que ningún día
 * se otorgue "demasiado" anticipadamente.
 */
export async function calcularPuntosProrrateados(
  userId: string,
  puntosBaseTarea: number,
  opts?: { excluirTareaId?: string },
): Promise<{ puntosProrrateados: number; factorProrrateo: number; totalProyectado: number }> {
  const { mes, anio } = mesActual();
  const { inicio, fin } = rangoMes(mes, anio);

  // 1. Puntos brutos ya acumulados este mes por tareas completadas
  const eventos = await prisma.eventoGamificacion.aggregate({
    where: {
      userId,
      fuente: "TAREAS_OPERATIVAS",
      createdAt: { gte: inicio, lte: fin },
    },
    _sum: { cantidadBruta: true },
  });
  const acumuladoBruto = eventos._sum.cantidadBruta ?? 0;

  // 2. Puntos base proyectados de tareas pendientes (no completadas aún) que
  //    estén planeadas para cerrar este mes
  const pendientes = await prisma.tareaInstancia.findMany({
    where: {
      OR: [{ asignadoAId: userId }, { ejecutadaRealmenteId: userId }],
      estado: { in: ["PENDIENTE", "EN_PROGRESO", "BLOQUEADA"] },
      fechaEstimadaFin: { gte: inicio, lte: fin },
      ...(opts?.excluirTareaId ? { id: { not: opts.excluirTareaId } } : {}),
    },
    select: {
      catalogoTarea: { select: { puntosBase: true } },
      puntosBaseAdHoc: true,
    },
  });
  const proyectadoPendiente = pendientes.reduce((s, t) => {
    const base = t.catalogoTarea?.puntosBase ?? t.puntosBaseAdHoc ?? 0;
    return s + base;
  }, 0);

  const totalProyectado = acumuladoBruto + puntosBaseTarea + proyectadoPendiente;

  if (totalProyectado <= TOPE_MENSUAL_TAREAS_OPERATIVAS) {
    return {
      puntosProrrateados: puntosBaseTarea,
      factorProrrateo: 1,
      totalProyectado,
    };
  }

  const factor = TOPE_MENSUAL_TAREAS_OPERATIVAS / totalProyectado;
  return {
    puntosProrrateados: Math.max(1, Math.floor(puntosBaseTarea * factor)),
    factorProrrateo: Number(factor.toFixed(3)),
    totalProyectado,
  };
}

/**
 * Suma de puntos base proyectados del mes (completadas + pendientes) —
 * usado en UI para mostrar al usuario su carga estimada y el prorrateo.
 */
export async function obtenerProyeccionMesUsuario(userId: string): Promise<{
  acumuladoBruto: number;
  proyectadoPendiente: number;
  totalProyectado: number;
  factor: number;
  puntosOtorgadosReales: number;
}> {
  "use cache";
  cacheLife("minutes");
  cacheTag("tareas", `tareas-proyeccion-${userId}`);
  const { mes, anio } = mesActual();
  const { inicio, fin } = rangoMes(mes, anio);

  const eventosBruto = await prisma.eventoGamificacion.aggregate({
    where: {
      userId,
      fuente: "TAREAS_OPERATIVAS",
      createdAt: { gte: inicio, lte: fin },
    },
    _sum: { cantidadBruta: true, cantidad: true },
  });
  const acumuladoBruto = eventosBruto._sum.cantidadBruta ?? 0;
  const puntosOtorgadosReales = eventosBruto._sum.cantidad ?? 0;

  const pendientes = await prisma.tareaInstancia.findMany({
    where: {
      OR: [{ asignadoAId: userId }, { ejecutadaRealmenteId: userId }],
      estado: { in: ["PENDIENTE", "EN_PROGRESO", "BLOQUEADA"] },
      fechaEstimadaFin: { gte: inicio, lte: fin },
    },
    select: {
      catalogoTarea: { select: { puntosBase: true } },
      puntosBaseAdHoc: true,
    },
  });
  const proyectadoPendiente = pendientes.reduce((s, t) => {
    const base = t.catalogoTarea?.puntosBase ?? t.puntosBaseAdHoc ?? 0;
    return s + base;
  }, 0);

  const totalProyectado = acumuladoBruto + proyectadoPendiente;
  const factor =
    totalProyectado > TOPE_MENSUAL_TAREAS_OPERATIVAS
      ? TOPE_MENSUAL_TAREAS_OPERATIVAS / totalProyectado
      : 1;

  return {
    acumuladoBruto,
    proyectadoPendiente,
    totalProyectado,
    factor: Number(factor.toFixed(3)),
    puntosOtorgadosReales,
  };
}

/**
 * Verifica si un usuario es jefe del área de otro. Úsalo para gating de
 * acciones del jefe sobre empleados.
 */
export async function esJefeDelArea(
  jefeId: string,
  empleadoId: string,
): Promise<boolean> {
  const [jefe, empleado] = await Promise.all([
    prisma.user.findUnique({
      where: { id: jefeId },
      select: { areaId: true, puesto: { select: { nombre: true } } },
    }),
    prisma.user.findUnique({
      where: { id: empleadoId },
      select: { areaId: true },
    }),
  ]);

  if (!jefe || !empleado) return false;
  if (jefe.areaId !== empleado.areaId) return false;
  return jefe.puesto?.nombre?.startsWith("Jefe") ?? false;
}
