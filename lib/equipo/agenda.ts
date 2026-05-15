import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import {
  clasificarCarga,
  type FilaMiembroAgenda,
  type TareaPlanificada,
} from "./agenda-utils";

export {
  clasificarCarga,
  tareaEnElDia,
  resumirAgenda,
  type FilaMiembroAgenda,
  type ResumenAgenda,
  type SemaforoCarga,
  type TareaPlanificada,
} from "./agenda-utils";

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

export async function obtenerAgendaDelEquipo(params: {
  areaId: string;
  jefeId: string;
  fecha: Date;
}): Promise<FilaMiembroAgenda[]> {
  "use cache";
  cacheLife("minutes");
  const fechaIso = params.fecha.toISOString().slice(0, 10);
  cacheTag(
    "agenda-equipo",
    `agenda-equipo-${params.areaId}-${fechaIso}`,
  );

  const inicio = inicioDelDia(params.fecha);
  const fin = finDelDia(params.fecha);

  const miembros = await prisma.user.findMany({
    where: {
      areaId: params.areaId,
      activo: true,
      id: { not: params.jefeId },
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      avatarUrl: true,
      puesto: { select: { nombre: true } },
    },
    orderBy: { nombre: "asc" },
  });

  if (miembros.length === 0) return [];

  const ids = miembros.map((m) => m.id);

  const tareas = await prisma.tareaInstancia.findMany({
    where: {
      asignadoAId: { in: ids },
      estado: { notIn: ["COMPLETADA", "OMITIDA"] },
      fechaEstimadaInicio: { lte: fin },
      fechaEstimadaFin: { gte: inicio },
    },
    select: {
      id: true,
      asignadoAId: true,
      estado: true,
      esHito: true,
      requiereValidacionJefe: true,
      fechaEstimadaInicio: true,
      fechaEstimadaFin: true,
      nombreAdHoc: true,
      catalogoTarea: { select: { nombre: true } },
      workflowInstancia: { select: { id: true, nombre: true } },
    },
    orderBy: [{ fechaEstimadaInicio: "asc" }, { fechaEstimadaFin: "asc" }],
  });

  const mapaTareas = new Map<string, TareaPlanificada[]>();
  for (const t of tareas) {
    const titulo =
      t.catalogoTarea?.nombre ?? t.nombreAdHoc ?? "Tarea sin nombre";
    const lista = mapaTareas.get(t.asignadoAId) ?? [];
    lista.push({
      id: t.id,
      titulo,
      estado: t.estado,
      workflowId: t.workflowInstancia?.id ?? null,
      workflowNombre: t.workflowInstancia?.nombre ?? null,
      fechaInicio: t.fechaEstimadaInicio,
      fechaFin: t.fechaEstimadaFin,
      esHito: t.esHito,
      requiereValidacionJefe: t.requiereValidacionJefe,
    });
    mapaTareas.set(t.asignadoAId, lista);
  }

  return miembros.map((m) => {
    const tareasDelMiembro = mapaTareas.get(m.id) ?? [];
    return {
      userId: m.id,
      nombre: m.nombre,
      apellido: m.apellido,
      avatarUrl: m.avatarUrl,
      puestoNombre: m.puesto?.nombre ?? "Sin puesto",
      tareas: tareasDelMiembro,
      carga: clasificarCarga(tareasDelMiembro.length),
    };
  });
}
