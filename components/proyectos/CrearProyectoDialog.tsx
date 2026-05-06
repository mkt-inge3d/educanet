"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { instanciarWorkflow } from "@/lib/admin/workflow-instancia-actions"
import { format } from "date-fns"

interface Plantilla { id: string; nombre: string; categoria: string }
interface Usuario { id: string; nombre: string; apellido: string }
interface Calendario { id: string; nombre: string }

interface CrearProyectoDialogProps {
  plantillas: Plantilla[]
  usuarios: Usuario[]
  calendarios: Calendario[]
  currentUserId: string
}

export function CrearProyectoDialog({ plantillas, usuarios, calendarios, currentUserId }: CrearProyectoDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ tareasCreadas: number; tareasOmitidas: { codigo: string; motivo: string }[] } | null>(null)
  const [workflowCreado, setWorkflowCreado] = useState<string | null>(null)

  const [plantillaId, setPlantillaId] = useState(plantillas[0]?.id ?? "")
  const [nombre, setNombre] = useState("")
  const [contextoMarca, setContextoMarca] = useState("")
  const [fechaHito, setFechaHito] = useState(format(new Date(), "yyyy-MM-dd"))
  const [responsableId, setResponsableId] = useState(currentUserId || usuarios[0]?.id || "")
  const [calendarId, setCalendarId] = useState("")
  const [notas, setNotas] = useState("")

  const plantillaSeleccionada = plantillas.find((p) => p.id === plantillaId)

  function resetForm() {
    setPlantillaId(plantillas[0]?.id ?? "")
    setNombre("")
    setContextoMarca("")
    setFechaHito(format(new Date(), "yyyy-MM-dd"))
    setResponsableId(usuarios[0]?.id ?? "")
    setCalendarId("")
    setNotas("")
    setError(null)
    setResultado(null)
    setWorkflowCreado(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!plantillaId) { setError("Seleccioná una plantilla"); return }
    if (!responsableId) { setError("Seleccioná un responsable"); return }
    setError(null)
    setLoading(true)

    let res
    try {
      res = await instanciarWorkflow({
        plantillaId,
        nombre: nombre || (plantillaSeleccionada?.nombre ?? ""),
        contextoMarca: contextoMarca || undefined,
        fechaHito: new Date(fechaHito),
        responsableGeneralId: responsableId,
        calendarId: calendarId || undefined,
        notas: notas || undefined,
      })
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : "Error inesperado al crear el proyecto")
      return
    }

    setLoading(false)

    if ("error" in res) {
      setError(res.error as string)
      return
    }

    setResultado({ tareasCreadas: res.tareasCreadas, tareasOmitidas: res.tareasOmitidas })
    setWorkflowCreado(res.workflowInstanciaId)
    router.refresh()
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1.5 h-4 w-4" />
        Nuevo proyecto
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear proyecto</DialogTitle>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/30">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Proyecto creado con {resultado.tareasCreadas} tarea{resultado.tareasCreadas !== 1 ? "s" : ""}
              </p>
              {resultado.tareasOmitidas.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Tareas sin asignar ({resultado.tareasOmitidas.length}):
                  </p>
                  {resultado.tareasOmitidas.map((o) => (
                    <p key={o.codigo} className="text-xs text-muted-foreground">
                      <span className="font-mono">{o.codigo}</span>: {o.motivo}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                Cerrar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleOpenChange(false)
                  router.push(`/proyectos/${workflowCreado}/gantt`)
                }}
              >
                Ver Gantt
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <form id="form-crear-proyecto" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Plantilla</Label>
                <Select value={plantillaId} onValueChange={(v) => setPlantillaId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar plantilla…" />
                  </SelectTrigger>
                  <SelectContent>
                    {plantillas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                        <span className="ml-2 text-xs text-muted-foreground">({p.categoria})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre del proyecto</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={plantillaSeleccionada?.nombre ?? "Nombre…"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contexto / marca <span className="text-muted-foreground">(opcional)</span></Label>
                <Input
                  value={contextoMarca}
                  onChange={(e) => setContextoMarca(e.target.value)}
                  placeholder="Marca, campaña, cliente…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha hito</Label>
                <Input
                  type="date"
                  value={fechaHito}
                  onChange={(e) => setFechaHito(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Responsable general</Label>
                <Select value={responsableId} onValueChange={(v) => setResponsableId(v ?? "")}>
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
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Notas <span className="text-muted-foreground">(opcional)</span></Label>
                <Input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones generales…"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
            <DialogFooter>
              <Button form="form-crear-proyecto" type="submit" disabled={loading || !plantillaId}>
                {loading ? "Creando…" : "Crear proyecto"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
