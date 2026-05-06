import { requireRole } from "@/lib/auth"
import { obtenerGanttData } from "@/lib/gantt/queries"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { GanttView } from "@/components/gantt/GanttView"

export const metadata = { title: "Gantt" }

export default async function GanttPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(["ADMIN", "RRHH"])
  const { id } = await params

  const [data, usuarios] = await Promise.all([
    obtenerGanttData(id),
    prisma.user.findMany({
      select: { id: true, nombre: true, apellido: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
  ])

  if (!data) notFound()

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      <GanttView
        workflowId={id}
        projectName={data.nombre}
        tasks={data.tasks}
        deps={data.deps}
        calendario={data.calendario}
        hasBaseline={data.baselineGuardadoEn !== null}
        usuarios={usuarios}
      />
    </div>
  )
}
