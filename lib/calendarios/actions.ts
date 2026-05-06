"use server"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { crearCalendarioSchema, actualizarCalendarioSchema, feriadoSchema } from "./schemas"
import type { CrearCalendarioInput, FeriadoInput } from "./schemas"

function invalidar() {
  revalidatePath("/admin/calendarios")
}

export async function crearCalendario(data: CrearCalendarioInput) {
  await requireRole(["ADMIN"])
  const parsed = crearCalendarioSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  if (parsed.data.esDefault) {
    await prisma.calendarioLaboral.updateMany({ data: { esDefault: false } })
  }

  const calendario = await prisma.calendarioLaboral.create({
    data: {
      nombre: parsed.data.nombre,
      timezone: parsed.data.timezone,
      horario: parsed.data.horario,
      esDefault: parsed.data.esDefault ?? false,
    },
  })

  invalidar()
  return { ok: true, id: calendario.id }
}

export async function actualizarCalendario(id: string, data: Partial<CrearCalendarioInput>) {
  await requireRole(["ADMIN"])
  const parsed = actualizarCalendarioSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  if (parsed.data.esDefault) {
    await prisma.calendarioLaboral.updateMany({
      where: { id: { not: id } },
      data: { esDefault: false },
    })
  }

  await prisma.calendarioLaboral.update({ where: { id }, data: parsed.data })

  invalidar()
  return { ok: true }
}

export async function eliminarCalendario(id: string) {
  await requireRole(["ADMIN"])

  const proyectos = await prisma.workflowInstancia.count({ where: { calendarId: id } })
  if (proyectos > 0) {
    return { error: `No se puede eliminar: ${proyectos} proyecto(s) lo usan` }
  }

  await prisma.calendarioLaboral.delete({ where: { id } })
  invalidar()
  return { ok: true }
}

export async function marcarComoDefault(id: string) {
  await requireRole(["ADMIN"])
  await prisma.$transaction([
    prisma.calendarioLaboral.updateMany({ data: { esDefault: false } }),
    prisma.calendarioLaboral.update({ where: { id }, data: { esDefault: true } }),
  ])
  invalidar()
  return { ok: true }
}

export async function crearFeriado(calendarId: string, data: FeriadoInput) {
  await requireRole(["ADMIN"])
  const parsed = feriadoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await prisma.feriado.create({
    data: {
      calendarId,
      fecha: new Date(parsed.data.fecha),
      nombre: parsed.data.nombre,
      recurrente: parsed.data.recurrente,
      tipo: parsed.data.tipo,
    },
  })

  invalidar()
  return { ok: true }
}

export async function eliminarFeriado(feriadoId: string, _calendarId: string) {
  await requireRole(["ADMIN"])
  await prisma.feriado.delete({ where: { id: feriadoId } })
  invalidar()
  return { ok: true }
}
