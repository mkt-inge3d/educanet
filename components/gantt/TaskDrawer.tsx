"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { X, Trash2, AlertCircle, Plus, Link2, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { eliminarTareaGantt, crearDependencia, eliminarDependencia, actualizarProgreso } from "@/lib/gantt/actions"
import type { GanttTask, GanttDep } from "@/lib/gantt/layout"

interface TaskDrawerProps {
  task: GanttTask | null
  workflowId: string
  allTasks: GanttTask[]
  deps: GanttDep[]
  onClose: () => void
  onDeleted: () => void
}

function formatDate(d: Date) {
  return format(d, "d MMM yyyy", { locale: es })
}

function durHumana(inicio: Date, fin: Date): string {
  const mins = Math.round((fin.getTime() - inicio.getTime()) / 60_000)
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h < 8) return m > 0 ? `${h}h ${m}min` : `${h}h`
  const d = Math.floor(h / 8)
  const hr = h % 8
  return hr > 0 ? `${d}d ${hr}h` : `${d}d`
}

export function TaskDrawer({ task, workflowId, allTasks, deps, onClose, onDeleted }: TaskDrawerProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [addingDep, setAddingDep] = useState(false)
  const [depMode, setDepMode] = useState<"pred" | "succ">("pred")
  const [depTipo, setDepTipo] = useState<"FIN_A_INICIO" | "FIN_A_FIN" | "INICIO_A_INICIO" | "INICIO_A_FIN">("FIN_A_INICIO")
  const [selectedDepTaskId, setSelectedDepTaskId] = useState("")
  const [savingDep, setSavingDep] = useState(false)
  const [depError, setDepError] = useState<string | null>(null)
  const [editingProgress, setEditingProgress] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [savingProgress, setSavingProgress] = useState(false)

  if (!task) return null

  const predDeps = deps.filter((d) => d.sucesora === task.id)
  const succDeps = deps.filter((d) => d.predecesora === task.id)

  const predTaskIds = new Set(predDeps.map((d) => d.predecesora))
  const succTaskIds = new Set(succDeps.map((d) => d.sucesora))

  const candidatesForPred = allTasks.filter(
    (t) => t.id !== task.id && !predTaskIds.has(t.id) && !t.hasChildren
  )
  const candidatesForSucc = allTasks.filter(
    (t) => t.id !== task.id && !succTaskIds.has(t.id) && !t.hasChildren
  )

  const taskById = new Map(allTasks.map((t) => [t.id, t]))

  const TIPO_LABEL: Record<string, string> = {
    FIN_A_INICIO: "FS", FIN_A_FIN: "FF",
    INICIO_A_INICIO: "SS", INICIO_A_FIN: "SF",
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${task!.nombre}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    const res = await eliminarTareaGantt(workflowId, task!.id)
    setDeleting(false)
    if ("error" in res) { alert(res.error as string); return }
    onDeleted()
    onClose()
  }

  async function handleAddDep() {
    if (!selectedDepTaskId) return
    setSavingDep(true)
    setDepError(null)
    const [predId, sucId] = depMode === "pred"
      ? [selectedDepTaskId, task!.id]
      : [task!.id, selectedDepTaskId]
    const res = await crearDependencia(workflowId, predId, sucId, depTipo)
    setSavingDep(false)
    if ("error" in res) { setDepError(res.error as string); return }
    setAddingDep(false)
    setSelectedDepTaskId("")
    setDepTipo("FIN_A_INICIO")
    router.refresh()
  }

  async function handleDeleteDep(depId: string) {
    await eliminarDependencia(workflowId, depId)
    router.refresh()
  }

  async function handleSaveProgress() {
    setSavingProgress(true)
    await actualizarProgreso(workflowId, task!.id, progressValue)
    setSavingProgress(false)
    setEditingProgress(false)
    router.refresh()
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Detalle de tarea</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Nombre */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tarea</p>
          <p className="mt-1 font-medium leading-snug">{task.esHito && "◆ "}{task.nombre}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {task.esHito && <Badge variant="outline">Hito</Badge>}
          {task.hasChildren && <Badge variant="outline">Resumen</Badge>}
          {task.estaEnRutaCritica && (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="mr-1 h-3 w-3" />
              Ruta crítica
            </Badge>
          )}
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Inicio plan.</p>
            <p className="mt-0.5 text-sm">{formatDate(task.inicio)}</p>
          </div>
          {!task.esHito && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fin plan.</p>
              <p className="mt-0.5 text-sm">{formatDate(task.fin)}</p>
            </div>
          )}
        </div>

        {/* Duración */}
        {!task.esHito && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Duración</p>
            <p className="mt-0.5 text-sm">{durHumana(task.inicio, task.fin)}</p>
          </div>
        )}

        {/* Progreso */}
        {!task.esHito && !task.hasChildren && (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Progreso</p>
              {!editingProgress && (
                <button
                  className="text-[10px] text-primary hover:underline"
                  onClick={() => { setProgressValue(task.progreso); setEditingProgress(true) }}
                >
                  Editar
                </button>
              )}
            </div>
            {editingProgress ? (
              <div className="mt-1.5 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progressValue}
                    onChange={(e) => setProgressValue(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-9 text-right text-sm tabular-nums">{progressValue}%</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleSaveProgress} disabled={savingProgress}>
                    {savingProgress ? "Guardando…" : "Guardar"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingProgress(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${task.progreso}%` }} />
                </div>
                <span className="text-sm tabular-nums">{task.progreso}%</span>
              </div>
            )}
          </div>
        )}

        {/* Asignado */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Responsable</p>
          <div className="mt-1.5 flex items-center gap-2">
            {task.asignadoAvatar ? (
              <img src={task.asignadoAvatar} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {task.asignadoNombre[0]}{task.asignadoApellido[0]}
              </span>
            )}
            <span className="text-sm">{task.asignadoNombre} {task.asignadoApellido}</span>
          </div>
        </div>

        {/* Baseline */}
        {task.baselineInicio && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Baseline</p>
            <p className="mt-0.5 text-xs">
              {formatDate(task.baselineInicio)}
              {task.baselineFin && ` → ${formatDate(task.baselineFin)}`}
            </p>
          </div>
        )}

        {/* Dependencias */}
        {!task.hasChildren && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dependencias
              </p>
              {!addingDep && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => { setAddingDep(true); setDepError(null) }}
                  title="Agregar dependencia"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Predecesoras */}
            {predDeps.length > 0 && (
              <div className="mb-2 space-y-1">
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ArrowRight className="h-3 w-3" /> Esperando a
                </p>
                {predDeps.map((d) => {
                  const pred = taskById.get(d.predecesora)
                  return (
                    <div key={d.id} className="flex items-center justify-between rounded border px-2 py-1">
                      <span className="truncate text-xs">{pred?.nombre ?? d.predecesora}</span>
                      <span className="ml-1 shrink-0 font-mono text-[9px] text-muted-foreground">{TIPO_LABEL[d.tipo] ?? d.tipo}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteDep(d.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Sucesoras */}
            {succDeps.length > 0 && (
              <div className="mb-2 space-y-1">
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ArrowLeft className="h-3 w-3" /> Bloquea a
                </p>
                {succDeps.map((d) => {
                  const succ = taskById.get(d.sucesora)
                  return (
                    <div key={d.id} className="flex items-center justify-between rounded border px-2 py-1">
                      <span className="truncate text-xs">{succ?.nombre ?? d.sucesora}</span>
                      <span className="ml-1 shrink-0 font-mono text-[9px] text-muted-foreground">{TIPO_LABEL[d.tipo] ?? d.tipo}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteDep(d.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {predDeps.length === 0 && succDeps.length === 0 && !addingDep && (
              <p className="text-xs text-muted-foreground">Sin dependencias</p>
            )}

            {/* Formulario agregar */}
            {addingDep && (
              <div className="mt-2 space-y-2 rounded-lg border p-3">
                <p className="text-xs font-medium">Nueva dependencia</p>
                <div className="flex gap-1.5">
                  <button
                    className={`flex-1 rounded border px-2 py-1 text-xs transition-colors ${depMode === "pred" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                    onClick={() => setDepMode("pred")}
                  >
                    Esta espera a…
                  </button>
                  <button
                    className={`flex-1 rounded border px-2 py-1 text-xs transition-colors ${depMode === "succ" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                    onClick={() => setDepMode("succ")}
                  >
                    Bloquea a…
                  </button>
                </div>
                <Select value={depTipo} onValueChange={(v) => setDepTipo(v as typeof depTipo)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIN_A_INICIO" className="text-xs">FS — Fin a Inicio</SelectItem>
                    <SelectItem value="FIN_A_FIN" className="text-xs">FF — Fin a Fin</SelectItem>
                    <SelectItem value="INICIO_A_INICIO" className="text-xs">SS — Inicio a Inicio</SelectItem>
                    <SelectItem value="INICIO_A_FIN" className="text-xs">SF — Inicio a Fin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedDepTaskId} onValueChange={(v) => setSelectedDepTaskId(v ?? "")}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Seleccionar tarea…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(depMode === "pred" ? candidatesForPred : candidatesForSucc).map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {depError && <p className="text-xs text-destructive">{depError}</p>}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={handleAddDep}
                    disabled={!selectedDepTaskId || savingDep}
                  >
                    <Link2 className="mr-1 h-3 w-3" />
                    {savingDep ? "Guardando…" : "Conectar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => { setAddingDep(false); setSelectedDepTaskId(""); setDepError(null) }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleting ? "Eliminando…" : "Eliminar tarea"}
        </Button>
      </div>
    </div>
  )
}
