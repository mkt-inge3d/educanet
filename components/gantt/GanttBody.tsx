"use client"

import {
  ROW_H, BAR_H, MILESTONE_R,
  type BarLayout, type DayStripe, type DepPath,
} from "@/lib/gantt/layout"
import type { CalendarioGantt } from "@/lib/gantt/types"
import { getDateStringInTz, getMonthDayInTz } from "@/lib/gantt/businessCalendar"
import { differenceInDays, startOfDay } from "date-fns"

const BUFFER = 5
const HANDLE_W = 6  // ancho del handle de resize

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
  weekend: "hsl(220 14% 96%)",
  holiday: "hsl(45 93% 93%)",
  today: "hsl(221 83% 53%)",
  rowSep: "hsl(var(--border))",
  baseline: "hsl(220 9% 46%)",
  handle: "hsl(221 83% 40%)",
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

interface GanttBodyProps {
  bars: BarLayout[]
  depPaths: DepPath[]
  stripes: DayStripe[]
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
  onDragStart: (payload: DragStartPayload) => void
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerUp: () => void
  taskDates: Map<string, { inicio: Date; fin: Date }>
}

export function GanttBody({
  bars,
  depPaths,
  stripes,
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
  onDragStart,
  onPointerMove,
  onPointerUp,
  taskDates,
}: GanttBodyProps) {
  const firstRow = Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER)
  const lastRow = Math.min(totalRows - 1, Math.ceil((scrollTop + viewportH) / ROW_H) + BUFFER)
  const visibleBars = bars.filter((b) => b.row >= firstRow && b.row <= lastRow)

  const today = startOfDay(new Date())
  const todayX = differenceInDays(today, startOfDay(timelineStart)) * pxPerDay

  // Aplicar overrides de drag a las barras
  const resolvedBars = visibleBars.map((bar) => {
    const override = taskDates.get(bar.taskId)
    if (!override) return bar
    const x = differenceInDays(startOfDay(override.inicio), startOfDay(timelineStart)) * pxPerDay
    const x2 = differenceInDays(startOfDay(override.fin), startOfDay(timelineStart)) * pxPerDay
    const w = Math.max(x2 - x, pxPerDay * 0.15)
    return { ...bar, x, w }
  })

  return (
    <svg
      width={totalW}
      height={totalH}
      className="block"
      style={{ minWidth: totalW, cursor: draggingId ? "grabbing" : "default" }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Background stripes */}
      {stripes.map((s) => {
        const hol = isFeriado(s.date, calendario)
        if (!s.isWeekend && !hol) return null
        return (
          <rect
            key={s.x}
            x={s.x} y={0}
            width={s.width} height={totalH}
            fill={hol ? C.holiday : C.weekend}
            opacity={0.65}
          />
        )
      })}

      {/* Row separators */}
      {Array.from({ length: totalRows + 1 }, (_, i) => (
        <line
          key={i}
          x1={0} y1={i * ROW_H}
          x2={totalW} y2={i * ROW_H}
          stroke={C.rowSep} strokeWidth={0.5} opacity={0.3}
        />
      ))}

      {/* Today line */}
      {todayX >= 0 && todayX <= totalW && (
        <line
          x1={todayX} y1={0}
          x2={todayX} y2={totalH}
          stroke={C.today} strokeWidth={1.5}
          strokeDasharray="4 3" opacity={0.7}
        />
      )}

      {/* Arrow markers */}
      <defs>
        <marker id="gantt-arrow" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C.dep} />
        </marker>
        <marker id="gantt-arrow-crit" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C.critDep} />
        </marker>
      </defs>

      {/* Dependency lines */}
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

      {/* Task bars */}
      {resolvedBars.map((bar) => {
        const isDragging = bar.taskId === draggingId
        if (bar.isMilestone)
          return <Milestone key={bar.taskId} bar={bar} showCritical={showCritical} isDragging={isDragging} onDragStart={onDragStart} />
        if (bar.hasChildren)
          return <SummaryBar key={bar.taskId} bar={bar} showCritical={showCritical} isDragging={isDragging} onDragStart={onDragStart} />
        return (
          <TaskBar
            key={bar.taskId}
            bar={bar}
            showCritical={showCritical}
            showBaseline={showBaseline}
            isDragging={isDragging}
            onDragStart={onDragStart}
          />
        )
      })}
    </svg>
  )
}

// ── Task bar ──────────────────────────────────────────────────────────────────

function TaskBar({
  bar, showCritical, showBaseline, isDragging, onDragStart,
}: {
  bar: BarLayout
  showCritical: boolean
  showBaseline: boolean
  isDragging: boolean
  onDragStart: (p: DragStartPayload) => void
}) {
  const crit = showCritical && bar.isOnCriticalPath
  const rx = 3
  const progressW = Math.min((bar.w * bar.progress) / 100, bar.w)
  const opacity = isDragging ? 0.7 : 1

  function makePayload(mode: DragMode, pointerX: number): DragStartPayload {
    return {
      taskId: bar.taskId,
      mode,
      pointerX,
      originalInicio: new Date(), // sera reemplazado por GanttView
      originalFin: new Date(),
    }
  }

  return (
    <g opacity={opacity}>
      {showBaseline && bar.baselineX !== undefined && bar.baselineW !== undefined && (
        <rect
          x={bar.baselineX} y={bar.barY}
          width={bar.baselineW} height={BAR_H}
          rx={rx} fill={C.baseline} opacity={0.22}
        />
      )}
      {/* Bar background */}
      <rect
        x={bar.x} y={bar.barY}
        width={bar.w} height={BAR_H}
        rx={rx}
        fill={crit ? C.critFill : C.barFill}
        stroke={crit ? C.critStroke : C.barStroke}
        strokeWidth={crit ? 1.5 : 1}
        style={{ cursor: "grab" }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onDragStart({ ...makePayload("move", e.clientX), taskId: bar.taskId })
        }}
      />
      {/* Progress fill */}
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
      {/* Left resize handle */}
      <rect
        x={bar.x} y={bar.barY}
        width={HANDLE_W} height={BAR_H}
        rx={rx}
        fill={C.handle} opacity={0}
        style={{ cursor: "ew-resize" }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onDragStart({ ...makePayload("resize-left", e.clientX), taskId: bar.taskId })
        }}
      />
      {/* Right resize handle */}
      <rect
        x={bar.x + bar.w - HANDLE_W} y={bar.barY}
        width={HANDLE_W} height={BAR_H}
        rx={rx}
        fill={C.handle} opacity={0}
        style={{ cursor: "ew-resize" }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onDragStart({ ...makePayload("resize-right", e.clientX), taskId: bar.taskId })
        }}
      />
    </g>
  )
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({ bar, showCritical, isDragging, onDragStart }: {
  bar: BarLayout; showCritical: boolean; isDragging: boolean
  onDragStart: (p: DragStartPayload) => void
}) {
  const crit = showCritical && bar.isOnCriticalPath
  const color = crit ? C.critSummary : C.summary
  const THIN = 6
  const ty = bar.barY + (BAR_H - THIN) / 2
  const ARR = 7

  return (
    <g
      opacity={isDragging ? 0.7 : 1}
      style={{ cursor: "grab" }}
      onPointerDown={(e) => {
        e.stopPropagation()
        onDragStart({ taskId: bar.taskId, mode: "move", pointerX: e.clientX, originalInicio: new Date(), originalFin: new Date() })
      }}
    >
      <rect x={bar.x} y={ty} width={bar.w} height={THIN} fill={color} />
      <polygon points={`${bar.x},${ty} ${bar.x + ARR},${ty} ${bar.x},${ty + THIN + ARR}`} fill={color} />
      <polygon points={`${bar.x + bar.w},${ty} ${bar.x + bar.w - ARR},${ty} ${bar.x + bar.w},${ty + THIN + ARR}`} fill={color} />
    </g>
  )
}

// ── Milestone ─────────────────────────────────────────────────────────────────

function Milestone({ bar, showCritical, isDragging, onDragStart }: {
  bar: BarLayout; showCritical: boolean; isDragging: boolean
  onDragStart: (p: DragStartPayload) => void
}) {
  const crit = showCritical && bar.isOnCriticalPath
  const cx = bar.x + MILESTONE_R
  const cy = bar.barY + BAR_H / 2
  const r = MILESTONE_R

  return (
    <polygon
      points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
      fill={crit ? C.critMilestone : C.milestone}
      stroke={crit ? "hsl(0 72% 38%)" : "hsl(221 83% 38%)"}
      strokeWidth={1}
      opacity={isDragging ? 0.7 : 1}
      style={{ cursor: "grab" }}
      onPointerDown={(e) => {
        e.stopPropagation()
        onDragStart({ taskId: bar.taskId, mode: "move", pointerX: e.clientX, originalInicio: new Date(), originalFin: new Date() })
      }}
    />
  )
}
