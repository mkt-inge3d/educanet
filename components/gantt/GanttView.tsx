"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ROW_H, BAR_H, HEADER_H, SIDEBAR_W, ZOOM_PX_PER_DAY,
  type ZoomLevel, type GanttTask, type GanttDep,
  computeTimelineRange, computeBarLayouts, computeDepPaths,
  computeHeaderCells, computeDayStripes, assignDepths,
} from "@/lib/gantt/layout"
import type { CalendarioGantt } from "@/lib/gantt/types"
import { GanttToolbar } from "./GanttToolbar"
import { GanttSidebar } from "./GanttSidebar"
import { GanttHeader } from "./GanttHeader"
import { GanttBody, type DragStartPayload, type DepDrawState } from "./GanttBody"
import { TaskDrawer } from "./TaskDrawer"
import { AddTaskDialog } from "./AddTaskDialog"
import {
  moverTarea, guardarBaseline, limpiarBaseline, reordenarTareas, crearDependencia,
} from "@/lib/gantt/actions"
import { differenceInDays, startOfDay, addDays } from "date-fns"

const DUR_W = 56  // debe coincidir con GanttSidebar

interface Usuario { id: string; nombre: string; apellido: string }

interface GanttViewProps {
  workflowId: string
  projectName: string
  tasks: GanttTask[]
  deps: GanttDep[]
  calendario: CalendarioGantt | null
  hasBaseline: boolean
  usuarios: Usuario[]
}

interface DragState {
  taskId: string
  mode: "move" | "resize-right" | "resize-left"
  startPointerX: number
  originalInicio: Date
  originalFin: Date
}

export function GanttView({
  workflowId,
  projectName,
  tasks: rawTasks,
  deps: rawDeps,
  calendario,
  hasBaseline: initialHasBaseline,
  usuarios,
}: GanttViewProps) {
  const router = useRouter()
  const [zoom, setZoom] = useState<ZoomLevel>("week")
  const [showCritical, setShowCritical] = useState(false)
  const [showBaseline, setShowBaseline] = useState(false)
  const [hasBaseline, setHasBaseline] = useState(initialHasBaseline)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportH, setViewportH] = useState(600)
  const [tasks, setTasks] = useState<GanttTask[]>(rawTasks)
  const [deps, setDeps] = useState<GanttDep[]>(rawDeps)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dragOverrides, setDragOverrides] = useState<Map<string, { inicio: Date; fin: Date }>>(new Map())
  const [persisting, setPersisting] = useState(false)
  const [depDraw, setDepDraw] = useState<DepDrawState | null>(null)

  const bodyRef = useRef<HTMLDivElement>(null)
  const sidebarContainerRef = useRef<HTMLDivElement>(null)
  const headerInnerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setTasks(rawTasks) }, [rawTasks])
  useEffect(() => { setDeps(rawDeps) }, [rawDeps])

  const depthMap = useMemo(() => assignDepths(tasks), [tasks])

  const visibleTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      if (!a.parentId && b.parentId) return -1
      if (a.parentId && !b.parentId) return 1
      return a.ordenGantt - b.ordenGantt
    })
    function isHidden(t: GanttTask): boolean {
      if (!t.parentId) return false
      if (collapsed.has(t.parentId)) return true
      const parent = tasks.find((p) => p.id === t.parentId)
      return parent ? isHidden(parent) : false
    }
    return sorted.filter((t) => !isHidden(t)).map((t) => ({ ...t, depth: depthMap.get(t.id) ?? 0 }))
  }, [tasks, collapsed, depthMap])

  const rowsByTaskId = useMemo(() => {
    const m = new Map<string, number>()
    visibleTasks.forEach((t, i) => m.set(t.id, i))
    return m
  }, [visibleTasks])

  const totalRows = Math.max(visibleTasks.length, 1)

  const { start: timelineStart, end: timelineEnd } = useMemo(
    () => computeTimelineRange(tasks),
    [tasks]
  )
  const totalDays = Math.max(differenceInDays(timelineEnd, timelineStart) + 1, 30)
  const pxPerDay = ZOOM_PX_PER_DAY[zoom]
  const totalH = totalRows * ROW_H

  const criticalSet = useMemo(
    () => new Set(tasks.filter((t) => t.estaEnRutaCritica).map((t) => t.id)),
    [tasks]
  )

  const bars = useMemo(
    () => computeBarLayouts(visibleTasks, rowsByTaskId, timelineStart, pxPerDay, criticalSet),
    [visibleTasks, rowsByTaskId, timelineStart, pxPerDay, criticalSet]
  )
  const barByTaskId = useMemo(() => new Map(bars.map((b) => [b.taskId, b])), [bars])
  const depPaths = useMemo(() => computeDepPaths(deps, barByTaskId, criticalSet), [deps, barByTaskId, criticalSet])
  const { level1, level2 } = useMemo(
    () => computeHeaderCells(timelineStart, timelineEnd, zoom, pxPerDay),
    [timelineStart, timelineEnd, zoom, pxPerDay]
  )
  const stripes = useMemo(() => computeDayStripes(timelineStart, timelineEnd, pxPerDay), [timelineStart, timelineEnd, pxPerDay])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight))
    ro.observe(el)
    setViewportH(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  // Scroll a hoy al montar
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const todayX = differenceInDays(startOfDay(new Date()), startOfDay(timelineStart)) * pxPerDay
    if (todayX > 0) el.scrollLeft = Math.max(0, todayX - el.clientWidth / 3)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
    if (headerInnerRef.current) headerInnerRef.current.style.transform = `translateX(-${el.scrollLeft}px)`
    if (sidebarContainerRef.current) sidebarContainerRef.current.scrollTop = el.scrollTop
  }, [])

  const handleGoToToday = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    const todayX = differenceInDays(startOfDay(new Date()), startOfDay(timelineStart)) * pxPerDay
    el.scrollTo({ left: Math.max(0, todayX - el.clientWidth / 3), behavior: "smooth" })
  }, [timelineStart, pxPerDay])

  const handleFitToProject = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    const viewW = el.clientWidth
    const projectDays = Math.max(differenceInDays(timelineEnd, timelineStart), 1)
    const idealPxPerDay = viewW / projectDays
    const zooms: ZoomLevel[] = ["quarter", "month", "week", "day"]
    const best = zooms.reduce((prev, z) =>
      Math.abs(ZOOM_PX_PER_DAY[z] - idealPxPerDay) < Math.abs(ZOOM_PX_PER_DAY[prev] - idealPxPerDay) ? z : prev
    )
    setZoom(best)
    el.scrollTo({ left: 0, behavior: "smooth" })
  }, [timelineStart, timelineEnd])

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])

  const handleReorder = useCallback(async (orderedIds: string[]) => {
    const idxMap = new Map(orderedIds.map((id, i) => [id, i]))
    setTasks((prev) =>
      prev
        .map((t) => ({ ...t, ordenGantt: idxMap.get(t.id) ?? t.ordenGantt }))
        .sort((a, b) => a.ordenGantt - b.ordenGantt)
    )
    const orden = orderedIds.map((id, i) => ({ id, ordenGantt: i }))
    await reordenarTareas(workflowId, orden)
    router.refresh()
  }, [workflowId, router])

  // ── Coordenadas SVG ───────────────────────────────────────────────────────────

  const toSvgCoords = useCallback((clientX: number, clientY: number) => {
    const bodyEl = bodyRef.current
    if (!bodyEl) return { x: 0, y: 0 }
    const rect = bodyEl.getBoundingClientRect()
    return {
      x: clientX - rect.left + bodyEl.scrollLeft,
      y: clientY - rect.top + bodyEl.scrollTop,
    }
  }, [])

  // ── Dep Draw ──────────────────────────────────────────────────────────────────

  const handleDepDrawStart = useCallback((
    taskId: string,
    side: "left" | "right",
    clientX: number,
    clientY: number,
  ) => {
    const bar = barByTaskId.get(taskId)
    const { x: svgX, y: svgY } = toSvgCoords(clientX, clientY)
    const fromX = bar ? (side === "left" ? bar.x : bar.x + bar.w) : svgX
    const fromY = bar ? bar.barY + BAR_H / 2 : svgY
    setDepDraw({
      fromTaskId: taskId,
      fromSide: side,
      fromSvgX: fromX,
      fromSvgY: fromY,
      curSvgX: svgX,
      curSvgY: svgY,
      overBarId: null,
    })
  }, [barByTaskId, toSvgCoords])

  // ── Drag ──────────────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((payload: DragStartPayload) => {
    const task = tasks.find((t) => t.id === payload.taskId)
    if (!task) return
    setDragState({
      taskId: payload.taskId,
      mode: payload.mode,
      startPointerX: payload.pointerX,
      originalInicio: task.inicio,
      originalFin: task.fin,
    })
  }, [tasks])

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    // Dep-draw: actualizar cursor y barra objetivo
    if (depDraw) {
      const { x: svgX, y: svgY } = toSvgCoords(e.clientX, e.clientY)
      const row = Math.floor(svgY / ROW_H)
      const overBar = bars.find((b) => b.row === row && b.taskId !== depDraw.fromTaskId) ?? null
      setDepDraw((prev) => prev ? { ...prev, curSvgX: svgX, curSvgY: svgY, overBarId: overBar?.taskId ?? null } : null)
      return
    }

    if (!dragState) return
    const deltaX = e.clientX - dragState.startPointerX
    const deltaDays = deltaX / pxPerDay

    const { originalInicio, originalFin, mode } = dragState
    let newInicio = new Date(originalInicio)
    let newFin = new Date(originalFin)

    if (mode === "move") {
      newInicio = addDays(originalInicio, deltaDays)
      newFin = addDays(originalFin, deltaDays)
    } else if (mode === "resize-right") {
      newFin = addDays(originalFin, deltaDays)
      if (newFin <= newInicio) newFin = addDays(newInicio, 0.5)
    } else {
      newInicio = addDays(originalInicio, deltaDays)
      if (newInicio >= newFin) newInicio = addDays(newFin, -0.5)
    }

    setDragOverrides(new Map([[dragState.taskId, { inicio: newInicio, fin: newFin }]]))
  }, [depDraw, dragState, pxPerDay, bars, toSvgCoords])

  const handlePointerUp = useCallback(async () => {
    // Fin dep-draw
    if (depDraw) {
      const { fromTaskId, fromSide, overBarId, curSvgX } = depDraw
      setDepDraw(null)

      if (!overBarId || overBarId === fromTaskId) return

      const overBar = barByTaskId.get(overBarId)
      if (!overBar) return

      const toSide = curSvgX < overBar.x + overBar.w / 2 ? "left" : "right"
      let tipo: "FIN_A_INICIO" | "FIN_A_FIN" | "INICIO_A_INICIO" | "INICIO_A_FIN" = "FIN_A_INICIO"
      if (fromSide === "right" && toSide === "right") tipo = "FIN_A_FIN"
      else if (fromSide === "left" && toSide === "left") tipo = "INICIO_A_INICIO"
      else if (fromSide === "left" && toSide === "right") tipo = "INICIO_A_FIN"

      const res = await crearDependencia(workflowId, fromTaskId, overBarId, tipo)
      if ("error" in res) { alert(res.error); return }
      const tempId = `dep-${Date.now()}`
      setDeps((prev) => [...prev, { id: tempId, predecesora: fromTaskId, sucesora: overBarId, tipo, lagMinutos: 0 }])
      router.refresh()
      return
    }

    if (!dragState) return
    const override = dragOverrides.get(dragState.taskId)
    const taskId = dragState.taskId
    setDragState(null)
    setDragOverrides(new Map())

    // Click sin movimiento → seleccionar tarea
    if (!override) {
      setSelectedTaskId((prev) => prev === taskId ? null : taskId)
      return
    }
    if (persisting) return

    const newInicio = startOfDay(override.inicio)
    const newFin = startOfDay(override.fin)
    if (newInicio.getTime() === startOfDay(dragState.originalInicio).getTime() &&
      newFin.getTime() === startOfDay(dragState.originalFin).getTime()) return

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, inicio: newInicio, fin: newFin } : t
      )
    )

    setPersisting(true)
    const res = await moverTarea(workflowId, taskId, newInicio, newFin)
    setPersisting(false)

    if ("error" in res) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, inicio: dragState.originalInicio, fin: dragState.originalFin }
            : t
        )
      )
      alert(res.error)
      return
    }

    const updates = res.updates as unknown as Record<string, { inicio: string; fin: string }>
    setTasks((prev) =>
      prev.map((t) => {
        const u = updates[t.id]
        if (!u) return t
        return { ...t, inicio: new Date(u.inicio), fin: new Date(u.fin) }
      })
    )
    router.refresh()
  }, [depDraw, barByTaskId, workflowId, dragState, dragOverrides, persisting, router])

  // ── Baseline ──────────────────────────────────────────────────────────────────

  async function handleSaveBaseline() {
    if (!confirm("¿Guardar el plan actual como baseline?")) return
    await guardarBaseline(workflowId)
    setHasBaseline(true)
  }

  async function handleClearBaseline() {
    if (!confirm("¿Eliminar el baseline guardado?")) return
    await limpiarBaseline(workflowId)
    setHasBaseline(false)
    setShowBaseline(false)
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  if (tasks.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <GanttToolbar
          zoom={zoom} onZoomChange={setZoom}
          onGoToToday={handleGoToToday} onFitToProject={handleFitToProject}
          showCritical={showCritical} onToggleCritical={() => setShowCritical((v) => !v)}
          showBaseline={showBaseline} onToggleBaseline={() => setShowBaseline((v) => !v)}
          hasBaseline={hasBaseline} onSaveBaseline={handleSaveBaseline} onClearBaseline={handleClearBaseline}
          projectName={projectName}
          addTaskSlot={
            <AddTaskDialog
              workflowId={workflowId}
              usuarios={usuarios}
              defaultStart={new Date()}
              onCreated={() => router.refresh()}
            />
          }
        />
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Sin tareas. Creá la primera con "Nueva tarea".
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <GanttToolbar
        zoom={zoom} onZoomChange={setZoom}
        onGoToToday={handleGoToToday} onFitToProject={handleFitToProject}
        showCritical={showCritical} onToggleCritical={() => setShowCritical((v) => !v)}
        showBaseline={showBaseline} onToggleBaseline={() => setShowBaseline((v) => !v)}
        hasBaseline={hasBaseline} onSaveBaseline={handleSaveBaseline} onClearBaseline={handleClearBaseline}
        projectName={projectName}
        addTaskSlot={
          <AddTaskDialog
            workflowId={workflowId}
            usuarios={usuarios}
            defaultStart={timelineStart}
            onCreated={() => router.refresh()}
          />
        }
      />

      <div className="flex min-w-0 flex-1 overflow-hidden" ref={contentRef}>
        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 flex-col" style={{ width: SIDEBAR_W }}>
          {/* Header sidebar con columna Dur. */}
          <div
            className="flex shrink-0 items-center justify-between border-b border-r bg-card px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            style={{ height: HEADER_H }}
          >
            <span className="flex-1 pl-1">Tarea</span>
            <span className="pr-1 text-right" style={{ width: DUR_W }}>Dur.</span>
            <span className="w-5" /> {/* espacio avatar */}
          </div>
          <div ref={sidebarContainerRef} className="relative flex-1 overflow-hidden border-r">
            <GanttSidebar
              tasks={visibleTasks}
              rowsByTaskId={rowsByTaskId}
              totalRows={totalRows}
              scrollTop={scrollTop}
              viewportH={viewportH}
              collapsed={collapsed}
              onToggleCollapse={handleToggleCollapse}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onReorder={handleReorder}
            />
          </div>
        </div>

        {/* ── Timeline ──────────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 overflow-hidden border-b" style={{ height: HEADER_H }}>
            <div ref={headerInnerRef} style={{ width: totalDays * pxPerDay }}>
              <GanttHeader level1={level1} level2={level2} totalW={totalDays * pxPerDay} timelineStart={timelineStart} pxPerDay={pxPerDay} />
            </div>
          </div>
          <div
            ref={bodyRef}
            className="min-w-0 flex-1 overflow-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb:hover]:bg-primary"
            onScroll={handleScroll}
          >
            <GanttBody
              bars={bars}
              depPaths={depPaths}
              stripes={stripes}
              level2={level2}
              totalW={totalDays * pxPerDay}
              totalH={totalH}
              totalRows={totalRows}
              timelineStart={timelineStart}
              pxPerDay={pxPerDay}
              calendario={calendario}
              showCritical={showCritical}
              showBaseline={showBaseline}
              scrollTop={scrollTop}
              viewportH={viewportH}
              draggingId={dragState?.taskId ?? null}
              depDraw={depDraw}
              onDragStart={handleDragStart}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDepDrawStart={handleDepDrawStart}
              taskDates={dragOverrides}
            />
          </div>
        </div>

        {/* ── Task drawer ───────────────────────────────────────────────────── */}
        {selectedTaskId && (
          <TaskDrawer
            task={selectedTask}
            workflowId={workflowId}
            allTasks={tasks}
            deps={deps}
            onClose={() => setSelectedTaskId(null)}
            onDeleted={() => {
              setTasks((prev) => prev.filter((t) => t.id !== selectedTaskId))
              setDeps((prev) => prev.filter((d) => d.predecesora !== selectedTaskId && d.sucesora !== selectedTaskId))
              setSelectedTaskId(null)
              router.refresh()
            }}
          />
        )}
      </div>
    </div>
  )
}
