"use server"

import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { rescheduleSuccessors, computeCriticalPath } from "./scheduler"
import type { CalendarioGantt, HorarioSemanal } from "./types"

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireWorkflowAccess(workflowId: string) {
  const user = await requireAuth()
  if (user.rol === "ADMIN" || user.rol === "RRHH") return user
  const wf = await prisma.workflowInstancia.findFirst({
    where: {
      id: workflowId,
      OR: [
        { responsableGeneralId: user.id },
        { tareas: { some: { asignadoAId: user.id } } },
      ],
    },
    select: { id: true },
  })
  if (!wf) redirect("/unauthorized")
  return user
}

function invalidarGantt(workflowId: string) {
  revalidatePath(`/admin/workflows/${workflowId}/gantt`)
}

async function obtenerCalendario(workflowId: string): Promise<CalendarioGantt | null> {
  const wf = await prisma.workflowInstancia.findUnique({
    where: { id: workflowId },
    select: {
      calendario: {
        select: {
          id: true,
          nombre: true,
          timezone: true,
          horario: true,
          feriados: { select: { fecha: true, nombre: true, recurrente: true } },
        },
      },
    },
  })
  if (!wf?.calendario) return null
  return {
    id: wf.calendario.id,
    nombre: wf.calendario.nombre,
    timezone: wf.calendario.timezone,
    horario: wf.calendario.horario as HorarioSemanal,
    feriados: wf.calendario.feriados.map((f) => ({
      fecha: f.fecha,
      nombre: f.nombre,
      recurrente: f.recurrente,
    })),
  }
}

async function obtenerTodasLasTareas(workflowId: string) {
  return prisma.tareaInstancia.findMany({
    where: { workflowInstanciaId: workflowId },
    select: {
      id: true,
      fechaEstimadaInicio: true,
      fechaEstimadaFin: true,
      duracionMinutos: true,
      dependenciasComoSuces: {
        select: { predecesora: true, sucesora: true, tipo: true, lagMinutos: true },
      },
    },
  })
}

async function aplicarCPM(workflowId: string, cal: CalendarioGantt | null) {
  const tareas = await obtenerTodasLasTareas(workflowId)
  const deps = tareas.flatMap((t) => t.dependenciasComoSuces)
  const nodes = tareas.map((t) => ({
    id: t.id,
    inicio: t.fechaEstimadaInicio,
    fin: t.fechaEstimadaFin,
    duracionMinutos: t.duracionMinutos ?? 480,
  }))
  const criticas = computeCriticalPath(nodes, deps, cal)
  await prisma.$transaction(
    tareas.map((t) =>
      prisma.tareaInstancia.update({
        where: { id: t.id },
        data: { estaEnRutaCritica: criticas.has(t.id) },
      })
    )
  )
  return criticas
}

// ── Mover / redimensionar tarea ───────────────────────────────────────────────

export async function moverTarea(
  workflowId: string,
  tareaId: string,
  nuevoInicio: Date,
  nuevoFin: Date
) {
  await requireWorkflowAccess(workflowId)

  const dur = Math.round((nuevoFin.getTime() - nuevoInicio.getTime()) / 60_000)

  const [cal, tareas] = await Promise.all([
    obtenerCalendario(workflowId),
    obtenerTodasLasTareas(workflowId),
  ])

  const deps = tareas.flatMap((t) => t.dependenciasComoSuces)
  const nodes = tareas.map((t) => ({
    id: t.id,
    inicio: t.fechaEstimadaInicio,
    fin: t.fechaEstimadaFin,
    duracionMinutos: t.duracionMinutos ?? 480,
  }))

  const updates = rescheduleSuccessors(tareaId, nuevoInicio, nuevoFin, nodes, deps, cal)
  updates.set(tareaId, { inicio: nuevoInicio, fin: nuevoFin })

  await prisma.$transaction([
    // Actualizar tarea raíz
    prisma.tareaInstancia.update({
      where: { id: tareaId },
      data: { fechaEstimadaInicio: nuevoInicio, fechaEstimadaFin: nuevoFin, duracionMinutos: dur, version: { increment: 1 } },
    }),
    // Actualizar sucesores afectados
    ...Array.from(updates.entries())
      .filter(([id]) => id !== tareaId)
      .map(([id, { inicio, fin }]) =>
        prisma.tareaInstancia.update({
          where: { id },
          data: {
            fechaEstimadaInicio: inicio,
            fechaEstimadaFin: fin,
            duracionMinutos: Math.round((fin.getTime() - inicio.getTime()) / 60_000),
          },
        })
      ),
  ])

  await aplicarCPM(workflowId, cal)
  invalidarGantt(workflowId)

  return { ok: true, updates: Object.fromEntries(updates) }
}

// ── Crear tarea en el Gantt ───────────────────────────────────────────────────

export async function crearTareaGantt(
  workflowId: string,
  data: {
    nombre: string
    inicio: Date
    fin: Date
    asignadoAId: string
    esHito: boolean
    parentId?: string | null
  }
) {
  await requireWorkflowAccess(workflowId)

  const dur = data.esHito
    ? 0
    : Math.round((data.fin.getTime() - data.inicio.getTime()) / 60_000)

  const maxOrden = await prisma.tareaInstancia.aggregate({
    where: { workflowInstanciaId: workflowId },
    _max: { ordenGantt: true },
  })

  const tarea = await prisma.tareaInstancia.create({
    data: {
      workflowInstanciaId: workflowId,
      asignadoAId: data.asignadoAId,
      nombreAdHoc: data.nombre,
      fechaEstimadaInicio: data.inicio,
      fechaEstimadaFin: data.esHito ? data.inicio : data.fin,
      duracionMinutos: dur,
      esHito: data.esHito,
      parentId: data.parentId ?? null,
      ordenGantt: (maxOrden._max.ordenGantt ?? 0) + 1,
      origen: "AUTO_WORKFLOW",
    },
  })

  const cal = await obtenerCalendario(workflowId)
  await aplicarCPM(workflowId, cal)
  invalidarGantt(workflowId)

  return { ok: true, id: tarea.id }
}

// ── Eliminar tarea ────────────────────────────────────────────────────────────

export async function eliminarTareaGantt(workflowId: string, tareaId: string) {
  await requireWorkflowAccess(workflowId)
  await prisma.tareaInstancia.delete({ where: { id: tareaId } })
  const cal = await obtenerCalendario(workflowId)
  await aplicarCPM(workflowId, cal)
  invalidarGantt(workflowId)
  return { ok: true }
}

// ── Dependencias ──────────────────────────────────────────────────────────────

export async function crearDependencia(
  workflowId: string,
  predId: string,
  sucId: string,
  tipo: "FIN_A_INICIO" | "FIN_A_FIN" | "INICIO_A_INICIO" | "INICIO_A_FIN" = "FIN_A_INICIO",
  lagMinutos = 0
) {
  await requireWorkflowAccess(workflowId)

  // Detectar ciclo simple: el sucesor no puede ser antecesor transitivo del predecesor
  const existeDep = await prisma.dependenciaInstancia.findFirst({
    where: { predecesora: sucId, sucesora: predId },
  })
  if (existeDep) return { error: "Esta dependencia crearía un ciclo" }

  await prisma.dependenciaInstancia.upsert({
    where: { predecesora_sucesora: { predecesora: predId, sucesora: sucId } },
    create: { predecesora: predId, sucesora: sucId, tipo, lagMinutos },
    update: { tipo, lagMinutos },
  })

  const cal = await obtenerCalendario(workflowId)
  await aplicarCPM(workflowId, cal)
  invalidarGantt(workflowId)
  return { ok: true }
}

export async function eliminarDependencia(workflowId: string, depId: string) {
  await requireAuth()
  await prisma.dependenciaInstancia.delete({ where: { id: depId } })
  const cal = await obtenerCalendario(workflowId)
  await aplicarCPM(workflowId, cal)
  invalidarGantt(workflowId)
  return { ok: true }
}

// ── Reordenar tareas ──────────────────────────────────────────────────────────

export async function reordenarTareas(
  workflowId: string,
  orden: { id: string; ordenGantt: number }[]
) {
  await requireWorkflowAccess(workflowId)
  await prisma.$transaction(
    orden.map(({ id, ordenGantt }) =>
      prisma.tareaInstancia.update({ where: { id }, data: { ordenGantt } })
    )
  )
  invalidarGantt(workflowId)
  return { ok: true }
}

// ── Actualizar progreso ───────────────────────────────────────────────────────

export async function actualizarProgreso(workflowId: string, tareaId: string, progreso: number) {
  await requireWorkflowAccess(workflowId)
  if (progreso < 0 || progreso > 100) return { error: "Progreso debe ser 0-100" }
  await prisma.tareaInstancia.update({
    where: { id: tareaId },
    data: { progreso },
  })
  invalidarGantt(workflowId)
  return { ok: true }
}

// ── Baseline ──────────────────────────────────────────────────────────────────

export async function guardarBaseline(workflowId: string) {
  await requireWorkflowAccess(workflowId)
  const tareas = await prisma.tareaInstancia.findMany({
    where: { workflowInstanciaId: workflowId },
    select: { id: true, fechaEstimadaInicio: true, fechaEstimadaFin: true, duracionMinutos: true },
  })

  await prisma.$transaction([
    ...tareas.map((t) =>
      prisma.tareaInstancia.update({
        where: { id: t.id },
        data: {
          baselineInicio: t.fechaEstimadaInicio,
          baselineFin: t.fechaEstimadaFin,
          baselineDuracion: t.duracionMinutos,
        },
      })
    ),
    prisma.workflowInstancia.update({
      where: { id: workflowId },
      data: { baselineGuardadoEn: new Date() },
    }),
  ])

  invalidarGantt(workflowId)
  return { ok: true }
}

export async function limpiarBaseline(workflowId: string) {
  await requireWorkflowAccess(workflowId)
  const tareas = await prisma.tareaInstancia.findMany({
    where: { workflowInstanciaId: workflowId },
    select: { id: true },
  })

  await prisma.$transaction([
    ...tareas.map((t) =>
      prisma.tareaInstancia.update({
        where: { id: t.id },
        data: { baselineInicio: null, baselineFin: null, baselineDuracion: null },
      })
    ),
    prisma.workflowInstancia.update({
      where: { id: workflowId },
      data: { baselineGuardadoEn: null },
    }),
  ])

  invalidarGantt(workflowId)
  return { ok: true }
}
