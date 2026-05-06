import { requireRole } from "@/lib/auth"
import { obtenerCalendario } from "@/lib/calendarios/queries"
import { notFound } from "next/navigation"
import { EditarCalendarioClient } from "./editar-calendario-client"

export const metadata = { title: "Admin · Editar calendario" }

export default async function EditarCalendarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(["ADMIN"])
  const { id } = await params
  const calendario = await obtenerCalendario(id)
  if (!calendario) notFound()

  return <EditarCalendarioClient calendario={calendario} />
}
