"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { crearFeriado, eliminarFeriado } from "@/lib/calendarios/actions"
import type { TipoFeriado } from "@prisma/client"

interface FeriadoRow {
  id: string
  fecha: Date
  nombre: string
  recurrente: boolean
  tipo: TipoFeriado
}

const TIPO_LABELS: Record<TipoFeriado, string> = {
  NACIONAL: "Nacional",
  EMPRESA: "Empresa",
  EQUIPO: "Equipo",
}

const TIPO_VARIANT: Record<TipoFeriado, string> = {
  NACIONAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EMPRESA: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  EQUIPO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
}

export function EditorFeriados({
  calendarId,
  feriados: initialFeriados,
}: {
  calendarId: string
  feriados: FeriadoRow[]
}) {
  const router = useRouter()
  const [feriados, setFeriados] = useState(initialFeriados)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fecha, setFecha] = useState("")
  const [nombre, setNombre] = useState("")
  const [recurrente, setRecurrente] = useState(false)
  const [tipo, setTipo] = useState<TipoFeriado>("NACIONAL")

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await crearFeriado(calendarId, { fecha, nombre, recurrente, tipo })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setOpen(false)
    setFecha(""); setNombre(""); setRecurrente(false); setTipo("NACIONAL")
    router.refresh()
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este feriado?")) return
    await eliminarFeriado(id, calendarId)
    setFeriados((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {feriados.length} feriado{feriados.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar feriado
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Nuevo feriado</DialogTitle>
            </DialogHeader>
            <form id="form-feriado" onSubmit={handleAgregar} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Día del Trabajo"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo((v ?? "NACIONAL") as TipoFeriado)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Recurrente</p>
                  <p className="text-xs text-muted-foreground">Se repite cada año</p>
                </div>
                <ToggleSwitch checked={recurrente} onCheckedChange={setRecurrente} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
            <DialogFooter>
              <Button form="form-feriado" type="submit" disabled={loading}>
                {loading ? "Guardando…" : "Agregar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {feriados.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sin feriados configurados.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {feriados.map((f) => {
            const d = new Date(f.fecha)
            const fechaStr = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}${f.recurrente ? "" : `/${d.getUTCFullYear()}`}`
            return (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-16 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                  {fechaStr}
                </span>
                <span className="flex-1 text-sm">{f.nombre}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TIPO_VARIANT[f.tipo]}`}>
                  {TIPO_LABELS[f.tipo]}
                </span>
                {f.recurrente && (
                  <Badge variant="outline" className="text-[10px]">Anual</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleEliminar(f.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
