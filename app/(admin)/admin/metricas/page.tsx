import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

async function listarMetricasAdmin() {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-metricas", "desempeno");
  return prisma.metricaDesempeno.findMany({
    orderBy: { fechaFin: "desc" },
    take: 50,
    include: { user: { select: { nombre: true, apellido: true, email: true } } },
  });
}

export const metadata = { title: "Admin - Metricas" };

export default async function AdminMetricasPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const metricas = await listarMetricasAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metricas de desempeno</h1>
          <p className="text-sm text-muted-foreground">{metricas.length} registros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/metricas/registrar" />}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                <th className="px-4 py-3 text-left font-medium">Metrica</th>
                <th className="px-4 py-3 text-left font-medium">Periodo</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 text-right font-medium">Objetivo</th>
                <th className="px-4 py-3 text-right font-medium">Cumplimiento</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {metricas.map((m) => {
                const cumpl = Math.round((m.valor / m.objetivo) * 100);
                return (
                  <tr key={m.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.user.nombre} {m.user.apellido}</p>
                      <p className="text-xs text-muted-foreground">{m.user.email}</p>
                    </td>
                    <td className="px-4 py-3">{m.nombre}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{m.periodo}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{m.valor} {m.unidad}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{m.objetivo} {m.unidad}</td>
                    <td className="px-4 py-3 text-right font-medium">{cumpl}%</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={m.objetivoAlcanzado ? "text-success" : "text-amber-500"}>
                        {m.objetivoAlcanzado ? "Cumplido" : "Pendiente"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
