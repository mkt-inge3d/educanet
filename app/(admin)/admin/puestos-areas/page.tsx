import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function listarAreasConPuestos() {
  "use cache";
  cacheLife("hours");
  cacheTag("areas", "puestos");
  return prisma.area.findMany({
    orderBy: { nombre: "asc" },
    include: {
      puestos: { orderBy: { nivel: "asc" } },
      _count: { select: { users: true } },
    },
  });
}

export const metadata = { title: "Admin - Puestos y areas" };

export default async function AdminPuestosAreasPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const areas = await listarAreasConPuestos();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Puestos y areas</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {areas.map((area) => (
          <Card key={area.id} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                <h2 className="font-semibold">{area.nombre}</h2>
              </div>
              <Badge variant="outline" className="text-xs">
                {area._count.users} usuarios
              </Badge>
            </div>

            {area.descripcion && (
              <p className="text-sm text-muted-foreground mb-3">{area.descripcion}</p>
            )}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Puestos
              </p>
              {area.puestos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border p-2 text-sm"
                >
                  <span>{p.nombre}</span>
                  <Badge variant="outline" className="text-xs">
                    Nivel {p.nivel}
                  </Badge>
                </div>
              ))}
              {area.puestos.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin puestos</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
