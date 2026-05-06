import {
  addDays,
  differenceInDays,
  startOfDay,
  getDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  format,
  eachMonthOfInterval,
  eachWeekOfInterval,
} from "date-fns"

// ── Constantes ────────────────────────────────────────────────────────────────

export const ROW_H = 36
export const BAR_H = 20
export const MILESTONE_R = 9   // radio del rombo (mitad del "ancho")
export const HEADER_H = 52     // dos filas de 26px
export const SIDEBAR_W = 320

export const ZOOM_PX_PER_DAY = {
  day: 60,
  week: 20,
  month: 6,
  quarter: 2,
} as const
export type ZoomLevel = keyof typeof ZOOM_PX_PER_DAY

// ── Tipos de layout ───────────────────────────────────────────────────────────

export interface GanttTask {
  id: string
  nombre: string
  inicio: Date
  fin: Date
  progreso: number
  esHito: boolean
  estaEnRutaCritica: boolean
  parentId: string | null
  depth: number
  hasChildren: boolean
  baselineInicio: Date | null
  baselineFin: Date | null
  asignadoNombre: string
  asignadoApellido: string
  asignadoAvatar: string | null
  ordenGantt: number
  duracionMin: number | null
}

export interface GanttDep {
  id: string
  predecesora: string
  sucesora: string
  tipo: string
  lagMinutos: number
}

export interface BarLayout {
  taskId: string
  row: number
  x: number
  w: number
  barY: number
  isOnCriticalPath: boolean
  isMilestone: boolean
  progress: number
  hasChildren: boolean
  baselineX?: number
  baselineW?: number
}

export interface HeaderCell {
  label: string
  x: number
  width: number
  key: string
}

export interface DepPath {
  depId: string
  d: string
  isCritical: boolean
}

// ── Cómputo del rango del timeline ───────────────────────────────────────────

export function computeTimelineRange(tasks: GanttTask[]): { start: Date; end: Date } {
  if (!tasks.length) {
    const now = startOfDay(new Date())
    return { start: addDays(now, -7), end: addDays(now, 30) }
  }
  const ms = tasks.flatMap((t) => [t.inicio.getTime(), t.fin.getTime()])
  const minMs = Math.min(...ms)
  const maxMs = Math.max(...ms)
  return {
    start: addDays(startOfDay(new Date(minMs)), -7),
    end: addDays(startOfDay(new Date(maxMs)), 14),
  }
}

// ── Conversiones fecha ↔ pixel ────────────────────────────────────────────────

export function dateToX(date: Date, timelineStart: Date, pxPerDay: number): number {
  return (differenceInDays(startOfDay(date), startOfDay(timelineStart))) * pxPerDay
}

export function xToDate(x: number, timelineStart: Date, pxPerDay: number): Date {
  return addDays(timelineStart, x / pxPerDay)
}

// ── Cómputo de barras ─────────────────────────────────────────────────────────

export function computeBarLayouts(
  visibleTasks: GanttTask[],
  rowsByTaskId: Map<string, number>,
  timelineStart: Date,
  pxPerDay: number,
  criticalSet: Set<string>
): BarLayout[] {
  return visibleTasks.map((task) => {
    const row = rowsByTaskId.get(task.id) ?? 0
    const x = dateToX(task.inicio, timelineStart, pxPerDay)
    const x2 = dateToX(task.fin, timelineStart, pxPerDay)
    const w = Math.max(x2 - x, pxPerDay)  // mínimo 1 día visible
    const barY = row * ROW_H + (ROW_H - BAR_H) / 2

    let baselineX: number | undefined
    let baselineW: number | undefined
    if (task.baselineInicio && task.baselineFin) {
      baselineX = dateToX(task.baselineInicio, timelineStart, pxPerDay)
      const bx2 = dateToX(task.baselineFin, timelineStart, pxPerDay)
      baselineW = Math.max(bx2 - baselineX, pxPerDay * 0.15)
    }

    return {
      taskId: task.id,
      row,
      x,
      w,
      barY,
      isOnCriticalPath: criticalSet.has(task.id),
      isMilestone: task.esHito,
      progress: task.progreso,
      hasChildren: task.hasChildren,
      baselineX,
      baselineW,
    }
  })
}

// ── Cómputo de líneas de dependencia ─────────────────────────────────────────

export function computeDepPaths(
  deps: GanttDep[],
  barByTaskId: Map<string, BarLayout>,
  criticalSet: Set<string>
): DepPath[] {
  const paths: DepPath[] = []
  const STUB = 10  // px horizontal antes de doblar

  for (const dep of deps) {
    const pred = barByTaskId.get(dep.predecesora)
    const succ = barByTaskId.get(dep.sucesora)
    if (!pred || !succ) continue

    const predMidY = pred.barY + BAR_H / 2
    const succMidY = succ.barY + BAR_H / 2
    let predEndX: number
    let succStartX: number

    // Semántica según tipo (FS por default)
    if (dep.tipo === "FIN_A_FIN") {
      predEndX = pred.x + pred.w
      succStartX = succ.x + succ.w
    } else if (dep.tipo === "INICIO_A_INICIO") {
      predEndX = pred.x
      succStartX = succ.x
    } else if (dep.tipo === "INICIO_A_FIN") {
      predEndX = pred.x
      succStartX = succ.x + succ.w
    } else {
      // FIN_A_INICIO (default)
      predEndX = pred.x + pred.w
      succStartX = succ.x
    }

    const d = buildDepPath(predEndX, predMidY, succStartX, succMidY, STUB, pred.row, succ.row)
    const isCritical = criticalSet.has(dep.predecesora) && criticalSet.has(dep.sucesora)
    paths.push({ depId: dep.id, d, isCritical })
  }
  return paths
}

function buildDepPath(
  x1: number, y1: number,
  x2: number, y2: number,
  stub: number,
  row1: number, row2: number
): string {
  const R = 7  // radio esquinas

  // Helper: esquina redondeada H→V o V→H con Q
  function corner(cx: number, cy: number, dx: number, dy: number) {
    return `Q ${cx} ${cy} ${cx + dx} ${cy + dy}`
  }

  // Caso normal: ┐ o ┘ con esquinas suaves
  if (x2 >= x1 + stub * 2) {
    const midX = x1 + stub
    if (Math.abs(y2 - y1) < 1) return `M ${x1} ${y1} H ${x2}`
    const dy = y2 > y1 ? 1 : -1
    return [
      `M ${x1} ${y1}`,
      `H ${midX - R}`,
      corner(midX, y1, 0, R * dy),
      `V ${y2 - R * dy}`,
      corner(midX, y2, R, 0),
      `H ${x2}`,
    ].join(" ")
  }

  // Caso inverso: loop ┐┐ con esquinas suaves
  const loopUp = row1 < row2
  const yMid = loopUp ? y1 - ROW_H * 0.6 : y1 + ROW_H * 0.6
  const loopX = Math.min(x1, x2) - stub * 2
  const d1 = loopUp ? -1 : 1
  const d2 = y2 > yMid ? 1 : -1

  return [
    `M ${x1} ${y1}`,
    `H ${x1 + stub - R}`,
    corner(x1 + stub, y1, 0, R * d1),
    `V ${yMid - R * d1}`,
    corner(x1 + stub, yMid, -R, 0),
    `H ${loopX + R}`,
    corner(loopX, yMid, 0, R * d2),
    `V ${y2 - R * d2}`,
    corner(loopX, y2, R, 0),
    `H ${x2}`,
  ].join(" ")
}

// ── Cómputo del header (celdas de fecha) ─────────────────────────────────────

export function computeHeaderCells(
  timelineStart: Date,
  timelineEnd: Date,
  zoom: ZoomLevel,
  pxPerDay: number
): { level1: HeaderCell[]; level2: HeaderCell[] } {
  if (zoom === "day") {
    return {
      level1: buildMonthCells(timelineStart, timelineEnd, pxPerDay),
      level2: buildDayCells(timelineStart, timelineEnd, pxPerDay),
    }
  }
  if (zoom === "week") {
    return {
      level1: buildMonthCells(timelineStart, timelineEnd, pxPerDay),
      level2: buildWeekCells(timelineStart, timelineEnd, pxPerDay),
    }
  }
  if (zoom === "month") {
    return {
      level1: buildYearCells(timelineStart, timelineEnd, pxPerDay),
      level2: buildMonthCells(timelineStart, timelineEnd, pxPerDay),
    }
  }
  // quarter
  return {
    level1: buildYearCells(timelineStart, timelineEnd, pxPerDay),
    level2: buildQuarterCells(timelineStart, timelineEnd, pxPerDay),
  }
}

function buildMonthCells(start: Date, end: Date, pxPerDay: number): HeaderCell[] {
  const months = eachMonthOfInterval({ start, end })
  return months.map((m) => {
    const mEnd = endOfMonth(m)
    const cellStart = m < start ? start : m
    const cellEnd = mEnd > end ? end : mEnd
    return {
      key: format(m, "yyyy-MM"),
      label: format(m, "MMM yyyy"),
      x: dateToX(cellStart, start, pxPerDay),
      width: differenceInDays(cellEnd, cellStart) * pxPerDay,
    }
  })
}

function buildDayCells(start: Date, end: Date, pxPerDay: number): HeaderCell[] {
  const days = differenceInDays(end, start)
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = addDays(start, i)
    return {
      key: format(d, "yyyy-MM-dd"),
      label: format(d, "d"),
      x: i * pxPerDay,
      width: pxPerDay,
    }
  })
}

function buildWeekCells(start: Date, end: Date, pxPerDay: number): HeaderCell[] {
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
  return weeks.map((wStart) => {
    const wEnd = addDays(wStart, 6)
    const cellStart = wStart < start ? start : wStart
    const cellEnd = wEnd > end ? end : wEnd
    return {
      key: format(wStart, "yyyy-'W'ww"),
      label: `S ${format(wStart, "d")}`,
      x: dateToX(cellStart, start, pxPerDay),
      width: differenceInDays(cellEnd, cellStart) * pxPerDay,
    }
  })
}

function buildYearCells(start: Date, end: Date, pxPerDay: number): HeaderCell[] {
  const years = new Set<number>()
  let d = start
  while (d <= end) {
    years.add(d.getFullYear())
    d = addDays(d, 30)
  }
  years.add(end.getFullYear())
  return Array.from(years).map((y) => {
    const yStart = new Date(y, 0, 1)
    const yEnd = new Date(y, 11, 31)
    const cellStart = yStart < start ? start : yStart
    const cellEnd = yEnd > end ? end : yEnd
    return {
      key: String(y),
      label: String(y),
      x: dateToX(cellStart, start, pxPerDay),
      width: differenceInDays(cellEnd, cellStart) * pxPerDay,
    }
  })
}

function buildQuarterCells(start: Date, end: Date, pxPerDay: number): HeaderCell[] {
  const cells: HeaderCell[] = []
  let d = startOfMonth(start)
  while (d <= end) {
    const q = Math.floor(d.getMonth() / 3)
    const qStart = new Date(d.getFullYear(), q * 3, 1)
    const qEnd = new Date(d.getFullYear(), q * 3 + 3, 0)
    const cellStart = qStart < start ? start : qStart
    const cellEnd = qEnd > end ? end : qEnd
    const key = `${d.getFullYear()}-Q${q + 1}`
    if (!cells.find((c) => c.key === key)) {
      cells.push({
        key,
        label: `T${q + 1}`,
        x: dateToX(cellStart, start, pxPerDay),
        width: differenceInDays(cellEnd, cellStart) * pxPerDay,
      })
    }
    d = addDays(qEnd, 1)
  }
  return cells
}

// ── Días del timeline (para fondos) ──────────────────────────────────────────

export interface DayStripe {
  x: number
  width: number
  isWeekend: boolean
  date: Date
}

export function computeDayStripes(
  timelineStart: Date,
  timelineEnd: Date,
  pxPerDay: number
): DayStripe[] {
  const totalDays = differenceInDays(timelineEnd, timelineStart)
  return Array.from({ length: totalDays + 1 }, (_, i) => {
    const d = addDays(timelineStart, i)
    const dow = getDay(d) // 0=Sun, 6=Sat
    return {
      x: i * pxPerDay,
      width: pxPerDay,
      isWeekend: dow === 0 || dow === 6,
      date: d,
    }
  })
}

// ── Profundidad de la jerarquía de tareas ─────────────────────────────────────

export function assignDepths(
  tasks: GanttTask[]
): Map<string, number> {
  const parentById = new Map(tasks.map((t) => [t.id, t.parentId]))
  const depths = new Map<string, number>()

  function getDepth(id: string): number {
    if (depths.has(id)) return depths.get(id)!
    const parentId = parentById.get(id)
    if (!parentId) { depths.set(id, 0); return 0 }
    const d = getDepth(parentId) + 1
    depths.set(id, d)
    return d
  }

  for (const t of tasks) getDepth(t.id)
  return depths
}
