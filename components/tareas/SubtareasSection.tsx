"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, Circle, Clock, Plus, Pencil, Trash2, X, Check,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { crearSubtarea, editarSubtarea, eliminarSubtarea } from "@/lib/tareas/subtarea-actions"
import type { EstadoTareaInstancia } from "@prisma/client"

const ESTADO_LABEL: Record<EstadoTareaInstancia, string> = {
  PENDIENTE: "Pendiente",
  BLOQUEADA: "Bloqueada",
  EN_PROGRESO: "En progreso",
  EN_REVISION: "En revisión",
  COMPLETADA: "Completada",
  OMITIDA: "Omitida",
  VENCIDA: "Vencida",
}

const ESTADO_COLOR: Record<EstadoTareaInstancia, string> = {
  PENDIENTE: "text-muted-foreground",
  BLOQUEADA: "text-amber-600 dark:text-amber-400",
  EN_PROGRESO: "text-blue-600 dark:text-blue-400",
  EN_REVISION: "text-purple-600 dark:text-purple-400",
  COMPLETADA: "text-green-600 dark:text-green-400",
  OMITIDA: "text-muted-foreground/50",
  VENCIDA: "text-destructive",
}

type Subtarea = {
  id: string
  nombreAdHoc: string | null
  catalogoTarea: { nombre: string } | null
  estado: EstadoTareaInstancia
  progreso: number
  fechaEstimadaInicio: Date
  fechaEstimadaFin: Date
  asignadoA: { id: string; nombre: string; apellido: string }
}

type Companero = { id: string; nombre: string; apellido: string }

interface SubtareasSectionProps {
  parentId: string
  subtareas: Subtarea[]
  companeros: Companero[]
  modoLectura?: boolean
}

function formatFecha(d: Date) {
  return format(new Date(d), "d MMM", { locale: es })
}

function NombreSubtarea(s: Subtarea) {
  return s.nombreAdHoc ?? s.catalogoTarea?.nombre ?? "Subtarea"
}

export function SubtareasSection({ parentId, subtareas, companeros, modoLectura = false }: SubtareasSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showNueva, setShowNueva] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const completadas = subtareas.filter((s) => s.estado === "COMPLETADA").length
  const progresoTotal = subtareas.length > 0 ? Math.round((completadas / subtareas.length) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            Subtareas
            {subtareas.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {completadas}/{subtareas.length}
              </span>
            )}
          </CardTitle>
          {!modoLectura && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowNueva(true); setEditingId(null) }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nueva subtarea
            </Button>
          )}
        </div>
        {subtareas.length > 0 && (
          <Progress value={progresoTotal} className="h-1.5 mt-2" />
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Lista de subtareas existentes */}
        {subtareas.map((subtarea) =>
          editingId === subtarea.id ? (
            <FormSubtarea
              key={subtarea.id}
              parentId={parentId}
              companeros={companeros}
              inicial={{
                nombre: NombreSubtarea(subtarea),
                fechaInicio: format(new Date(subtarea.fechaEstimadaInicio), "yyyy-MM-dd"),
                fechaFin: format(new Date(subtarea.fechaEstimadaFin), "yyyy-MM-dd"),
                responsableId: subtarea.asignadoA.id,
                estado: subtarea.estado,
              }}
              tareaId={subtarea.id}
              onDone={() => {
                setEditingId(null)
                router.refresh()
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <SubtareaRow
              key={subtarea.id}
              subtarea={subtarea}
              modoLectura={modoLectura}
              onEdit={() => { setEditingId(subtarea.id); setShowNueva(false) }}
              onDelete={() => {
                startTransition(async () => {
                  const res = await eliminarSubtarea(subtarea.id)
                  if (!res.success) toast.error(res.error)
                  else { toast.success("Subtarea eliminada"); router.refresh() }
                })
              }}
            />
          )
        )}

        {subtareas.length === 0 && !showNueva && (
          <p className="text-sm text-muted-foreground py-2">
            Esta tarea no tiene subtareas.{!modoLectura && " Usá el botón para agregar."}
          </p>
        )}

        {/* Formulario nueva subtarea */}
        {showNueva && (
          <FormSubtarea
            parentId={parentId}
            companeros={companeros}
            onDone={() => {
              setShowNueva(false)
              router.refresh()
            }}
            onCancel={() => setShowNueva(false)}
          />
        )}
      </CardContent>
    </Card>
  )
}

function SubtareaRow({
  subtarea,
  modoLectura,
  onEdit,
  onDelete,
}: {
  subtarea: Subtarea
  modoLectura: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const nombre = NombreSubtarea(subtarea)
  const completada = subtarea.estado === "COMPLETADA"

  return (
    <div className="flex items-start gap-2 rounded-md border bg-card px-3 py-2 text-sm">
      {completada ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
      )}

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className={cn("font-medium leading-tight", completada && "line-through text-muted-foreground")}>
          {nombre}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className={cn("font-medium", ESTADO_COLOR[subtarea.estado])}>
            {ESTADO_LABEL[subtarea.estado]}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatFecha(subtarea.fechaEstimadaInicio)} → {formatFecha(subtarea.fechaEstimadaFin)}
          </span>
          <span>
            {subtarea.asignadoA.nombre} {subtarea.asignadoA.apellido}
          </span>
        </div>
      </div>

      {!modoLectura && (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-1 text-muted-foreground/60 hover:text-primary hover:bg-muted transition-colors"
            title="Editar subtarea"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 text-muted-foreground/60 hover:text-destructive hover:bg-muted transition-colors"
            title="Eliminar subtarea"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function FormSubtarea({
  parentId,
  tareaId,
  companeros,
  inicial,
  onDone,
  onCancel,
}: {
  parentId: string
  tareaId?: string
  companeros: Companero[]
  inicial?: {
    nombre: string
    fechaInicio: string
    fechaFin: string
    responsableId: string
    estado: EstadoTareaInstancia
  }
  onDone: () => void
  onCancel: () => void
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "")
  const [fechaInicio, setFechaInicio] = useState(
    inicial?.fechaInicio ?? format(new Date(), "yyyy-MM-dd")
  )
  const [fechaFin, setFechaFin] = useState(
    inicial?.fechaFin ?? format(new Date(), "yyyy-MM-dd")
  )
  const [responsableId, setResponsableId] = useState<string>(inicial?.responsableId ?? "")
  const [estado, setEstado] = useState<EstadoTareaInstancia>(inicial?.estado ?? "PENDIENTE")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esEdicion = !!tareaId

  async function handleGuardar() {
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return }
    setError(null)
    setLoading(true)

    const res = esEdicion
      ? await editarSubtarea({
          tareaId: tareaId!,
          nombre: nombre.trim(),
          fechaInicio,
          fechaFin,
          responsableId: responsableId || undefined,
          estado,
        })
      : await crearSubtarea({
          parentId,
          nombre: nombre.trim(),
          fechaInicio,
          fechaFin,
          responsableId: responsableId || undefined,
        })

    setLoading(false)
    if (!res.success) {
      setError(res.error)
    } else {
      toast.success(esEdicion ? "Subtarea actualizada" : "Subtarea creada")
      onDone()
    }
  }

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {esEdicion ? "Editar subtarea" : "Nueva subtarea"}
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">Nombre</Label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la subtarea"
          className="h-8 text-sm"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Fecha inicio</Label>
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Fecha fin</Label>
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {companeros.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Responsable <span className="text-muted-foreground">(opcional)</span></Label>
          <Select
            value={responsableId || "__none__"}
            onValueChange={(v) => setResponsableId(v === "__none__" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin asignar</SelectItem>
              {companeros.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {esEdicion && (
        <div className="space-y-1.5">
          <Label className="text-xs">Estado</Label>
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoTareaInstancia)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ESTADO_LABEL) as EstadoTareaInstancia[]).map((e) => (
                <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={loading}>
          <X className="h-3.5 w-3.5 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={handleGuardar} disabled={loading}>
          <Check className="h-3.5 w-3.5 mr-1" />
          {loading ? "Guardando…" : esEdicion ? "Guardar" : "Agregar"}
        </Button>
      </div>
    </div>
  )
}
