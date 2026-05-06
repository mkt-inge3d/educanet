"use server"

import { requireAuth } from "@/lib/auth"
import { crearWorkflowDesdeTemplate } from "@/lib/tareas/workflow-generator"
import { revalidatePath } from "next/cache"
import type { Negocio } from "@prisma/client"

export async function instanciarWorkflow(data: {
  plantillaId: string
  nombre: string
  contextoMarca?: string
  negocio?: Negocio | null
  fechaHito: Date
  responsableGeneralId: string
  calendarId?: string
  notas?: string
}) {
  await requireAuth()

  try {
    const result = await crearWorkflowDesdeTemplate({
      plantillaId: data.plantillaId,
      nombre: data.nombre,
      contextoMarca: data.contextoMarca,
      negocio: data.negocio,
      fechaHito: data.fechaHito,
      responsableGeneralId: data.responsableGeneralId,
      calendarId: data.calendarId,
      notas: data.notas,
    })

    revalidatePath("/admin/workflows")
    revalidatePath("/proyectos")
    return { ok: true, ...result }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear el proyecto" }
  }
}
