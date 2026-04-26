import Link from "next/link";
import { Settings, Target } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function listarPuestosConKpis() {
  "use cache";
  cacheLife("hours");
  cacheTag("admin-kpis-config", "puestos");
  return prisma.puesto.findMany({
    include: {
      area: { select: { nombre: true } },
      kpiDefiniciones: {
        where: { frecuencia: null },
        orderBy: [{ activa: "desc" }, { orden: "asc" }],
      },
      _count: { select: { users: true } },
    },
    orderBy: [{ areaId: "asc" }, { nivel: "asc" }],
  });
}

export const metadata = { title: "Admin - KPIs" };

export default async function AdminKpisPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const puestos = await listarPuestosConKpis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KPIs por puesto</h1>
        <p className="text-sm text-muted-foreground">
          Plantillas de KPIs. Los pesos de cada puesto deben sumar 100.
        </p>
      </div>

      {puestos.map((p) => {
        const total = p.kpiDefiniciones.reduce((s, d) => s + (d.peso ?? 0), 0);
        const pesoOk = total === 100;
        return (
          <Card key={p.id} className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {p.nombre}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {p.area.nombre} · {p._count.users} empleados
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {p.kpiDefiniciones.length} KPI
                  {p.kpiDefiniciones.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={pesoOk ? "outline" : "destructive"}>
                  Peso total: {total}%
                </Badge>
                <Link
                  href={`/admin/kpis/${p.id}`}
                  className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-xs font-medium hover:bg-muted"
                >
                  <Settings className="h-3 w-3" />
                  Editar
                </Link>
              </div>
            </div>

            {p.kpiDefiniciones.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                Aun no hay definiciones para este puesto.
              </div>
            ) : (
              <div className="space-y-2">
                {p.kpiDefiniciones.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-md border bg-background/50 p-2.5 text-sm"
                  >
                    <Target
                      className={
                        d.activa
                          ? "h-4 w-4 flex-shrink-0 text-primary"
                          : "h-4 w-4 flex-shrink-0 text-muted-foreground"
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{d.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.codigo} · {d.unidad} · {d.tipoMeta}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {d.peso}%
                    </Badge>
                    {!d.activa && (
                      <Badge variant="secondary" className="text-xs">
                        Inactiva
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
