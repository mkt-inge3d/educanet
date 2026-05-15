import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import type { TipoEventoGamificacion } from "@prisma/client";
import { obtenerMiEquipoIds } from "@/lib/equipo/jefe";
import {
  contarPorTipo,
  usuariosActivos,
  type ItemActividad,
  type TipoActividad,
} from "./actividades-utils";

export {
  agruparPorMiembro,
  contarPorTipo,
  usuariosActivos,
  type GrupoMiembro,
  type ItemActividad,
  type TipoActividad,
} from "./actividades-utils";

export type ResumenActividad = {
  totalEventos: number;
  porTipo: Record<TipoActividad, number>;
  miembrosActivos: number;
  miembrosSinActividad: Array<{
    id: string;
    nombre: string;
    apellido: string;
    avatarUrl: string | null;
  }>;
};

function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

const EVENTOS_GAMIFICACION_RELEVANTES: TipoEventoGamificacion[] = [
  "KPI_HITO_APROBADO",
  "LECCION_COMPLETADA",
  "CURSO_COMPLETADO",
  "MISION_COMPLETADA",
  "RECONOCIMIENTO_RECIBIDO",
];

function tipoDesdeEvento(tipo: TipoEventoGamificacion): TipoActividad {
  switch (tipo) {
    case "KPI_HITO_APROBADO":
      return "KPI_APROBADO";
    case "LECCION_COMPLETADA":
    case "CURSO_COMPLETADO":
      return "LECCION";
    case "RECONOCIMIENTO_RECIBIDO":
      return "RECONOCIMIENTO";
    case "MISION_COMPLETADA":
      return "MISION";
    default:
      return "LECCION";
  }
}

function tituloDesdeEvento(
  tipo: TipoEventoGamificacion,
  metadatos: unknown,
): { titulo: string; descripcion?: string } {
  const m = (metadatos ?? {}) as Record<string, unknown>;
  const nombre = (m.nombre ?? m.titulo ?? m.tareaNombre ?? m.kpiNombre) as
    | string
    | undefined;
  switch (tipo) {
    case "KPI_HITO_APROBADO":
      return { titulo: nombre ?? "Hito de KPI aprobado" };
    case "LECCION_COMPLETADA":
      return { titulo: nombre ?? "Lección completada" };
    case "CURSO_COMPLETADO":
      return { titulo: nombre ?? "Curso completado" };
    case "MISION_COMPLETADA":
      return { titulo: nombre ?? "Misión completada" };
    case "RECONOCIMIENTO_RECIBIDO":
      return { titulo: "Reconocimiento recibido", descripcion: nombre };
    default:
      return { titulo: nombre ?? "Actividad" };
  }
}

export async function obtenerActividadDelEquipo(params: {
  areaId: string;
  jefeId: string;
  fecha: Date;
}): Promise<ItemActividad[]> {
  "use cache";
  cacheLife("minutes");
  const fechaIso = params.fecha.toISOString().slice(0, 10);
  cacheTag(
    "actividad-equipo",
    `actividad-equipo-${params.areaId}-${fechaIso}`,
  );

  const equipoIds = await obtenerMiEquipoIds(params.areaId, params.jefeId);
  if (equipoIds.length === 0) return [];

  const inicio = inicioDelDia(params.fecha);
  const fin = finDelDia(params.fecha);

  const [completadas, validadas, eventos] = await Promise.all([
    prisma.tareaInstancia.findMany({
      where: {
        asignadoAId: { in: equipoIds },
        estado: "COMPLETADA",
        completadaEn: { gte: inicio, lte: fin },
      },
      include: {
        asignadoA: {
          select: { id: true, nombre: true, apellido: true, avatarUrl: true },
        },
        catalogoTarea: { select: { nombre: true } },
        workflowInstancia: { select: { id: true, nombre: true } },
      },
      orderBy: { completadaEn: "desc" },
    }),
    prisma.tareaInstancia.findMany({
      where: {
        validadaPorJefeId: params.jefeId,
        asignadoAId: { in: equipoIds },
        validadaEn: { gte: inicio, lte: fin },
      },
      include: {
        asignadoA: {
          select: { id: true, nombre: true, apellido: true, avatarUrl: true },
        },
        catalogoTarea: { select: { nombre: true } },
        workflowInstancia: { select: { id: true, nombre: true } },
      },
      orderBy: { validadaEn: "desc" },
    }),
    prisma.eventoGamificacion.findMany({
      where: {
        userId: { in: equipoIds },
        tipo: { in: EVENTOS_GAMIFICACION_RELEVANTES },
        createdAt: { gte: inicio, lte: fin },
      },
      include: {
        user: {
          select: { id: true, nombre: true, apellido: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items: ItemActividad[] = [];

  for (const t of completadas) {
    if (!t.completadaEn) continue;
    const u = t.asignadoA;
    const titulo =
      t.catalogoTarea?.nombre ?? t.nombreAdHoc ?? "Tarea sin nombre";
    items.push({
      id: `tarea-comp-${t.id}`,
      timestamp: t.completadaEn,
      userId: u.id,
      userNombre: u.nombre,
      userApellido: u.apellido,
      userAvatar: u.avatarUrl,
      tipo: "TAREA_COMPLETADA",
      titulo,
      workflow: t.workflowInstancia?.nombre ?? null,
      referenciaUrl: t.workflowInstanciaId
        ? `/proyectos/${t.workflowInstanciaId}/gantt`
        : `/tareas/${t.id}`,
      puntos: t.puntosOtorgados || undefined,
    });
  }

  for (const t of validadas) {
    if (!t.validadaEn) continue;
    const u = t.asignadoA;
    const titulo =
      t.catalogoTarea?.nombre ?? t.nombreAdHoc ?? "Tarea sin nombre";
    items.push({
      id: `tarea-val-${t.id}`,
      timestamp: t.validadaEn,
      userId: u.id,
      userNombre: u.nombre,
      userApellido: u.apellido,
      userAvatar: u.avatarUrl,
      tipo: "TAREA_VALIDADA",
      titulo,
      workflow: t.workflowInstancia?.nombre ?? null,
      referenciaUrl: `/tareas/${t.id}`,
      puntos: t.puntosOtorgados || undefined,
    });
  }

  for (const e of eventos) {
    const u = e.user;
    const { titulo, descripcion } = tituloDesdeEvento(e.tipo, e.metadatos);
    const tipo = tipoDesdeEvento(e.tipo);
    let referenciaUrl: string | undefined;
    if (tipo === "KPI_APROBADO") referenciaUrl = "/mi-equipo/validacion-kpis";
    else if (tipo === "LECCION") referenciaUrl = "/cursos";
    items.push({
      id: `evento-${e.id}`,
      timestamp: e.createdAt,
      userId: u.id,
      userNombre: u.nombre,
      userApellido: u.apellido,
      userAvatar: u.avatarUrl,
      tipo,
      titulo,
      descripcion,
      referenciaUrl,
      puntos: e.cantidad || undefined,
    });
  }

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return items;
}

export async function obtenerResumenActividad(params: {
  areaId: string;
  jefeId: string;
  items: ItemActividad[];
}): Promise<ResumenActividad> {
  const equipo = await prisma.user.findMany({
    where: {
      areaId: params.areaId,
      activo: true,
      id: { not: params.jefeId },
    },
    select: { id: true, nombre: true, apellido: true, avatarUrl: true },
    orderBy: { nombre: "asc" },
  });

  const activos = usuariosActivos(params.items);
  const miembrosSinActividad = equipo.filter((u) => !activos.has(u.id));

  return {
    totalEventos: params.items.length,
    porTipo: contarPorTipo(params.items),
    miembrosActivos: activos.size,
    miembrosSinActividad,
  };
}
