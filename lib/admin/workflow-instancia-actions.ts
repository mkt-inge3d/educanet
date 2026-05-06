"use server"

import { requireAuth } from "@/lib/auth"
import { crearWorkflowDesdeTemplate } from "@/lib/tareas/workflow-generator"
import { revalidatePath, revalidateTag } from "next/cache"

export async function instanciarWorkflow(data: {
  plantillaId: string
  nombre: string
  contextoMarca?: string
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
      fechaHito: data.fechaHito,
      responsableGeneralId: data.responsableGeneralId,
      calendarId: data.calendarId,
      notas: data.notas,
    })

    revalidatePath("/admin/workflows")
    revalidatePath("/proyectos")
    revalidateTag("workflows")
    return { ok: true, ...result }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear el proyecto" }
  }
}
