"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { crearTareaGantt } from "@/lib/gantt/actions"
import { format, addDays } from "date-fns"

interface Usuario { id: string; nombre: string; apellido: string }

interface AddTaskDialogProps {
  workflowId: string
  usuarios: Usuario[]
  defaultStart: Date
  onCreated: () => void
}

export function AddTaskDialog({ workflowId, usuarios, defaultStart, onCreated }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState("")
  const [inicio, setInicio] = useState(format(defaultStart, "yyyy-MM-dd"))
  const [fin, setFin] = useState(format(addDays(defaultStart, 1), "yyyy-MM-dd"))
  const [esHito, setEsHito] = useState(false)
  const [asignadoAId, setAsignadoAId] = useState(usuarios[0]?.id ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!asignadoAId) { setError("Seleccioná un responsable"); return }
    setError(null)
    setLoading(true)
    const res = await crearTareaGantt(workflowId, {
      nombre,
      inicio: new Date(inicio),
      fin: esHito ? new Date(inicio) : new Date(fin),
      asignadoAId,
      esHito,
    })
    setLoading(false)
    if ("error" in res) { setError(res.error as string); return }
    setOpen(false)
    setNombre("")
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="h-7 text-xs" />}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Nueva tarea
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva tarea en Gantt</DialogTitle>
        </DialogHeader>
        <form id="form-add-task" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la tarea"
              required
              minLength={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Es hito</p>
              <p className="text-xs text-muted-foreground">Duración cero, marca un punto</p>
            </div>
            <ToggleSwitch checked={esHito} onCheckedChange={setEsHito} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Inicio</Label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
            </div>
            {!esHito && (
              <div className="space-y-1.5">
                <Label>Fin</Label>
                <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} required />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Responsable</Label>
            <Select value={asignadoAId} onValueChange={(v) => setAsignadoAId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nombre} {u.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
        <DialogFooter>
          <Button form="form-add-task" type="submit" disabled={loading}>
            {loading ? "Creando…" : "Crear tarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
