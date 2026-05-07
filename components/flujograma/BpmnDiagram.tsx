"use client"

import { useState, useRef, useEffect } from "react"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BpmnParseado, NodoParseado } from "@/lib/process/types"
import type { EstadoNodo } from "@prisma/client"

// ── Layout ────────────────────────────────────────────────────────────────────

const ML = 108   // swimlane label column width
const MT = 44    // phase header height
const TW2 = 60   // task half-width
const TH2 = 22   // task half-height
const GS  = 22   // gateway diamond half-size
const ER  = 17   // event circle radius
const DW  = 2400 // diagram total width
const DH  = 680  // diagram total height

const LANES = [
  { label: "Coordinadora",    dataY: 80  },
  { label: "SEO",             dataY: 180 },
  { label: "Diseñador",       dataY: 280 },
  { label: "Traficker",       dataY: 380 },
  { label: "Content Manager", dataY: 480 },
  { label: "Web Manager",     dataY: 580 },
]

const PHASES = [
  { label: "Pre-Webinar",  x1: 0,    x2: 1305 },
  { label: "Webinar",      x1: 1305, x2: 1780 },
  { label: "Post-Webinar", x1: 1780, x2: 2280 },
]

const svgX = (x: number) => x + ML
const svgY = (y: number) => y + MT

// ── Colors ────────────────────────────────────────────────────────────────────
// Usamos CSS custom properties del tema para que funcione en light y dark.

type C3 = [string, string, string]

const v = (token: string, alpha?: number) =>
  alpha !== undefined
    ? `hsl(var(${token}) / ${alpha})`
    : `hsl(var(${token}))`

// Colores estructurales del diagrama
const S = {
  poolBg:      v("--card"),
  laneLabelBg: v("--muted"),
  phaseHeaderBg: v("--background"),
  phaseMidBg:  v("--primary", 0.05),
  border:      v("--border"),
  fore:        v("--foreground"),
  mutedFore:   v("--muted-foreground"),
  primary:     v("--primary"),
  phaseDivider: v("--primary", 0.22),
}

// Colores de nodos por estado
const STATUS_C: Record<string, C3> = {
  PENDIENTE:  [v("--muted"),          v("--border"),        v("--muted-foreground")],
  ACTIVO:     [v("--primary", 0.14),  v("--primary"),       v("--primary")],
  COMPLETADO: [v("--success", 0.14),  v("--success"),       v("--success")],
  BLOQUEADO:  [v("--destructive", 0.14), v("--destructive"), v("--destructive")],
  OMITIDO:    [v("--muted"),          v("--border"),        v("--muted-foreground", 0.5)],
}
const DEF_C: C3 = [v("--primary", 0.08), v("--primary"), v("--primary")]

function nc(e?: EstadoNodo): C3 {
  if (!e) return DEF_C
  return STATUS_C[e] ?? DEF_C
}

// ── Text wrap ─────────────────────────────────────────────────────────────────

function wrap(text: string, maxW: number): string[] {
  const words = text.split(" ")
  const out: string[] = []
  let cur = ""
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w
    if (t.length * 5.7 > maxW && cur) { out.push(cur); cur = w }
    else cur = t
  }
  if (cur) out.push(cur)
  return out.slice(0, 3)
}

// ── Edge & path computation ───────────────────────────────────────────────────

function halfW(tipo: string) {
  if (tipo === "TAREA") return TW2
  if (tipo === "GATEWAY") return GS
  return ER
}

function flowPath(src: NodoParseado, tgt: NodoParseado): string {
  const x1 = svgX(src.posicion.x + halfW(src.tipo))
  const y1 = svgY(src.posicion.y)
  const x2 = svgX(tgt.posicion.x - halfW(tgt.tipo))
  const y2 = svgY(tgt.posicion.y)

  if (Math.abs(y1 - y2) < 1) return `M ${x1} ${y1} H ${x2}`

  const R = 6
  const midX = (x1 + x2) / 2
  const dy = y2 > y1 ? 1 : -1

  // Routing ortogonal ┐ con esquinas redondeadas (mismo estilo que el Gantt)
  return [
    `M ${x1} ${y1}`,
    `H ${midX - R}`,
    `Q ${midX} ${y1} ${midX} ${y1 + R * dy}`,
    `V ${y2 - R * dy}`,
    `Q ${midX} ${y2} ${midX + R} ${y2}`,
    `H ${x2}`,
  ].join(" ")
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TaskNode({ n, fill, stroke, tc }: { n: NodoParseado; fill: string; stroke: string; tc: string }) {
  const cx = svgX(n.posicion.x), cy = svgY(n.posicion.y)
  const lines = wrap(n.nombre, TW2 * 2 - 14)
  const lh = 12
  return (
    <g>
      <rect
        x={cx - TW2} y={cy - TH2}
        width={TW2 * 2} height={TH2 * 2}
        rx={4} style={{ fill, stroke }} strokeWidth={1.5}
      />
      {lines.map((ln, i) => (
        <text
          key={i}
          x={cx}
          y={cy - ((lines.length - 1) * lh) / 2 + i * lh}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={9.5} style={{ fill: tc, pointerEvents: "none" }}
        >
          {ln}
        </text>
      ))}
    </g>
  )
}

function GatewayNode({ n, fill, stroke, tc }: { n: NodoParseado; fill: string; stroke: string; tc: string }) {
  const cx = svgX(n.posicion.x), cy = svgY(n.posicion.y)
  const pts = `${cx},${cy - GS} ${cx + GS},${cy} ${cx},${cy + GS} ${cx - GS},${cy}`
  const lbl = n.nombre.length > 14 ? n.nombre.slice(0, 13) + "…" : n.nombre
  return (
    <g>
      <polygon points={pts} style={{ fill, stroke }} strokeWidth={1.5} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} style={{ fill: stroke, pointerEvents: "none" }}>+</text>
      <text x={cx} y={cy + GS + 11} textAnchor="middle"
        fontSize={8.5} style={{ fill: tc }}>{lbl}</text>
    </g>
  )
}

function EventNode({ n, fill, stroke, tc }: { n: NodoParseado; fill: string; stroke: string; tc: string }) {
  const cx = svgX(n.posicion.x), cy = svgY(n.posicion.y)
  const isEnd = n.tipo === "EVENTO_FIN"
  const lbl = n.nombre.length > 14 ? n.nombre.slice(0, 13) + "…" : n.nombre
  return (
    <g>
      <circle cx={cx} cy={cy} r={ER} style={{ fill, stroke }} strokeWidth={isEnd ? 3.5 : 1.5} />
      {isEnd && <circle cx={cx} cy={cy} r={ER - 5} fill="none" style={{ stroke }} strokeWidth={1.5} />}
      {isEnd && <circle cx={cx} cy={cy} r={ER - 9} style={{ fill: stroke }} />}
      <text x={cx} y={cy + ER + 12} textAnchor="middle"
        fontSize={8.5} style={{ fill: tc }}>{lbl}</text>
    </g>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface BpmnDiagramProps {
  bpmn: BpmnParseado
  estados?: Record<string, EstadoNodo>
}

export function BpmnDiagram({ bpmn, estados = {} }: BpmnDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.45)
  const [pan, setPan] = useState({ x: 8, y: 8 })
  const dragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const nodeById = new Map(bpmn.nodos.map((n) => [n.bpmnElementId, n]))

  useEffect(() => {
    if (!containerRef.current) return
    const { clientWidth: cw, clientHeight: ch } = containerRef.current
    const s = Math.min((cw - 16) / DW, (ch - 16) / DH) * 0.96
    setScale(Math.max(0.25, Math.min(s, 1)))
  }, [])

  function fitView() {
    if (!containerRef.current) return
    const { clientWidth: cw, clientHeight: ch } = containerRef.current
    const s = Math.min((cw - 16) / DW, (ch - 16) / DH) * 0.96
    setScale(Math.max(0.25, Math.min(s, 1)))
    setPan({ x: 8, y: 8 })
  }

  function zoom(factor: number) {
    setScale((s) => Math.max(0.2, Math.min(2.5, s * factor)))
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    zoom(e.deltaY > 0 ? 0.92 : 1.08)
  }

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    dragging.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
  }

  function onMouseUp() { dragging.current = false }

  return (
    <div className="relative w-full h-full">
      {/* Zoom controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => zoom(1.2)}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => zoom(0.8)}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={fitView}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden rounded-lg border bg-background"
        style={{ cursor: dragging.current ? "grabbing" : "grab" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <svg width="100%" height="100%" style={{ userSelect: "none" }}>
          <defs>
            <marker id="bpmn-arrow" markerWidth="8" markerHeight="6"
              refX="7" refY="3" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 0, 8 3, 0 6"
                style={{ fill: S.mutedFore }} />
            </marker>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>

            {/* Pool outer border */}
            <rect x={0} y={0} width={DW} height={DH}
              style={{ fill: S.poolBg, stroke: S.border }} strokeWidth={1.5} rx={2} />

            {/* Phase column backgrounds + labels */}
            {PHASES.map((ph, pi) => (
              <g key={ph.label}>
                <rect
                  x={svgX(ph.x1)} y={0}
                  width={ph.x2 - ph.x1} height={MT}
                  style={{ fill: pi === 1 ? S.phaseMidBg : S.phaseHeaderBg, stroke: S.border }}
                  strokeWidth={0.5}
                />
                <text
                  x={svgX((ph.x1 + ph.x2) / 2)} y={MT / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={13} fontWeight="600"
                  style={{ fill: S.fore }}
                >
                  {ph.label}
                </text>
                {pi < PHASES.length - 1 && (
                  <line
                    x1={svgX(ph.x2)} y1={MT}
                    x2={svgX(ph.x2)} y2={DH}
                    style={{ stroke: S.phaseDivider }}
                    strokeWidth={1} strokeDasharray="5 4"
                  />
                )}
              </g>
            ))}

            {/* Swimlane label column */}
            <rect x={0} y={MT} width={ML} height={DH - MT}
              style={{ fill: S.laneLabelBg, stroke: S.border }} strokeWidth={1} />

            {/* Swimlane rows */}
            {LANES.map((lane, i) => {
              const top = svgY(lane.dataY - 50)
              const bot = svgY(lane.dataY + 50)
              const mid = (top + bot) / 2
              return (
                <g key={lane.label}>
                  <line x1={0} y1={bot} x2={DW} y2={bot}
                    style={{ stroke: S.border }}
                    strokeWidth={i === LANES.length - 1 ? 0 : 0.8} />
                  <text
                    x={ML / 2} y={mid}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fontWeight="500"
                    style={{ fill: S.mutedFore }}
                    transform={`rotate(-90,${ML / 2},${mid})`}
                  >
                    {lane.label}
                  </text>
                </g>
              )
            })}

            {/* Sequence flows */}
            {bpmn.flujos.map((f) => {
              const src = nodeById.get(f.origen)
              const tgt = nodeById.get(f.destino)
              if (!src || !tgt) return null
              return (
                <path
                  key={f.id}
                  d={flowPath(src, tgt)}
                  fill="none"
                  style={{ stroke: S.mutedFore }}
                  strokeWidth={1.5}
                  markerEnd="url(#bpmn-arrow)"
                />
              )
            })}

            {/* Flow labels (conditions) */}
            {bpmn.flujos.filter((f) => f.nombre).map((f) => {
              const src = nodeById.get(f.origen)
              const tgt = nodeById.get(f.destino)
              if (!src || !tgt) return null
              const mx = svgX((src.posicion.x + tgt.posicion.x) / 2)
              const my = svgY((src.posicion.y + tgt.posicion.y) / 2)
              return (
                <text key={`lbl-${f.id}`} x={mx} y={my - 4}
                  textAnchor="middle" fontSize={8}
                  style={{ fill: S.mutedFore, pointerEvents: "none" }}>
                  {f.nombre}
                </text>
              )
            })}

            {/* Nodes */}
            {bpmn.nodos.map((n) => {
              const estado = estados[n.bpmnElementId]
              const [fill, stroke, tc] = nc(estado)
              if (n.tipo === "TAREA") return <TaskNode key={n.bpmnElementId} n={n} fill={fill} stroke={stroke} tc={tc} />
              if (n.tipo === "GATEWAY") return <GatewayNode key={n.bpmnElementId} n={n} fill={fill} stroke={stroke} tc={tc} />
              return <EventNode key={n.bpmnElementId} n={n} fill={fill} stroke={stroke} tc={tc} />
            })}

          </g>
        </svg>
      </div>
    </div>
  )
}
