"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ROW_H, HEADER_H, SIDEBAR_W, ZOOM_PX_PER_DAY,
  type ZoomLevel, type GanttTask, type GanttDep,
  computeTimelineRange, computeBarLayouts, computeDepPaths,
  computeHeaderCells, computeDayStripes, assignDepths,
} from "@/lib/gantt/layout"
import type { CalendarioGantt } from "@/lib/gantt/types"
import { GanttToolbar } from "./GanttToolbar"
import { GanttSidebar } from "./GanttSidebar"
import { GanttHeader } from "./GanttHeader"
import { GanttBody, type DragStartPayload } from "./GanttBody"
import { TaskDrawer } from "./TaskDrawer"
import { AddTaskDialog } from "./AddTaskDialog"
import { moverTarea, guardarBaseline, limpiarBaseline, reordenarTareas } from "@/lib/gantt/actions"
import { differenceInDays, startOfDay, addDays } from "date-fns"

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

  const bodyRef = useRef<HTMLDivElement>(null)
  const sidebarContainerRef = useRef<HTMLDivElement>(null)
  const headerInnerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Sync when server re-renders
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
  const { level1, level2 } = useMemo(() => computeHeaderCells(timelineStart, timelineEnd, zoom, pxPerDay), [timelineStart, timelineEnd, zoom, pxPerDay])
  const stripes = useMemo(() => computeDayStripes(timelineStart, timelineEnd, pxPerDay), [timelineStart, timelineEnd, pxPerDay])

  // Observe viewport height
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight))
    ro.observe(el)
    setViewportH(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  // Scroll to today on mount
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const todayX = differenceInDays(startOfDay(new Date()), startOfDay(timelineStart)) * pxPerDay
    if (todayX > 0) el.scrollLeft = Math.max(0, todayX - el.clientWidth / 3)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

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
    el.scrollLeft = Math.max(0, todayX - el.clientWidth / 3)
  }, [timelineStart, pxPerDay])

  const handleFitToProject = useCallback(() => {
    if (bodyRef.current) bodyRef.current.scrollLeft = 0
  }, [])

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])

  const handleReorder = useCallback(async (orderedIds: string[]) => {
    // Optimistic update: reorder local tasks array
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

  // ── Drag ─────────────────────────────────────────────────────────────────────

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
  }, [dragState, pxPerDay])

  const handlePointerUp = useCallback(async () => {
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

    // Snap to start of day
    const newInicio = startOfDay(override.inicio)
    const newFin = startOfDay(override.fin)
    if (newInicio.getTime() === startOfDay(dragState.originalInicio).getTime() &&
      newFin.getTime() === startOfDay(dragState.originalFin).getTime()) return

    // Optimistic update
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

    // Aplicar updates del servidor (sucesores reprogramados)
    const updates = res.updates as unknown as Record<string, { inicio: string; fin: string }>
    setTasks((prev) =>
      prev.map((t) => {
        const u = updates[t.id]
        if (!u) return t
        return { ...t, inicio: new Date(u.inicio), fin: new Date(u.fin) }
      })
    )
    // Refrescar para traer CPM actualizado del servidor
    router.refresh()
  }, [dragState, dragOverrides, persisting, workflowId, router])

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

      <div className="flex flex-1 overflow-hidden" ref={contentRef}>
        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 flex-col" style={{ width: SIDEBAR_W }}>
          <div
            className="flex shrink-0 items-center border-b border-r bg-card px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            style={{ height: HEADER_H }}
          >
            Tarea
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
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 overflow-hidden border-b" style={{ height: HEADER_H }}>
            <div ref={headerInnerRef} style={{ width: totalDays * pxPerDay }}>
              <GanttHeader level1={level1} level2={level2} totalW={totalDays * pxPerDay} timelineStart={timelineStart} pxPerDay={pxPerDay} />
            </div>
          </div>
          <div ref={bodyRef} className="flex-1 overflow-auto" onScroll={handleScroll}>
            <GanttBody
              bars={bars}
              depPaths={depPaths}
              stripes={stripes}
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
              onDragStart={handleDragStart}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
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
