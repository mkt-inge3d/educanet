"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EditorHorario } from "@/components/admin/calendarios/EditorHorario"
import { EditorFeriados } from "@/components/admin/calendarios/EditorFeriados"
import { actualizarCalendario } from "@/lib/calendarios/actions"
import {
  TIMEZONES_COMUNES,
  HORARIO_ESTANDAR,
  HORARIO_CONTINUO,
  type HorarioSemanal,
} from "@/lib/calendarios/schemas"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { TipoFeriado } from "@prisma/client"

interface CalendarioData {
  id: string
  nombre: string
  timezone: string
  horario: unknown
  esDefault: boolean
  feriados: {
    id: string
    fecha: Date
    nombre: string
    recurrente: boolean
    tipo: TipoFeriado
  }[]
  _count: { proyectos: number }
}

export function EditarCalendarioClient({ calendario }: { calendario: CalendarioData }) {
  const router = useRouter()
  const [nombre, setNombre] = useState(calendario.nombre)
  const [timezone, setTimezone] = useState(calendario.timezone)
  const [esDefault, setEsDefault] = useState(calendario.esDefault)
  const [horario, setHorario] = useState<HorarioSemanal>(
    calendario.horario as HorarioSemanal
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await actualizarCalendario(calendario.id, { nombre, timezone, horario, esDefault })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    router.push("/admin/calendarios")
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/admin/calendarios" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar calendario</h1>
          <p className="text-sm text-muted-foreground">
            {calendario._count.proyectos} proyecto{calendario._count.proyectos !== 1 ? "s" : ""} usando este calendario
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="horario" className="flex-1">Horario semanal</TabsTrigger>
            <TabsTrigger value="feriados" className="flex-1">
              Feriados
              {calendario.feriados.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                  {calendario.feriados.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card>
              <CardContent className="space-y-5 pt-5">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <Select value={timezone} onValueChange={(v) => setTimezone(v ?? calendario.timezone)}>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="horario" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Horario semanal</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHorario(HORARIO_ESTANDAR)}
                    >
                      Estándar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHorario(HORARIO_CONTINUO)}
                    >
                      Continuo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <EditorHorario value={horario} onChange={setHorario} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feriados" className="mt-4">
            <Card>
              <CardContent className="pt-5">
                <EditorFeriados
                  calendarId={calendario.id}
                  feriados={calendario.feriados}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Guardar cambios"}
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
    </div>
  )
}
