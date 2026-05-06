import { requireRole } from "@/lib/auth"
import { listarCalendarios } from "@/lib/calendarios/queries"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, CalendarDays, Star } from "lucide-react"
import { AccionesCalendario } from "./acciones-calendario"

export const metadata = { title: "Admin · Calendarios laborales" }

export default async function AdminCalendariosPage() {
  await requireRole(["ADMIN"])
  const calendarios = await listarCalendarios()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendarios laborales</h1>
          <p className="text-sm text-muted-foreground">
            {calendarios.length} calendario{calendarios.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/admin/calendarios/nuevo" />}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo calendario
        </Button>
      </div>

      {calendarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay calendarios. Crea uno para asignarlo a proyectos Gantt.
            </p>
            <Button render={<Link href="/admin/calendarios/nuevo" />} size="sm">
              Crear primer calendario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {calendarios.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.timezone}</p>
                  </div>
                  {c.esDefault && (
                    <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Star className="mr-1 h-3 w-3" />
                      Default
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{c._count.feriados} feriado{c._count.feriados !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{c._count.proyectos} proyecto{c._count.proyectos !== 1 ? "s" : ""}</span>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    render={<Link href={`/admin/calendarios/${c.id}`} />}
                  >
                    Editar
                  </Button>
                  <AccionesCalendario
                    id={c.id}
                    esDefault={c.esDefault}
                    tieneProyectos={c._count.proyectos > 0}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
