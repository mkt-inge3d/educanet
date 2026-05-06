"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TIMEZONES_COMUNES } from "@/lib/calendarios/schemas"

interface FormGeneralProps {
  initialData?: {
    nombre: string
    timezone: string
    esDefault: boolean
  }
  onSubmit: (data: { nombre: string; timezone: string; esDefault: boolean }) => Promise<{ error?: string; ok?: boolean }>
  submitLabel?: string
}

export function FormGeneral({ initialData, onSubmit, submitLabel = "Guardar" }: FormGeneralProps) {
  const router = useRouter()
  const [nombre, setNombre] = useState(initialData?.nombre ?? "")
  const [timezone, setTimezone] = useState(initialData?.timezone ?? "America/Lima")
  const [esDefault, setEsDefault] = useState(initialData?.esDefault ?? false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await onSubmit({ nombre, timezone, esDefault })
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    router.push("/admin/calendarios")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre del calendario</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Horario estándar Lima"
          minLength={2}
          maxLength={80}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="timezone">Zona horaria</Label>
        <Select value={timezone} onValueChange={(v) => setTimezone(v ?? "America/Lima")}>
          <SelectTrigger id="timezone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES_COMUNES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Calendario por defecto</p>
          <p className="text-xs text-muted-foreground">
            Se asignará automáticamente a nuevos proyectos
          </p>
        </div>
        <ToggleSwitch checked={esDefault} onCheckedChange={setEsDefault} />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/calendarios")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
