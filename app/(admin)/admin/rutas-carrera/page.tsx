import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

async function listarRutasCarrera() {
  "use cache";
  cacheLife("hours");
  cacheTag("carrera", "rutas-carrera");
  return prisma.rutaCarrera.findMany({
    include: {
      puestoOrigen: { select: { nombre: true } },
      puestoDestino: { select: { nombre: true } },
      _count: { select: { cursos: true, metricas: true } },
    },
    orderBy: { titulo: "asc" },
  });
}

export const metadata = { title: "Admin - Rutas de carrera" };

export default async function AdminRutasPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const rutas = await listarRutasCarrera();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rutas de carrera</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {rutas.map((r) => (
          <Card key={r.id} className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{r.puestoOrigen.nombre}</span>
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="font-medium">{r.puestoDestino.nombre}</span>
            </div>
            <p className="text-sm text-muted-foreground">{r.titulo}</p>
            <div className="flex items-center gap-3 text-xs">
              <Badge variant="outline">{r._count.cursos} cursos</Badge>
              <Badge variant="outline">{r._count.metricas} metricas</Badge>
              <Badge variant="outline" className={r.activa ? "text-success" : "text-muted-foreground"}>
                {r.activa ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
