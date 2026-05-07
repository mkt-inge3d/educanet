"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { requireAuth, requireRole } from "@/lib/auth"
import { parseBpmn, serializeBpmn } from "./bpmn-parser"
import { WEBINAR_BPMN, WEBINAR_BPMN_NOMBRE } from "./webinar-bpmn"
import type { BpmnParseado } from "./types"

// ── Crear definición ─────────────────────────────────────────────────────────

export async function crearDefinicionProceso(params: {
  nombre: string
  bpmn: BpmnParseado
  plantillaId?: string
}) {
  await requireAuth()

  const bpmnXml = serializeBpmn(params.bpmn)

  const definicion = await prisma.definicionProceso.create({
    data: {
      nombre: params.nombre,
      bpmnXml,
      version: 1,
      plantillaId: params.plantillaId ?? null,
      nodos: {
        create: params.bpmn.nodos.map((n) => ({
          bpmnElementId: n.bpmnElementId,
          nombre: n.nombre,
          tipo: n.tipo,
          carril: n.carril,
          fase: n.fase,
          puestoNombre: n.puestoNombre ?? null,
          duracionEstimadaMin: n.duracionEstimadaMin ?? null,
          posicion: n.posicion as Prisma.InputJsonValue,
          metadatos: n.metadatos ? (n.metadatos as Prisma.InputJsonValue) : Prisma.JsonNull,
        })),
      },
    },
    include: { nodos: true },
  })

  revalidatePath("/admin/procesos")
  return { ok: true, definicion }
}

// ── Seed: crear definición del webinar si no existe ───────────────────────────

export async function seedDefinicionWebinar() {
  await requireRole(["ADMIN"])

  const existe = await prisma.definicionProceso.findFirst({
    where: { nombre: WEBINAR_BPMN_NOMBRE },
    select: { id: true },
  })
  if (existe) return { ok: true, mensaje: "Ya existe", id: existe.id }

  const result = await crearDefinicionProceso({
    nombre: WEBINAR_BPMN_NOMBRE,
    bpmn: WEBINAR_BPMN,
  })

  return { ok: true, mensaje: "Creada", id: result.definicion.id }
}

// ── Listar definiciones ───────────────────────────────────────────────────────

export async function obtenerDefinicionesProceso() {
  await requireAuth()

  return prisma.definicionProceso.findMany({
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      nombre: true,
      version: true,
      creadoEn: true,
      plantillaId: true,
      plantilla: { select: { nombre: true } },
      _count: { select: { nodos: true, instancias: true } },
    },
  })
}

// ── Obtener una definición con sus nodos ─────────────────────────────────────

export async function obtenerDefinicionProceso(id: string) {
  await requireAuth()

  const definicion = await prisma.definicionProceso.findUnique({
    where: { id },
    include: {
      nodos: {
        orderBy: [{ fase: "asc" }, { carril: "asc" }],
      },
      plantilla: { select: { nombre: true } },
      _count: { select: { instancias: true } },
    },
  })
  if (!definicion) return null

  const bpmn = parseBpmn(definicion.bpmnXml)
  return { ...definicion, bpmn }
}

// ── Crear instancia de proceso para un workflow ───────────────────────────────

export async function crearInstanciaProceso(params: {
  definicionId: string
  workflowInstanciaId: string
  nombre: string
}) {
  await requireAuth()

  const definicion = await prisma.definicionProceso.findUniqueOrThrow({
    where: { id: params.definicionId },
    include: { nodos: true },
  })

  const instancia = await prisma.instanciaProceso.create({
    data: {
      nombre: params.nombre,
      definicionId: params.definicionId,
      workflowInstanciaId: params.workflowInstanciaId,
      versionDefinicion: definicion.version,
      estadosNodo: {
        create: definicion.nodos.map((nodo) => ({
          nodoProcesoId: nodo.id,
          estado: "PENDIENTE",
        })),
      },
    },
    include: { estadosNodo: true },
  })

  revalidatePath(`/admin/procesos/${params.definicionId}`)
  return { ok: true, instancia }
}
