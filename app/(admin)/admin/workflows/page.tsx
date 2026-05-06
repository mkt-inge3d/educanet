import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InstanciarWorkflowDialog } from "@/components/admin/InstanciarWorkflowDialog";

export const metadata = { title: "Admin · Workflows" };

async function obtenerDatosWorkflows() {
  "use cache";
  cacheLife("minutes");
  cacheTag("workflows");
  return Promise.all([
    prisma.workflowPlantilla.findMany({
      include: {
        _count: { select: { tareas: true, instancias: true } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.workflowInstancia.findMany({
      include: {
        plantilla: { select: { nombre: true } },
        responsableGeneral: { select: { nombre: true, apellido: true } },
        _count: { select: { tareas: true } },
        tareas: { select: { estado: true } },
      },
      orderBy: { fechaHito: "desc" },
      take: 30,
    }),
  ]);
}

export default async function AdminWorkflowsPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const [plantillas, instancias] = await obtenerDatosWorkflows();

  const [usuarios, calendarios] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, nombre: true, apellido: true },
      where: { activo: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
    prisma.calendarioLaboral.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Workflows</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plantillas disponibles e instancias recientes. Para programar uno
          nuevo usá <Link href="/mi-equipo" className="underline">Mi equipo</Link>.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Plantillas</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {plantillas.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.nombre}</CardTitle>
                <code className="text-[11px] text-muted-foreground">
                  {p.codigo}
                </code>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {p.descripcion}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{p.categoria}</Badge>
                  <Badge variant="outline">{p.duracionTotalDias} días</Badge>
                  <Badge variant="outline">{p._count.tareas} tareas</Badge>
                  <Badge variant="outline">
                    {p._count.instancias} instancias
                  </Badge>
                </div>
                {p.activo && (
                  <InstanciarWorkflowDialog
                    plantillaId={p.id}
                    plantillaNombre={p.nombre}
                    usuarios={usuarios}
                    calendarios={calendarios}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Instancias recientes</h2>
        {instancias.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Sin instancias.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Plantilla</th>
                    <th className="p-3 text-left">Responsable</th>
                    <th className="p-3 text-right">Fecha hito</th>
                    <th className="p-3 text-left">Estado</th>
                    <th className="p-3 text-left">Progreso</th>
                    <th className="p-3 text-right">Gantt</th>
                  </tr>
                </thead>
                <tbody>
                  {instancias.map((w) => {
                    const completadas = w.tareas.filter((t) => t.estado === "COMPLETADA").length;
                    const progreso = w.tareas.length > 0
                      ? Math.round((completadas / w.tareas.length) * 100)
                      : 0;
                    return (
                      <tr key={w.id} className="border-b last:border-0">
                        <td className="p-3">
                          <div className="font-medium">{w.nombre}</div>
                          {w.contextoMarca && (
                            <div className="text-xs text-muted-foreground">
                              {w.contextoMarca}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {w.plantilla.nombre}
                        </td>
                        <td className="p-3 text-xs">
                          {w.responsableGeneral.nombre}{" "}
                          {w.responsableGeneral.apellido}
                        </td>
                        <td className="p-3 text-right text-xs tabular-nums">
                          {w.fechaHito.toLocaleDateString("es")}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {w.estadoGeneral}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress value={progreso} className="h-1.5 w-24" />
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {completadas}/{w.tareas.length}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            render={<Link href={`/admin/workflows/${w.id}/gantt`} />}
                          >
                            <BarChart2 className="mr-1 h-3.5 w-3.5" />
                            Gantt
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
