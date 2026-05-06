"use server"

import { requireRole } from "@/lib/auth"
import { crearWorkflowDesdeTemplate } from "@/lib/tareas/workflow-generator"
import { revalidatePath } from "next/cache"

export async function instanciarWorkflow(data: {
  plantillaId: string
  nombre: string
  contextoMarca?: string
  fechaHito: Date
  responsableGeneralId: string
  calendarId?: string
  notas?: string
}) {
  await requireRole(["ADMIN", "RRHH"])

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
  return { ok: true, ...result }
}
