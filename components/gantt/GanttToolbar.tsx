"use client"

import { Button } from "@/components/ui/button"
import {
  ZoomIn, ZoomOut, CalendarDays, Maximize2,
  AlertCircle, GitBranch, Bookmark, BookmarkX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ZoomLevel } from "@/lib/gantt/layout"
import type { ReactNode } from "react"

const ZOOMS: ZoomLevel[] = ["quarter", "month", "week", "day"]
const ZOOM_LABELS: Record<ZoomLevel, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
  quarter: "Trimestre",
}

interface GanttToolbarProps {
  zoom: ZoomLevel
  onZoomChange: (z: ZoomLevel) => void
  onGoToToday: () => void
  onFitToProject: () => void
  showCritical: boolean
  onToggleCritical: () => void
  showBaseline: boolean
  onToggleBaseline: () => void
  hasBaseline: boolean
  onSaveBaseline: () => void
  onClearBaseline: () => void
  projectName: string
  addTaskSlot?: ReactNode
}

export function GanttToolbar({
  zoom,
  onZoomChange,
  onGoToToday,
  onFitToProject,
  showCritical,
  onToggleCritical,
  showBaseline,
  onToggleBaseline,
  hasBaseline,
  onSaveBaseline,
  onClearBaseline,
  projectName,
  addTaskSlot,
}: GanttToolbarProps) {
  function zoomIn() {
    const idx = ZOOMS.indexOf(zoom)
    if (idx < ZOOMS.length - 1) onZoomChange(ZOOMS[idx + 1])
  }
  function zoomOut() {
    const idx = ZOOMS.indexOf(zoom)
    if (idx > 0) onZoomChange(ZOOMS[idx - 1])
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-card px-4">
      <h2 className="mr-3 max-w-48 truncate text-sm font-semibold">{projectName}</h2>

      {/* Zoom */}
      <div className="flex items-center rounded-lg border">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-r-none border-r"
          onClick={zoomOut}
          disabled={zoom === "quarter"}
          title="Alejar"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="px-2 text-xs font-medium tabular-nums">{ZOOM_LABELS[zoom]}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-l-none border-l"
          onClick={zoomIn}
          disabled={zoom === "day"}
          title="Acercar"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onGoToToday}>
        <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
        Hoy
      </Button>
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onFitToProject}>
        <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
        Ajustar
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      <Button
        variant={showCritical ? "default" : "outline"}
        size="sm"
        className={cn("h-7 text-xs", showCritical && "border-transparent bg-red-600 text-white hover:bg-red-700")}
        onClick={onToggleCritical}
      >
        <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
        Ruta crítica
      </Button>

      {hasBaseline ? (
        <>
          <Button
            variant={showBaseline ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={onToggleBaseline}
          >
            <GitBranch className="mr-1.5 h-3.5 w-3.5" />
            Baseline
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            onClick={onClearBaseline}
            title="Eliminar baseline"
          >
            <BookmarkX className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onSaveBaseline}
          title="Guardar baseline del plan actual"
        >
          <Bookmark className="mr-1.5 h-3.5 w-3.5" />
          Baseline
        </Button>
      )}

      <div className="ml-auto">{addTaskSlot}</div>
    </div>
  )
}
