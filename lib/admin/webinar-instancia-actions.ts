"use server"

import { addDays } from "date-fns"
import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { WEBINAR_TAREAS_V2 } from "@/lib/tareas/webinar-plantilla-v2"
import type { Negocio } from "@prisma/client"

export async function crearWorkflowWebinarV2(params: {
  plantillaId: string
  nombre: string
  fechaEvento: Date
  responsableGeneralId: string
  negocio?: Negocio | null
  calendarId?: string
  notas?: string
}): Promise<{ workflowInstanciaId: string; tareasCreadas: number } | { error: string }> {
  await requireAuth()

  try {
    // Construir mapa puesto → userId buscando usuarios del área del responsable
    const responsable = await prisma.user.findUnique({
      where: { id: params.responsableGeneralId },
      select: { areaId: true, organizationId: true },
    })
    if (!responsable?.organizationId) {
      return { error: "El responsable no tiene organización asignada" }
    }
    const organizationId = responsable.organizationId
    const usuariosArea = responsable?.areaId
      ? await prisma.user.findMany({
          where: { areaId: responsable.areaId, activo: true },
          select: { id: true, puesto: { select: { nombre: true } } },
        })
      : []
    const rolToUserId = new Map<string, string>()
    for (const u of usuariosArea) {
      if (u.puesto && !rolToUserId.has(u.puesto.nombre)) {
        rolToUserId.set(u.puesto.nombre, u.id)
      }
    }
    const asignarA = (puestoNombre: string) =>
      rolToUserId.get(puestoNombre) ?? params.responsableGeneralId

    const workflow = await prisma.workflowInstancia.create({
      data: {
        organizationId,
        plantillaId: params.plantillaId,
        nombre: params.nombre,
        negocio: params.negocio ?? null,
        fechaHito: params.fechaEvento,
        responsableGeneralId: params.responsableGeneralId,
        notas: params.notas ?? null,
        calendarId: params.calendarId ?? null,
        estadoGeneral: "ACTIVO",
      },
    })

    // Mapa: templateId → TareaInstancia.id real
    const idMap = new Map<string, string>()
    let ordenGantt = 0
    let tareasCreadas = 0

    const padres = WEBINAR_TAREAS_V2.filter((t) => !t.parentId)

    for (const padre of padres) {
      const hijos = WEBINAR_TAREAS_V2.filter((t) => t.parentId === padre.id)

      // Fecha inicio del padre = offset del padre
      const fechaInicio = addDays(params.fechaEvento, padre.offsetDias)

      // Fecha fin del padre = máximo de los fins de todos sus hijos (o propia duración si no tiene hijos)
      let fechaFin: Date
      if (hijos.length > 0) {
        const finales = hijos.map((h) => addDays(params.fechaEvento, h.offsetDias + h.duracionDias))
        fechaFin = finales.reduce((max, d) => (d > max ? d : max))
      } else {
        fechaFin = addDays(fechaInicio, padre.duracionDias)
      }

      const created = await prisma.tareaInstancia.create({
        data: {
          organizationId,
          workflowInstanciaId: workflow.id,
          asignadoAId: asignarA(padre.puestoNombre),
          nombreAdHoc: padre.nombre,
          fechaEstimadaInicio: fechaInicio,
          fechaEstimadaFin: fechaFin,
          estado: "PENDIENTE",
          esHito: padre.esHito ?? false,
          ordenGantt: ordenGantt++,
          duracionMinutos: hijos.length > 0 ? null : padre.duracionDias * 480,
          origen: "AUTO_WORKFLOW",
        },
      })
      idMap.set(padre.id, created.id)
      tareasCreadas++

      for (const hijo of hijos) {
        const hijoInicio = addDays(params.fechaEvento, hijo.offsetDias)
        const hijoFin = addDays(hijoInicio, hijo.duracionDias)

        const createdHijo = await prisma.tareaInstancia.create({
          data: {
            organizationId,
            workflowInstanciaId: workflow.id,
            asignadoAId: asignarA(hijo.puestoNombre),
            nombreAdHoc: hijo.nombre,
            fechaEstimadaInicio: hijoInicio,
            fechaEstimadaFin: hijoFin,
            estado: "PENDIENTE",
            esHito: false,
            ordenGantt: ordenGantt++,
            parentId: created.id,
            duracionMinutos: hijo.duracionDias * 480,
            origen: "AUTO_WORKFLOW",
          },
        })
        idMap.set(hijo.id, createdHijo.id)
        tareasCreadas++
      }
    }

    // Crear instancia del proceso BPMN si la definición existe
    const defProceso = await prisma.definicionProceso.findFirst({
      where: { nombre: "Proceso de Webinar" },
      select: { id: true, version: true, nodos: { select: { id: true } } },
    })
    if (defProceso) {
      await prisma.instanciaProceso.create({
        data: {
          nombre: params.nombre,
          definicionId: defProceso.id,
          workflowInstanciaId: workflow.id,
          versionDefinicion: defProceso.version,
          estadosNodo: {
            create: defProceso.nodos.map((n) => ({
              nodoProcesoId: n.id,
              estado: "PENDIENTE" as const,
            })),
          },
        },
      })
    }

    revalidatePath("/proyectos")
    revalidatePath("/tareas")
    revalidatePath("/flujograma")

    return { workflowInstanciaId: workflow.id, tareasCreadas }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear el proyecto webinar" }
  }
}
