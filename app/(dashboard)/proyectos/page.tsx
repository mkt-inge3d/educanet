import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { BarChart2, Calendar, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CrearProyectoDialog } from "@/components/proyectos/CrearProyectoDialog"

export const metadata = { title: "Mis proyectos" }

async function obtenerMisWorkflows(userId: string) {
  return prisma.workflowInstancia.findMany({
    where: {
      estadoGeneral: { in: ["ACTIVO", "PAUSADO"] },
      OR: [
        { tareas: { some: { asignadoAId: userId } } },
        { responsableGeneralId: userId },
      ],
    },
    include: {
      plantilla: { select: { nombre: true, categoria: true } },
      responsableGeneral: { select: { nombre: true, apellido: true } },
      tareas: { select: { estado: true, asignadoAId: true } },
    },
    orderBy: { fechaHito: "asc" },
  })
}

const ESTADO_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  PAUSADO: "Pausado",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
}

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PAUSADO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETADO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CANCELADO: "bg-muted text-muted-foreground",
}

export default async function ProyectosPage() {
  const user = await requireAuth()

  const [workflows, plantillas, usuarios, calendarios] = await Promise.all([
    obtenerMisWorkflows(user.id),
    prisma.workflowPlantilla.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, categoria: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, nombre: true, apellido: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
    prisma.calendarioLaboral.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mis proyectos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workflows en los que tenés tareas asignadas.
          </p>
        </div>
        {plantillas.length > 0 && (
          <CrearProyectoDialog
            plantillas={plantillas}
            usuarios={usuarios}
            calendarios={calendarios}
            currentUserId={user.id}
          />
        )}
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No tenés proyectos asignados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workflows.map((wf) => {
            const totalTareas = wf.tareas.length
            const misTareas = wf.tareas.filter((t) => t.asignadoAId === user.id).length
            const completadas = wf.tareas.filter((t) => t.estado === "COMPLETADA").length
            const progreso = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0
            const diasRestantes = Math.ceil(
              (new Date(wf.fechaHito).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )

            return (
              <Card key={wf.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-snug">{wf.nombre}</CardTitle>
                      {wf.contextoMarca && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{wf.contextoMarca}</p>
                      )}
                    </div>
                    <Badge className={`shrink-0 text-[10px] ${ESTADO_COLOR[wf.estadoGeneral] ?? ""}`}>
                      {ESTADO_LABEL[wf.estadoGeneral] ?? wf.estadoGeneral}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  {/* Plantilla */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{wf.plantilla.nombre}</Badge>
                    <Badge variant="outline">{wf.plantilla.categoria}</Badge>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Hito: <span className="font-medium text-foreground">
                          {new Date(wf.fechaHito).toLocaleDateString("es", { day: "numeric", month: "short" })}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {diasRestantes > 0
                          ? <><span className="font-medium text-foreground">{diasRestantes}d</span> restantes</>
                          : <span className="font-medium text-red-600">Vencido</span>
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        <span className="font-medium text-foreground">{misTareas}</span> tarea{misTareas !== 1 ? "s" : ""} mías
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      Resp.: <span className="font-medium text-foreground">
                        {wf.responsableGeneral.nombre} {wf.responsableGeneral.apellido}
                      </span>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progreso general</span>
                      <span className="tabular-nums">{completadas}/{totalTareas}</span>
                    </div>
                    <Progress value={progreso} className="h-1.5" />
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      render={<Link href={`/proyectos/${wf.id}/gantt`} />}
                    >
                      <BarChart2 className="mr-1.5 h-3.5 w-3.5" />
                      Ver Gantt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
