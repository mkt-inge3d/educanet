import { prisma } from "@/lib/prisma"
import { cacheLife, cacheTag } from "next/cache"
import type { GanttTask, GanttDep } from "./layout"
import type { CalendarioGantt, HorarioSemanal } from "./types"

export type GanttWorkflow = {
  id: string
  nombre: string
  fechaHito: Date
  estadoGeneral: string
  modoReprogramacion: string
  baselineGuardadoEn: Date | null
  calendario: CalendarioGantt | null
  tasks: GanttTask[]
  deps: GanttDep[]
}

export async function obtenerGanttData(workflowId: string): Promise<GanttWorkflow | null> {
  "use cache"
  cacheLife("seconds")
  cacheTag("gantt", `gantt-${workflowId}`)

  const workflow = await prisma.workflowInstancia.findUnique({
    where: { id: workflowId },
    select: {
      id: true,
      nombre: true,
      fechaHito: true,
      estadoGeneral: true,
      modoReprogramacion: true,
      baselineGuardadoEn: true,
      calendario: {
        select: {
          id: true,
          nombre: true,
          timezone: true,
          horario: true,
          feriados: {
            select: { fecha: true, nombre: true, recurrente: true },
          },
        },
      },
      tareas: {
        where: { parentId: null },  // top-level only — recursively join below
        select: {
          id: true,
          catalogoTarea: { select: { nombre: true, tiempoMaximoMin: true } },
          nombreAdHoc: true,
          asignadoA: { select: { nombre: true, apellido: true, avatarUrl: true } },
          fechaEstimadaInicio: true,
          fechaEstimadaFin: true,
          progreso: true,
          esHito: true,
          ordenGantt: true,
          parentId: true,
          estaEnRutaCritica: true,
          baselineInicio: true,
          baselineFin: true,
          dependenciasComoSuces: {
            select: { id: true, predecesora: true, sucesora: true, tipo: true, lagMinutos: true },
          },
        },
        orderBy: [{ ordenGantt: "asc" }, { fechaEstimadaInicio: "asc" }],
      },
    },
  })

  if (!workflow) return null

  // Fetch ALL tasks (including subtareas) in one query
  const allTareas = await prisma.tareaInstancia.findMany({
    where: { workflowInstanciaId: workflowId },
    select: {
      id: true,
      catalogoTarea: { select: { nombre: true, tiempoMaximoMin: true } },
      nombreAdHoc: true,
      asignadoA: { select: { nombre: true, apellido: true, avatarUrl: true } },
      fechaEstimadaInicio: true,
      fechaEstimadaFin: true,
      progreso: true,
      esHito: true,
      ordenGantt: true,
      parentId: true,
      estaEnRutaCritica: true,
      baselineInicio: true,
      baselineFin: true,
      dependenciasComoSuces: {
        select: { id: true, predecesora: true, sucesora: true, tipo: true, lagMinutos: true },
      },
    },
    orderBy: [{ ordenGantt: "asc" }, { fechaEstimadaInicio: "asc" }],
  })

  const childIds = new Set(allTareas.filter((t) => t.parentId).map((t) => t.id))

  const tasks: GanttTask[] = allTareas.map((t) => ({
    id: t.id,
    nombre: t.catalogoTarea?.nombre ?? t.nombreAdHoc ?? "Tarea sin nombre",
    inicio: t.fechaEstimadaInicio,
    fin: t.fechaEstimadaFin,
    progreso: t.progreso,
    esHito: t.esHito,
    estaEnRutaCritica: t.estaEnRutaCritica,
    parentId: t.parentId,
    depth: 0, // computed client-side
    hasChildren: allTareas.some((other) => other.parentId === t.id),
    baselineInicio: t.baselineInicio,
    baselineFin: t.baselineFin,
    asignadoNombre: t.asignadoA.nombre,
    asignadoApellido: t.asignadoA.apellido,
    asignadoAvatar: t.asignadoA.avatarUrl,
    ordenGantt: t.ordenGantt,
    duracionMin: t.catalogoTarea?.tiempoMaximoMin ?? null,
  }))

  const deps: GanttDep[] = allTareas.flatMap((t) =>
    t.dependenciasComoSuces.map((d) => ({
      id: d.id,
      predecesora: d.predecesora,
      sucesora: d.sucesora,
      tipo: d.tipo,
      lagMinutos: d.lagMinutos,
    }))
  )

  let calendario: CalendarioGantt | null = null
  if (workflow.calendario) {
    calendario = {
      id: workflow.calendario.id,
      nombre: workflow.calendario.nombre,
      timezone: workflow.calendario.timezone,
      horario: workflow.calendario.horario as HorarioSemanal,
      feriados: workflow.calendario.feriados.map((f) => ({
        fecha: f.fecha,
        nombre: f.nombre,
        recurrente: f.recurrente,
      })),
    }
  }

  return {
    id: workflow.id,
    nombre: workflow.nombre,
    fechaHito: workflow.fechaHito,
    estadoGeneral: workflow.estadoGeneral,
    modoReprogramacion: workflow.modoReprogramacion,
    baselineGuardadoEn: workflow.baselineGuardadoEn,
    calendario,
    tasks,
    deps,
  }
}
