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

// Palabras clave para derivar el estado de cada nodo BPMN desde TareaInstancia.nombreAdHoc.
// Un nodo es COMPLETADO cuando TODAS las tareas que coinciden están COMPLETADA.
// Un nodo es ACTIVO cuando ALGUNA tarea coincide con EN_PROGRESO o EN_REVISION.
const TASK_KEYWORDS: Record<string, string[]> = {
  task_kickoff:        ["KickOff", "Ficha Técnica"],
  task_seo_titulo:     ["Optimización SEO del Título"],
  task_sondeo:         ["Sondeo"],
  task_piezas:         ["Piezas Gráficas"],
  task_teams:          ["Teams"],
  task_publicidad:     ["Publicidad"],
  task_landing:        ["Landing Page"],
  task_recordatorios:  ["Encuesta", "Certificado", "Presentación Comercial"],
  task_webinar_vivo:   ["Día del Evento"],
  task_edicion:        ["Video YouTube"],
  task_email_post:     ["Mail agradecimiento"],
  task_carga_lms:      ["Artículo Landing"],
  task_seo_post:       ["Ficha Postwebinar"],
  task_informe:        ["Informe de Resultados"],
}

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
        },
      },
      tareas: {
        where: { parentId: null },
        select: { nombreAdHoc: true, estado: true },
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

  // Derivar estados desde tareas (ev_inicio siempre COMPLETADO al existir la instancia)
  const estados: Record<string, EstadoNodo> = { ev_inicio: "COMPLETADO" }
  for (const [bpmnId, keywords] of Object.entries(TASK_KEYWORDS)) {
    const matching = wf.tareas.filter(
      (t) => t.nombreAdHoc && keywords.some((kw) => t.nombreAdHoc!.includes(kw))
    )
    if (matching.length === 0) continue
    const allDone   = matching.every((t) => t.estado === "COMPLETADA")
    const anyProgress = matching.some((t) =>
      t.estado === "COMPLETADA" || t.estado === "EN_PROGRESO" || t.estado === "EN_REVISION"
    )
    if (allDone) estados[bpmnId] = "COMPLETADO"
    else if (anyProgress) estados[bpmnId] = "ACTIVO"
  }

  const total      = bpmn.nodos.filter((n) => n.tipo === "TAREA").length
  const completados = bpmn.nodos.filter((n) => n.tipo === "TAREA" && estados[n.bpmnElementId] === "COMPLETADO").length
  const activos    = bpmn.nodos.filter((n) => n.tipo === "TAREA" && estados[n.bpmnElementId] === "ACTIVO").length

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
