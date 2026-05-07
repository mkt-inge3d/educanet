import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { parseBpmn } from "@/lib/process/bpmn-parser"
import { BpmnDiagram } from "@/components/flujograma/BpmnDiagram"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { EstadoNodo } from "@prisma/client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const wf = await prisma.workflowInstancia.findUnique({ where: { id }, select: { nombre: true } })
  return { title: wf ? `Flujograma · ${wf.nombre}` : "Flujograma" }
}

async function obtenerDatos(workflowId: string, userId: string) {
  return prisma.workflowInstancia.findFirst({
    where: {
      id: workflowId,
      OR: [
        { responsableGeneralId: userId },
        { tareas: { some: { asignadoAId: userId } } },
      ],
    },
    select: {
      id: true,
      nombre: true,
      fechaHito: true,
      instanciaProceso: {
        select: {
          id: true,
          estado: true,
          definicion: { select: { nombre: true, version: true, bpmnXml: true } },
          estadosNodo: {
            select: {
              estado: true,
              nodoProceso: { select: { bpmnElementId: true } },
            },
          },
        },
      },
    },
  })
}

const ESTADO_WF_LABEL: Record<string, string> = {
  EN_CURSO:   "En curso",
  COMPLETADO: "Completado",
  PAUSADO:    "Pausado",
  CANCELADO:  "Cancelado",
}

export default async function FlujogramaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params
  const wf = await obtenerDatos(id, user.id)

  if (!wf?.instanciaProceso) notFound()

  const inst = wf.instanciaProceso
  const bpmn = parseBpmn(inst.definicion.bpmnXml)

  const estados: Record<string, EstadoNodo> = {}
  for (const en of inst.estadosNodo) {
    estados[en.nodoProceso.bpmnElementId] = en.estado
  }

  const total     = inst.estadosNodo.length
  const completados = inst.estadosNodo.filter((e) => e.estado === "COMPLETADO").length
  const activos    = inst.estadosNodo.filter((e) => e.estado === "ACTIVO").length

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3">
        <Link href="/flujograma">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{wf.nombre}</h1>
          <p className="text-xs text-muted-foreground">
            {inst.definicion.nombre} · v{inst.definicion.version} ·
            Hito: {format(new Date(wf.fechaHito), "d MMM yyyy", { locale: es })} ·
            <span className="ml-1 font-medium">{ESTADO_WF_LABEL[inst.estado] ?? inst.estado}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
            ✓ {completados}
          </span>
          {activos > 0 && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">
              ▶ {activos}
            </span>
          )}
          <span className="text-muted-foreground">{total} nodos</span>
          <Link href={`/proyectos/${wf.id}/gantt`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" />
              Gantt
            </Button>
          </Link>
        </div>
      </div>

      {/* Diagrama BPMN */}
      <div className="min-h-0 flex-1">
        <BpmnDiagram bpmn={bpmn} estados={estados} />
      </div>
    </div>
  )
}
