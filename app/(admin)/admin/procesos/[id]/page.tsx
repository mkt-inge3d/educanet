import { requireRole } from "@/lib/auth"
import { obtenerDefinicionProceso } from "@/lib/process/actions"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Circle, Diamond, Square, Milestone } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { TipoNodoBpmn } from "@prisma/client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: `Admin · Proceso ${id.slice(0, 8)}` }
}

const FASE_LABEL: Record<string, string> = {
  "pre-webinar": "Pre-Webinar",
  "webinar": "Webinar",
  "post-webinar": "Post-Webinar",
}

const TIPO_ICON: Record<TipoNodoBpmn, React.ComponentType<{ className?: string }>> = {
  EVENTO_INICIO: Circle,
  EVENTO_FIN: Circle,
  TAREA: Square,
  GATEWAY: Diamond,
}

const TIPO_LABEL: Record<TipoNodoBpmn, string> = {
  EVENTO_INICIO: "Inicio",
  EVENTO_FIN: "Fin",
  TAREA: "Tarea",
  GATEWAY: "Gateway",
}

const TIPO_COLOR: Record<TipoNodoBpmn, string> = {
  EVENTO_INICIO: "bg-green-100 text-green-800 border-green-200",
  EVENTO_FIN: "bg-red-100 text-red-800 border-red-200",
  TAREA: "bg-violet-100 text-violet-800 border-violet-200",
  GATEWAY: "bg-amber-100 text-amber-800 border-amber-200",
}

export default async function ProcesoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(["ADMIN"])
  const { id } = await params
  const definicion = await obtenerDefinicionProceso(id)
  if (!definicion) notFound()

  const fases = [...new Set(definicion.nodos.map((n) => n.fase))].sort()
  const carriles = [...new Set(definicion.nodos.map((n) => n.carril))]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/procesos">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{definicion.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            v{definicion.version} · Creado{" "}
            {format(new Date(definicion.creadoEn), "d MMM yyyy", { locale: es })} ·{" "}
            {definicion._count.instancias} instancias activas
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Nodos totales", value: definicion.nodos.length },
          { label: "Carriles", value: carriles.length },
          { label: "Fases", value: fases.length },
          { label: "Flujos", value: definicion.bpmn.flujos.length },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-violet-600">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nodos por fase */}
      {fases.map((fase) => {
        const nodosFase = definicion.nodos.filter((n) => n.fase === fase)
        return (
          <Card key={fase}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {FASE_LABEL[fase] ?? fase}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({nodosFase.length} nodos)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="p-2 text-left">Tipo</th>
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-left">Carril</th>
                      <th className="p-2 text-left">Puesto</th>
                      <th className="p-2 text-right">Duración est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodosFase.map((nodo) => {
                      const Icon = TIPO_ICON[nodo.tipo]
                      return (
                        <tr key={nodo.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="p-2">
                            <Badge
                              variant="outline"
                              className={`gap-1 text-xs ${TIPO_COLOR[nodo.tipo]}`}
                            >
                              <Icon className="h-3 w-3" />
                              {TIPO_LABEL[nodo.tipo]}
                            </Badge>
                          </td>
                          <td className="p-2 font-medium">{nodo.nombre}</td>
                          <td className="p-2 text-muted-foreground">{nodo.carril}</td>
                          <td className="p-2 text-muted-foreground">
                            {nodo.puestoNombre ?? "—"}
                          </td>
                          <td className="p-2 text-right text-muted-foreground">
                            {nodo.duracionEstimadaMin
                              ? `${nodo.duracionEstimadaMin} min`
                              : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Swimlanes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Carriles (swimlanes)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {carriles.map((carril) => {
              const count = definicion.nodos.filter((n) => n.carril === carril).length
              return (
                <Badge key={carril} variant="secondary" className="gap-1">
                  {carril}
                  <span className="text-muted-foreground">({count})</span>
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
