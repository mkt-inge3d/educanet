"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { crearWorkflowWebinarV2 } from "@/lib/admin/webinar-instancia-actions"
import { SelectorNegocio } from "@/components/tareas/SelectorNegocio"
import type { Negocio } from "@prisma/client"
import { format } from "date-fns"

interface Usuario { id: string; nombre: string; apellido: string }
interface Calendario { id: string; nombre: string }

interface Props {
  plantillaWebinarId: string
  usuarios: Usuario[]
  calendarios: Calendario[]
  currentUserId: string
}

export function CrearWebinarDialog({ plantillaWebinarId, usuarios, calendarios, currentUserId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState("")
  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [fechaEvento, setFechaEvento] = useState(format(new Date(), "yyyy-MM-dd"))
  const [responsableId, setResponsableId] = useState(currentUserId)
  const [calendarId, setCalendarId] = useState("")

  function reset() {
    setNombre("")
    setNegocio(null)
    setFechaEvento(format(new Date(), "yyyy-MM-dd"))
    setResponsableId(currentUserId)
    setCalendarId("")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!responsableId) { setError("Seleccioná un responsable"); return }
    setError(null)
    setLoading(true)

    try {
      const res = await crearWorkflowWebinarV2({
        plantillaId: plantillaWebinarId,
        nombre: nombre || `Webinar ${new Date(fechaEvento).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}`,
        fechaEvento: new Date(fechaEvento),
        responsableGeneralId: responsableId,
        negocio,
        calendarId: calendarId || undefined,
      })

      if ("error" in res) { setError(res.error); setLoading(false); return }

      setOpen(false)
      reset()
      router.push(`/flujograma/${res.workflowInstanciaId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
      setLoading(false)
    }
  }

  const responsableSeleccionado = usuarios.find((u) => u.id === responsableId)

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1.5 h-4 w-4" />
        Nuevo webinar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear proyecto webinar</DialogTitle>
        </DialogHeader>
        <form id="form-crear-webinar" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre del proyecto</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Webinar Autodesk — Junio 2026"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fecha del evento <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={fechaEvento}
              onChange={(e) => setFechaEvento(e.target.value)}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              El sistema generará 67 tareas y el flujograma BPMN automáticamente.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Marca / negocio <span className="text-muted-foreground">(opcional)</span></Label>
            <SelectorNegocio value={negocio} onChange={setNegocio} placeholder="Sin asignar" />
          </div>

          <div className="space-y-1.5">
            <Label>Responsable general</Label>
            <Select value={responsableId} onValueChange={(v) => setResponsableId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar…">
                  {responsableSeleccionado
                    ? `${responsableSeleccionado.nombre} ${responsableSeleccionado.apellido}`
                    : null}
                </SelectValue>
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

          {calendarios.length > 0 && (
            <div className="space-y-1.5">
              <Label>Calendario laboral <span className="text-muted-foreground">(opcional)</span></Label>
              <Select value={calendarId} onValueChange={(v) => setCalendarId(v === "__none__" ? "" : (v ?? ""))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin calendario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin calendario</SelectItem>
                  {calendarios.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
        <DialogFooter>
          <Button form="form-crear-webinar" type="submit" disabled={loading}>
            {loading ? "Creando…" : "Crear y ver flujograma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
