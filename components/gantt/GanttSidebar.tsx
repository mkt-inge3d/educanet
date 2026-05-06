"use client"

import { useRef, useState } from "react"
import { ROW_H, type GanttTask } from "@/lib/gantt/layout"
import { cn } from "@/lib/utils"
import { ChevronRight, GripVertical } from "lucide-react"

interface GanttSidebarProps {
  tasks: GanttTask[]
  rowsByTaskId: Map<string, number>
  totalRows: number
  scrollTop: number
  viewportH: number
  collapsed: Set<string>
  onToggleCollapse: (id: string) => void
  selectedTaskId: string | null
  onSelectTask: (id: string | null) => void
  onReorder: (orderedIds: string[]) => void
}

const BUFFER = 5
const INDENT = 16
const DUR_W = 56  // ancho columna duración

function formatDuracion(min: number | null): string {
  if (min === null) return "—"
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function GanttSidebar({
  tasks,
  rowsByTaskId,
  totalRows,
  scrollTop,
  viewportH,
  collapsed,
  onToggleCollapse,
  selectedTaskId,
  onSelectTask,
  onReorder,
}: GanttSidebarProps) {
  const firstRow = Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER)
  const lastRow = Math.min(totalRows - 1, Math.ceil((scrollTop + viewportH) / ROW_H) + BUFFER)
  const containerRef = useRef<HTMLDivElement>(null)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropLineY, setDropLineY] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)

  const visibleTasks = tasks.filter((t) => {
    const row = rowsByTaskId.get(t.id)
    return row !== undefined && row >= firstRow && row <= lastRow
  })

  function getDropIdx(clientY: number): number {
    const rect = containerRef.current!.getBoundingClientRect()
    const y = clientY - rect.top + scrollTop
    return Math.max(0, Math.min(totalRows, Math.round(y / ROW_H)))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    const idx = getDropIdx(e.clientY)
    setDropIdx(idx)
    setDropLineY(idx * ROW_H)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (!draggingId || dropIdx === null) return

    const fromIdx = tasks.findIndex((t) => t.id === draggingId)
    if (fromIdx === -1) { resetDrag(); return }

    const without = tasks.filter((t) => t.id !== draggingId)
    const adjustedIdx = dropIdx > fromIdx ? dropIdx - 1 : dropIdx
    const reordered = [
      ...without.slice(0, adjustedIdx),
      tasks[fromIdx],
      ...without.slice(adjustedIdx),
    ]

    onReorder(reordered.map((t) => t.id))
    resetDrag()
  }

  function resetDrag() {
    setDraggingId(null)
    setDropLineY(null)
    setDropIdx(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-[320px] shrink-0"
      style={{ height: totalRows * ROW_H }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={resetDrag}
    >
      {visibleTasks.map((task) => {
        const row = rowsByTaskId.get(task.id)!
        const top = row * ROW_H
        const indentPx = task.depth * INDENT
        const isCollapsed = collapsed.has(task.id)
        const isDragging = draggingId === task.id

        return (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move"
              setDraggingId(task.id)
            }}
            className={cn(
              "absolute left-0 right-0 flex cursor-pointer items-center gap-1 border-b bg-card px-1 text-sm",
              task.estaEnRutaCritica && "bg-red-50 dark:bg-red-950/30",
              selectedTaskId === task.id && "bg-primary/10",
              isDragging && "opacity-40"
            )}
            style={{ top, height: ROW_H }}
            onClick={() => onSelectTask(selectedTaskId === task.id ? null : task.id)}
          >
            {/* Grip */}
            <span
              className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>

            {/* Indentación */}
            <span style={{ width: indentPx, flexShrink: 0 }} />

            {/* Caret collapse */}
            {task.hasChildren ? (
              <button
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
                onClick={(e) => { e.stopPropagation(); onToggleCollapse(task.id) }}
              >
                <ChevronRight
                  className={cn("h-3.5 w-3.5 transition-transform", !isCollapsed && "rotate-90")}
                />
              </button>
            ) : (
              <span className="h-5 w-5 shrink-0" />
            )}

            {/* Nombre */}
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                task.hasChildren && "font-medium",
                task.esHito && "italic text-muted-foreground"
              )}
              title={task.nombre}
            >
              {task.esHito && "◆ "}
              {task.nombre}
            </span>

            {/* Columna duración */}
            <span
              className="shrink-0 text-right text-[10px] tabular-nums text-muted-foreground"
              style={{ width: DUR_W }}
              title="Duración estimada"
            >
              {formatDuracion(task.duracionMin)}
            </span>

            {/* Avatar */}
            {task.asignadoAvatar ? (
              <img
                src={task.asignadoAvatar}
                alt={`${task.asignadoNombre} ${task.asignadoApellido}`}
                className="h-5 w-5 shrink-0 rounded-full object-cover"
                title={`${task.asignadoNombre} ${task.asignadoApellido}`}
              />
            ) : (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary"
                title={`${task.asignadoNombre} ${task.asignadoApellido}`}
              >
                {task.asignadoNombre[0]}
                {task.asignadoApellido[0]}
              </span>
            )}
          </div>
        )
      })}

      {/* Línea indicadora de drop */}
      {dropLineY !== null && draggingId !== null && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-10 h-0.5 bg-primary"
          style={{ top: dropLineY }}
        />
      )}
    </div>
  )
}
