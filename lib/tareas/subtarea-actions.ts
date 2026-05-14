"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { EstadoTareaInstancia } from "@prisma/client"

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export async function crearSubtarea(params: {
  parentId: string
  nombre: string
  fechaInicio: string  // "yyyy-MM-dd"
  fechaFin: string     // "yyyy-MM-dd"
  responsableId?: string
}): Promise<Result<{ id: string }>> {
  await requireAuth()

  const padre = await prisma.tareaInstancia.findUnique({
    where: { id: params.parentId },
    select: { workflowInstanciaId: true, asignadoAId: true, organizationId: true },
  })
  if (!padre) return { success: false, error: "Tarea padre no encontrada" }

  const inicio = new Date(params.fechaInicio)
  const fin = new Date(params.fechaFin)
  if (fin < inicio) return { success: false, error: "La fecha de fin no puede ser anterior al inicio" }

  const maxOrden = await prisma.tareaInstancia.aggregate({
    where: { workflowInstanciaId: padre.workflowInstanciaId ?? undefined },
    _max: { ordenGantt: true },
  })

  const subtarea = await prisma.tareaInstancia.create({
    data: {
      organizationId: padre.organizationId,
      workflowInstanciaId: padre.workflowInstanciaId,
      asignadoAId: params.responsableId || padre.asignadoAId,
      nombreAdHoc: params.nombre,
      fechaEstimadaInicio: inicio,
      fechaEstimadaFin: fin,
      estado: "PENDIENTE",
      parentId: params.parentId,
      ordenGantt: (maxOrden._max.ordenGantt ?? 0) + 1,
      duracionMinutos: Math.round((fin.getTime() - inicio.getTime()) / 60000),
      origen: "AUTO_WORKFLOW",
    },
  })

  revalidatePath("/tareas")
  revalidatePath(`/tareas/${params.parentId}`)
  if (padre.workflowInstanciaId) {
    revalidatePath(`/proyectos/${padre.workflowInstanciaId}/gantt`)
  }

  return { success: true, data: { id: subtarea.id } }
}

export async function editarSubtarea(params: {
  tareaId: string
  nombre?: string
  fechaInicio?: string
  fechaFin?: string
  responsableId?: string
  estado?: EstadoTareaInstancia
}): Promise<Result> {
  await requireAuth()

  const tarea = await prisma.tareaInstancia.findUnique({
    where: { id: params.tareaId },
    select: { parentId: true, workflowInstanciaId: true },
  })
  if (!tarea?.parentId) return { success: false, error: "Solo se pueden editar subtareas" }

  const data: Record<string, unknown> = {}
  if (params.nombre !== undefined) data.nombreAdHoc = params.nombre
  if (params.fechaInicio) data.fechaEstimadaInicio = new Date(params.fechaInicio)
  if (params.fechaFin) data.fechaEstimadaFin = new Date(params.fechaFin)
  if (params.responsableId) data.asignadoAId = params.responsableId
  if (params.estado) data.estado = params.estado

  await prisma.tareaInstancia.update({ where: { id: params.tareaId }, data })

  revalidatePath("/tareas")
  revalidatePath(`/tareas/${tarea.parentId}`)
  if (tarea.workflowInstanciaId) {
    revalidatePath(`/proyectos/${tarea.workflowInstanciaId}/gantt`)
  }

  return { success: true }
}

export async function eliminarSubtarea(tareaId: string): Promise<Result> {
  await requireAuth()

  const tarea = await prisma.tareaInstancia.findUnique({
    where: { id: tareaId },
    select: { parentId: true, workflowInstanciaId: true },
  })
  if (!tarea?.parentId) return { success: false, error: "Solo se pueden eliminar subtareas" }

  await prisma.tareaInstancia.delete({ where: { id: tareaId } })

  revalidatePath("/tareas")
  revalidatePath(`/tareas/${tarea.parentId}`)
  if (tarea.workflowInstanciaId) {
    revalidatePath(`/proyectos/${tarea.workflowInstanciaId}/gantt`)
  }

  return { success: true }
}
