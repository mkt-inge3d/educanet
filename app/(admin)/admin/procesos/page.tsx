import { requireRole } from "@/lib/auth"
import { obtenerDefinicionesProceso, seedDefinicionWebinar } from "@/lib/process/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Network, Layers, Play } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SeedProcesoWebinarButton } from "./SeedProcesoWebinarButton"

export const metadata = { title: "Admin · Procesos BPMN" }

export default async function AdminProcesosPage() {
  await requireRole(["ADMIN"])

  const definiciones = await obtenerDefinicionesProceso()

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Procesos BPMN</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Definiciones de procesos en formato flujograma. Cada definición puede
            instanciarse junto a un workflow.
          </p>
        </div>
        <SeedProcesoWebinarButton />
      </div>

      {definiciones.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <Network className="mx-auto mb-3 h-8 w-8 opacity-40" />
            No hay definiciones de proceso todavía.
            <br />
            Usá el botón &ldquo;Cargar Webinar&rdquo; para crear la primera.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {definiciones.map((def) => (
            <Card key={def.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4 shrink-0 text-violet-600" />
                  {def.nombre}
                </CardTitle>
                {def.plantilla && (
                  <p className="text-xs text-muted-foreground">
                    Plantilla: {def.plantilla.nombre}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">v{def.version}</Badge>
                  <Badge variant="outline">{def._count.nodos} nodos</Badge>
                  <Badge variant="outline">
                    {def._count.instancias} instancias
                  </Badge>
                  <Badge variant="secondary" className="text-muted-foreground">
                    {format(new Date(def.creadoEn), "d MMM yyyy", { locale: es })}
                  </Badge>
                </div>
                <Link href={`/admin/procesos/${def.id}`}>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Play className="h-3.5 w-3.5" />
                    Ver detalle
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
