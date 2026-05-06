import { requireAuth } from "@/lib/auth"
import { obtenerGanttData } from "@/lib/gantt/queries"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { GanttView } from "@/components/gantt/GanttView"

export const metadata = { title: "Gantt del proyecto" }

export default async function ProyectoGanttPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params

  // ADMIN y RRHH acceden sin restricción.
  // TRABAJADOR solo si tiene al menos una tarea en el workflow.
  if (user.rol === "TRABAJADOR") {
    const asignado = await prisma.tareaInstancia.findFirst({
      where: { workflowInstanciaId: id, asignadoAId: user.id },
      select: { id: true },
    })
    if (!asignado) redirect("/proyectos")
  }

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
