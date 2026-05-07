import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart2, Circle, Square, Diamond } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { EstadoNodo, TipoNodoBpmn } from "@prisma/client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const wf = await prisma.workflowInstancia.findUnique({ where: { id }, select: { nombre: true } })
  return { title: wf ? `Flujograma · ${wf.nombre}` : "Flujograma" }
}

async function obtenerInstanciaProceso(workflowId: string, userId: string) {
  return prisma.workflowInstancia.findFirst({
    where: {
      id: workflowId,
      OR: [
        { responsableGeneralId: userId },
        { tareas: { some: { asignadoAId: userId } } },
      ],
    },
    include: {
      plantilla: { select: { nombre: true } },
      responsableGeneral: { select: { nombre: true, apellido: true } },
      instanciaProceso: {
        include: {
          definicion: { select: { nombre: true, version: true } },
          estadosNodo: {
            include: {
              nodoProceso: true,
            },
            orderBy: [{ nodoProceso: { fase: "asc" } }],
          },
        },
      },
    },
  })
}

const ESTADO_COLOR: Record<EstadoNodo, string> = {
  PENDIENTE:  "bg-muted text-muted-foreground border-muted-foreground/30",
  ACTIVO:     "bg-blue-100 text-blue-700 border-blue-300",
  COMPLETADO: "bg-green-100 text-green-700 border-green-300",
  BLOQUEADO:  "bg-red-100 text-red-700 border-red-300",
  OMITIDO:    "bg-muted text-muted-foreground/50 border-muted line-through",
}

const ESTADO_LABEL: Record<EstadoNodo, string> = {
  PENDIENTE:  "Pendiente",
  ACTIVO:     "Activo",
  COMPLETADO: "Completado",
  BLOQUEADO:  "Bloqueado",
  OMITIDO:    "Omitido",
}

const TIPO_ICON: Record<TipoNodoBpmn, React.ComponentType<{ className?: string }>> = {
  EVENTO_INICIO: Circle,
  EVENTO_FIN:    Circle,
  TAREA:         Square,
  GATEWAY:       Diamond,
}

const FASE_LABEL: Record<string, string> = {
  "pre-webinar":  "Pre-Webinar",
  "webinar":      "Webinar",
  "post-webinar": "Post-Webinar",
}

export default async function FlujogramaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params
  const wf = await obtenerInstanciaProceso(id, user.id)
  if (!wf || !wf.instanciaProceso) notFound()

  const inst = wf.instanciaProceso
  const total = inst.estadosNodo.length
  const completados = inst.estadosNodo.filter((e) => e.estado === "COMPLETADO").length
  const activos    = inst.estadosNodo.filter((e) => e.estado === "ACTIVO").length

  // Agrupar por fase
  const porFase = new Map<string, typeof inst.estadosNodo>()
  for (const en of inst.estadosNodo) {
    const fase = en.nodoProceso.fase
    if (!porFase.has(fase)) porFase.set(fase, [])
    porFase.get(fase)!.push(en)
  }
  const fasesOrden = ["pre-webinar", "webinar", "post-webinar"]
  const fases = fasesOrden.filter((f) => porFase.has(f))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/flujograma">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{wf.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {inst.definicion.nombre} · v{inst.definicion.version} ·{" "}
            Hito: {format(new Date(wf.fechaHito), "d MMM yyyy", { locale: es })}
          </p>
        </div>
        <Link href={`/proyectos/${wf.id}/gantt`}>
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <BarChart2 className="h-4 w-4" />
            Ver Gantt
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total nodos", value: total, color: "text-foreground" },
          { label: "Completados", value: completados, color: "text-green-600" },
          { label: "Activos",     value: activos,     color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nodos por fase */}
      {fases.map((fase) => {
        const nodos = porFase.get(fase)!
        // Agrupar por carril dentro de la fase
        const porCarril = new Map<string, typeof nodos>()
        for (const en of nodos) {
          const c = en.nodoProceso.carril
          if (!porCarril.has(c)) porCarril.set(c, [])
          porCarril.get(c)!.push(en)
        }

        return (
          <Card key={fase}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {FASE_LABEL[fase] ?? fase}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from(porCarril.entries()).map(([carril, enNodos]) => (
                <div key={carril}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {carril}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {enNodos.map((en) => {
                      const Icon = TIPO_ICON[en.nodoProceso.tipo]
                      return (
                        <div
                          key={en.id}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${ESTADO_COLOR[en.estado]}`}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          {en.nodoProceso.nombre}
                          {en.nodoProceso.duracionEstimadaMin && (
                            <span className="opacity-60">
                              · {en.nodoProceso.duracionEstimadaMin}m
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
