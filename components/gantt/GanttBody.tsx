"use client"

import {
  ROW_H, BAR_H, MILESTONE_R,
  type BarLayout, type DayStripe, type DepPath, type HeaderCell,
} from "@/lib/gantt/layout"
import type { CalendarioGantt } from "@/lib/gantt/types"
import { getDateStringInTz, getMonthDayInTz } from "@/lib/gantt/businessCalendar"
import { differenceInDays, startOfDay } from "date-fns"
import { useRef } from "react"

const BUFFER = 5
const HANDLE_W = 6
const DOT_R = 5  // radio de los conectores de dependencia

const C = {
  barFill: "hsl(221 83% 90%)",
  barStroke: "hsl(221 83% 53%)",
  barProgress: "hsl(221 83% 53%)",
  critFill: "hsl(0 72% 92%)",
  critStroke: "hsl(0 72% 51%)",
  critProgress: "hsl(0 72% 51%)",
  summary: "hsl(221 83% 38%)",
  critSummary: "hsl(0 72% 40%)",
  milestone: "hsl(221 83% 53%)",
  critMilestone: "hsl(0 72% 51%)",
  dep: "hsl(220 9% 55%)",
  critDep: "hsl(0 72% 51%)",
  holiday: "hsl(45 93% 93%)",
  today: "hsl(221 83% 53%)",
  rowSep: "hsl(var(--border))",
  colSep: "hsl(var(--border))",
  baseline: "hsl(220 9% 46%)",
  handle: "hsl(221 83% 40%)",
  connector: "hsl(142 71% 45%)",
  depPreview: "hsl(221 83% 53%)",
  overBar: "hsl(142 71% 45%)",
}

function isFeriado(date: Date, cal: CalendarioGantt | null): boolean {
  if (!cal) return false
  const tz = cal.timezone
  const mmdd = getMonthDayInTz(date, tz)
  const full = getDateStringInTz(date, tz)
  return cal.feriados.some((f) => {
    const fd = new Date(f.fecha)
    const m = String(fd.getUTCMonth() + 1).padStart(2, "0")
    const d = String(fd.getUTCDate()).padStart(2, "0")
    const fMmdd = `${m}-${d}`
    const fFull = `${fd.getUTCFullYear()}-${m}-${d}`
    return f.recurrente ? fMmdd === mmdd : fFull === full
  })
}

export type DragMode = "move" | "resize-right" | "resize-left"

export interface DragStartPayload {
  taskId: string
  mode: DragMode
  pointerX: number
  originalInicio: Date
  originalFin: Date
}

export interface DepDrawState {
  fromTaskId: string
  fromSide: "left" | "right"
  fromSvgX: number
  fromSvgY: number
  curSvgX: number
  curSvgY: number
  overBarId: string | null
}

interface GanttBodyProps {
  bars: BarLayout[]
  depPaths: DepPath[]
  stripes: DayStripe[]
  level2: HeaderCell[]
  totalW: number
  totalH: number
  totalRows: number
  timelineStart: Date
  pxPerDay: number
  calendario: CalendarioGantt | null
  showCritical: boolean
  showBaseline: boolean
  scrollTop: number
  viewportH: number
  draggingId: string | null
  depDraw: DepDrawState | null
  onDragStart: (payload: DragStartPayload) => void
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerUp: () => void
  onDepDrawStart: (taskId: string, side: "left" | "right", clientX: number, clientY: number) => void
  taskDates: Map<string, { inicio: Date; fin: Date }>
}

export function GanttBody({
  bars,
  depPaths,
  stripes,
  level2,
  totalW,
  totalH,
  totalRows,
  timelineStart,
  pxPerDay,
  calendario,
  showCritical,
  showBaseline,
  scrollTop,
  viewportH,
  draggingId,
  depDraw,
  onDragStart,
  onPointerMove,
  onPointerUp,
  onDepDrawStart,
  taskDates,
}: GanttBodyProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const firstRow = Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER)
  const lastRow = Math.min(totalRows - 1, Math.ceil((scrollTop + viewportH) / ROW_H) + BUFFER)
  const visibleBars = bars.filter((b) => b.row >= firstRow && b.row <= lastRow)

  const today = startOfDay(new Date())
  const todayX = differenceInDays(today, startOfDay(timelineStart)) * pxPerDay

  const resolvedBars = visibleBars.map((bar) => {
    const override = taskDates.get(bar.taskId)
    if (!override) return bar
    const tlStart = startOfDay(timelineStart).getTime()
    const msPerDay = 86_400_000
    const x = (override.inicio.getTime() - tlStart) / msPerDay * pxPerDay
    const x2 = (override.fin.getTime() - tlStart) / msPerDay * pxPerDay
    const w = Math.max(x2 - x, pxPerDay)
    return { ...bar, x, w }
  })

  function handleDepDrawStartCapture(e: React.PointerEvent, taskId: string, side: "left" | "right") {
    e.stopPropagation()
    svgRef.current?.setPointerCapture(e.pointerId)
    onDepDrawStart(taskId, side, e.clientX, e.clientY)
  }

  function handleDragStartCapture(e: React.PointerEvent, payload: Parameters<typeof onDragStart>[0]) {
    e.stopPropagation()
    svgRef.current?.setPointerCapture(e.pointerId)
    onDragStart(payload)
  }

  // Bezier preview path para dep-draw
  function depPreviewPath(): string {
    if (!depDraw) return ""
    const { fromSvgX, fromSvgY, curSvgX, curSvgY } = depDraw
    const dx = Math.max(Math.abs(curSvgX - fromSvgX), 60)
    const cp = dx * 0.5
    return `M ${fromSvgX} ${fromSvgY} C ${fromSvgX + cp} ${fromSvgY} ${curSvgX - cp} ${curSvgY} ${curSvgX} ${curSvgY}`
  }

  const isDepDrawing = depDraw !== null

  return (
    <svg
      ref={svgRef}
      width={totalW}
      height={totalH}
      className="block"
      style={{ minWidth: totalW, cursor: isDepDrawing ? "crosshair" : draggingId ? "grabbing" : "default" }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={isDepDrawing ? onPointerUp : undefined}
    >
      <defs>
        <style>{`
          @keyframes dep-dash { to { stroke-dashoffset: -20; } }
          .dep-preview { animation: dep-dash 0.35s linear infinite; }
        `}</style>
        <marker id="gantt-arrow" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C.dep} />
        </marker>
        <marker id="gantt-arrow-crit" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C.critDep} />
        </marker>
        <marker id="gantt-arrow-preview" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C.depPreview} />
        </marker>
      </defs>

      {/* Feriados únicamente (sin fondo especial para fines de semana) */}
      {stripes.map((s) => {
        const hol = isFeriado(s.date, calendario)
        if (!hol) return null
        return (
          <rect
            key={s.x}
            x={s.x} y={0}
            width={s.width} height={totalH}
            fill={C.holiday}
            opacity={0.65}
          />
        )
      })}

      {/* Cuadrícula: líneas verticales en columnas del nivel2 */}
      {level2.map((cell) => (
        <line
          key={`col-${cell.key}`}
          x1={cell.x} y1={0}
          x2={cell.x} y2={totalH}
          stroke={C.colSep} strokeWidth={0.5} opacity={0.25}
        />
      ))}

      {/* Separadores de fila */}
      {Array.from({ length: totalRows + 1 }, (_, i) => (
        <line
          key={i}
          x1={0} y1={i * ROW_H}
          x2={totalW} y2={i * ROW_H}
          stroke={C.rowSep} strokeWidth={0.5} opacity={0.3}
        />
      ))}

      {/* Línea de hoy */}
      {todayX >= 0 && todayX <= totalW && (
        <line
          x1={todayX} y1={0}
          x2={todayX} y2={totalH}
          stroke={C.today} strokeWidth={1.5}
          strokeDasharray="4 3" opacity={0.7}
        />
      )}

      {/* Líneas de dependencia existentes */}
      {depPaths.map((dep) => {
        const crit = showCritical && dep.isCritical
        return (
          <path
            key={dep.depId}
            d={dep.d}
            fill="none"
            stroke={crit ? C.critDep : C.dep}
            strokeWidth={crit ? 1.5 : 1}
            opacity={0.6}
            markerEnd={crit ? "url(#gantt-arrow-crit)" : "url(#gantt-arrow)"}
          />
        )
      })}

      {/* Barras de tarea */}
      {resolvedBars.map((bar) => {
        const isDragging = bar.taskId === draggingId
        const isOver = depDraw?.overBarId === bar.taskId
        if (bar.isMilestone)
          return <Milestone key={bar.taskId} bar={bar} showCritical={showCritical} isDragging={isDragging} onDragStart={(p, e) => handleDragStartCapture(e, p)} />
        if (bar.hasChildren)
          return <SummaryBar key={bar.taskId} bar={bar} showCritical={showCritical} isDragging={isDragging} onDragStart={(p, e) => handleDragStartCapture(e, p)} onDepDrawStart={handleDepDrawStartCapture} isOver={isOver} />
        return (
          <TaskBar
            key={bar.taskId}
            bar={bar}
            showCritical={showCritical}
            showBaseline={showBaseline}
            isDragging={isDragging}
            isOver={isOver}
            isDepDrawing={isDepDrawing}
            onDragStart={(p, e) => handleDragStartCapture(e, p)}
            onDepDrawStart={handleDepDrawStartCapture}
          />
        )
      })}

      {/* Preview de dep en proceso de creación */}
      {depDraw && (
        <path
          className="dep-preview"
          d={depPreviewPath()}
          fill="none"
          stroke={C.depPreview}
          strokeWidth={2}
          strokeDasharray="8 4"
          opacity={0.85}
          style={{ pointerEvents: "none" }}
          markerEnd="url(#gantt-arrow-preview)"
        />
      )}
    </svg>
  )
}

// ── Task bar ──────────────────────────────────────────────────────────────────

function TaskBar({
  bar, showCritical, showBaseline, isDragging, isOver, isDepDrawing, onDragStart, onDepDrawStart,
}: {
  bar: BarLayout
  showCritical: boolean
  showBaseline: boolean
  isDragging: boolean
  isOver: boolean
  isDepDrawing: boolean
  onDragStart: (p: DragStartPayload, e: React.PointerEvent) => void
  onDepDrawStart: (e: React.PointerEvent, taskId: string, side: "left" | "right") => void
}) {
  const crit = showCritical && bar.isOnCriticalPath
  const rx = 3
  const progressW = Math.min((bar.w * bar.progress) / 100, bar.w)
  const opacity = isDragging ? 0.7 : 1
  const midY = bar.barY + BAR_H / 2

  return (
    <g opacity={opacity}>
      {showBaseline && bar.baselineX !== undefined && bar.baselineW !== undefined && (
        <rect
          x={bar.baselineX} y={bar.barY}
          width={bar.baselineW} height={BAR_H}
          rx={rx} fill={C.baseline} opacity={0.22}
        />
      )}
      {/* Highlight cuando es target de dep-draw */}
      {isOver && (
        <rect
          x={bar.x - 2} y={bar.barY - 2}
          width={bar.w + 4} height={BAR_H + 4}
          rx={rx + 1}
          fill="none"
          stroke={C.overBar} strokeWidth={2}
          opacity={0.8}
          style={{ pointerEvents: "none" }}
        />
      )}
      {/* Barra fondo */}
      <rect
        x={bar.x} y={bar.barY}
        width={bar.w} height={BAR_H}
        rx={rx}
        fill={crit ? C.critFill : C.barFill}
        stroke={crit ? C.critStroke : C.barStroke}
        strokeWidth={crit ? 1.5 : 1}
        style={{ cursor: isDepDrawing ? "crosshair" : "grab" }}
        onPointerDown={(e) => {
          if (isDepDrawing) return
          onDragStart({ taskId: bar.taskId, mode: "move", pointerX: e.clientX, originalInicio: new Date(), originalFin: new Date() }, e)
        }}
      />
      {/* Progreso */}
      {progressW > 0 && (
        <rect
          x={bar.x} y={bar.barY}
          width={progressW} height={BAR_H}
          rx={rx}
          fill={crit ? C.critProgress : C.barProgress}
          opacity={0.9}
          style={{ pointerEvents: "none" }}
        />
      )}
      {/* Handle resize izquierdo */}
      <rect
        x={bar.x} y={bar.barY}
        width={HANDLE_W} height={BAR_H}
        rx={rx} fill={C.handle} opacity={0}
        style={{ cursor: isDepDrawing ? "crosshair" : "ew-resize" }}
        onPointerDown={(e) => {
          if (isDepDrawing) return
          onDragStart({ taskId: bar.taskId, mode: "resize-left", pointerX: e.clientX, originalInicio: new Date(), originalFin: new Date() }, e)
        }}
      />
      {/* Handle resize derecho */}
      <rect
        x={bar.x + bar.w - HANDLE_W} y={bar.barY}
        width={HANDLE_W} height={BAR_H}
        rx={rx} fill={C.handle} opacity={0}
        style={{ cursor: isDepDrawing ? "crosshair" : "ew-resize" }}
        onPointerDown={(e) => {
          if (isDepDrawing) return
          onDragStart({ taskId: bar.taskId, mode: "resize-right", pointerX: e.clientX, originalInicio: new Date(), originalFin: new Date() }, e)
        }}
      />
      {/* Conector izquierdo */}
      <circle
        cx={bar.x} cy={midY} r={DOT_R}
        fill={C.connector} stroke="white" strokeWidth={1.5}
        opacity={isDepDrawing ? 0.9 : 0.6}
        style={{ cursor: "crosshair" }}
        onPointerDown={(e) => onDepDrawStart(e, bar.taskId, "left")}
      />
      {/* Conector derecho */}
      <circle
        cx={bar.x + bar.w} cy={midY} r={DOT_R}
        fill={C.connector} stroke="white" strokeWidth={1.5}
        opacity={isDepDrawing ? 0.9 : 0.6}
        style={{ cursor: "crosshair" }}
        onPointerDown={(e) => onDepDrawStart(e, bar.taskId, "right")}
      />
    </g>
  )
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({ bar, showCritical, isDragging, isOver, onDragStart, onDepDrawStart }: {
  bar: BarLayout; showCritical: boolean; isDragging: boolean; isOver: boolean
  onDragStart: (p: DragStartPayload, e: React.PointerEvent) => void
  onDepDrawStart: (e: React.PointerEvent, taskId: string, side: "left" | "right") => void
}) {
  const crit = showCritical && bar.isOnCriticalPath
  const color = crit ? C.critSummary : C.summary

  // Estilo MS Project: barra gruesa en la parte superior + triángulos apuntando hacia abajo en los extremos
  const BAR_TH = 9   // grosor de la barra horizontal
  const TRI_W = 9    // base del triángulo (en el extremo)
  const TRI_H = 9    // altura del triángulo (punta hacia abajo)
  const ty = bar.barY
  const midY = bar.barY + BAR_H / 2

  return (
    <g opacity={isDragging ? 0.7 : 1}>
      {isOver && (
        <rect
          x={bar.x - 2} y={bar.barY - 2}
          width={bar.w + 4} height={BAR_H + 4}
          rx={2} fill="none" stroke={C.overBar} strokeWidth={2} opacity={0.8}
          style={{ pointerEvents: "none" }}
        />
      )}
      <g
        style={{ cursor: "grab" }}
        onPointerDown={(e) => {
          onDragStart({ taskId: bar.taskId, mode: "move", pointerX: e.clientX, originalInicio: new Date(), originalFin: new Date() }, e)
        }}
      >
        {/* Barra horizontal gruesa — span completo */}
        <rect x={bar.x} y={ty} width={bar.w} height={BAR_TH} fill={color} rx={2} />
        {/* Triángulo izquierdo: cuelga de la esquina inferior-izquierda */}
        <polygon
          points={`${bar.x},${ty + BAR_TH} ${bar.x + TRI_W},${ty + BAR_TH} ${bar.x},${ty + BAR_TH + TRI_H}`}
          fill={color}
        />
        {/* Triángulo derecho: cuelga de la esquina inferior-derecha */}
        <polygon
          points={`${bar.x + bar.w - TRI_W},${ty + BAR_TH} ${bar.x + bar.w},${ty + BAR_TH} ${bar.x + bar.w},${ty + BAR_TH + TRI_H}`}
          fill={color}
        />
      </g>
      <circle
        cx={bar.x} cy={midY} r={DOT_R}
        fill={C.connector} stroke="white" strokeWidth={1.5} opacity={0.6}
        style={{ cursor: "crosshair" }}
        onPointerDown={(e) => onDepDrawStart(e, bar.taskId, "left")}
      />
      <circle
        cx={bar.x + bar.w} cy={midY} r={DOT_R}
        fill={C.connector} stroke="white" strokeWidth={1.5} opacity={0.6}
        style={{ cursor: "crosshair" }}
        onPointerDown={(e) => onDepDrawStart(e, bar.taskId, "right")}
      />
    </g>
  )
}

// ── Milestone ─────────────────────────────────────────────────────────────────

function Milestone({ bar, showCritical, isDragging, onDragStart }: {
  bar: BarLayout; showCritical: boolean; isDragging: boolean
  onDragStart: (p: DragStartPayload, e: React.PointerEvent) => void
}) {
  const crit = showCritical && bar.isOnCriticalPath
  const cx = bar.x + MILESTONE_R
  const cy = bar.barY + BAR_H / 2
  const r = MILESTONE_R
  const HIT = r + 8  // área de clic más amplia

  return (
    <g
      opacity={isDragging ? 0.7 : 1}
      style={{ cursor: "grab" }}
      onPointerDown={(e) => {
        onDragStart({ taskId: bar.taskId, mode: "move", pointerX: e.clientX, originalInicio: new Date(), originalFin: new Date() }, e)
      }}
    >
      {/* Hit area invisible más grande */}
      <rect
        x={cx - HIT} y={cy - HIT}
        width={HIT * 2} height={HIT * 2}
        fill="transparent"
        style={{ pointerEvents: "all" }}
      />
      {/* Rombo visible */}
      <polygon
        points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
        fill={crit ? C.critMilestone : C.milestone}
        stroke={crit ? "hsl(0 72% 38%)" : "hsl(221 83% 38%)"}
        strokeWidth={1}
        style={{ pointerEvents: "none" }}
      />
    </g>
  )
}
