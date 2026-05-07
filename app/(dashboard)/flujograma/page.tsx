import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { seedDefinicionWebinar } from "@/lib/process/actions"
import { CrearWebinarDialog } from "@/components/flujograma/CrearWebinarDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Network, Calendar, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const metadata = { title: "Flujograma" }

async function obtenerProyectosConProceso(userId: string) {
  return prisma.workflowInstancia.findMany({
    where: {
      instanciaProceso: { isNot: null },
      OR: [
        { responsableGeneralId: userId },
        { tareas: { some: { asignadoAId: userId } } },
      ],
    },
    include: {
      plantilla: { select: { nombre: true } },
      instanciaProceso: {
        select: {
          id: true,
          estado: true,
          estadosNodo: { select: { estado: true } },
        },
      },
    },
    orderBy: { fechaHito: "asc" },
  })
}

const ESTADO_COLOR: Record<string, string> = {
  EN_CURSO:   "bg-blue-100 text-blue-700",
  COMPLETADO: "bg-green-100 text-green-700",
  PAUSADO:    "bg-amber-100 text-amber-700",
  CANCELADO:  "bg-muted text-muted-foreground",
}

export default async function FlujogramaPage() {
  const user = await requireAuth()

  // Auto-seed si aún no existe la definición
  await seedDefinicionWebinar()

  const [proyectos, plantillaWebinar, usuarios, calendarios] = await Promise.all([
    obtenerProyectosConProceso(user.id),
    prisma.workflowPlantilla.findFirst({
      where: { categoria: "WEBINAR", activo: true },
      select: { id: true },
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Flujograma</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vista del proceso BPMN por proyecto. Creá un webinar para generar
            su flujograma automáticamente.
          </p>
        </div>
        {plantillaWebinar && (
          <CrearWebinarDialog
            plantillaWebinarId={plantillaWebinar.id}
            usuarios={usuarios}
            calendarios={calendarios}
            currentUserId={user.id}
          />
        )}
      </div>

      {proyectos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Network className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay proyectos con flujograma todavía.
            </p>
            <p className="text-xs text-muted-foreground">
              Creá un nuevo webinar para generar el flujograma automáticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((proy) => {
            const inst = proy.instanciaProceso!
            const total = inst.estadosNodo.length
            const completados = inst.estadosNodo.filter((e) => e.estado === "COMPLETADO").length
            const activos = inst.estadosNodo.filter((e) => e.estado === "ACTIVO").length
            const progreso = total > 0 ? Math.round((completados / total) * 100) : 0

            return (
              <Card key={proy.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{proy.nombre}</CardTitle>
                    <Badge className={`shrink-0 text-[10px] ${ESTADO_COLOR[inst.estado] ?? ""}`}>
                      {inst.estado.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{proy.plantilla.nombre}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(proy.fechaHito), "d MMM yyyy", { locale: es })}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {completados}/{total} nodos
                    </span>
                    {activos > 0 && (
                      <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600">
                        {activos} activo{activos !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progreso</span>
                      <span>{progreso}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-violet-500 transition-all"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-xs"
                      render={<Link href={`/flujograma/${proy.id}`} />}
                    >
                      <Network className="h-3.5 w-3.5" />
                      Ver flujograma
                      <ArrowRight className="ml-auto h-3.5 w-3.5" />
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
