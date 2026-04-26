import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Award, TrendingUp, Trophy, BarChart3 } from "lucide-react";

async function obtenerDatosAnaliticas() {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-analiticas");
  const ahora = new Date();
  const hace30d = new Date(ahora.getTime() - 30 * 86400000);
  const [
    totalUsuarios,
    activos7d,
    leccionesMes,
    certificadosMes,
    topBadges,
    distribucionNiveles,
    porArea,
  ] = await Promise.all([
    prisma.user.count({ where: { activo: true } }),
    prisma.user.count({
      where: { ultimaActividad: { gte: new Date(ahora.getTime() - 7 * 86400000) } },
    }),
    prisma.progresoLeccion.count({
      where: { completada: true, fechaCompletada: { gte: hace30d } },
    }),
    prisma.certificado.count({ where: { fechaEmision: { gte: hace30d } } }),
    prisma.badge.findMany({
      include: { _count: { select: { usuarios: true } } },
      orderBy: { usuarios: { _count: "desc" } },
      take: 5,
    }),
    prisma.user.groupBy({
      by: ["nivel"],
      _count: true,
      where: { activo: true },
      orderBy: { nivel: "asc" },
    }),
    prisma.area.findMany({
      include: { _count: { select: { users: true, cursos: true } } },
    }),
  ]);
  return {
    totalUsuarios,
    activos7d,
    leccionesMes,
    certificadosMes,
    topBadges,
    distribucionNiveles,
    porArea,
  };
}

export const metadata = { title: "Admin - Analiticas" };

export default async function AdminAnaliticasPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const {
    totalUsuarios,
    activos7d,
    leccionesMes,
    certificadosMes,
    topBadges,
    distribucionNiveles,
    porArea,
  } = await obtenerDatosAnaliticas();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analiticas</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total usuarios", value: totalUsuarios, icon: Users },
          { label: "Activos (7d)", value: activos7d, icon: TrendingUp },
          { label: "Lecciones completadas (30d)", value: leccionesMes, icon: BookOpen },
          { label: "Certificados (30d)", value: certificadosMes, icon: Award },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <p className="text-xs">{s.label}</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top badges */}
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Badges mas obtenidos
          </h2>
          <div className="space-y-2">
            {topBadges.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>{b.nombre}</span>
                <Badge variant="outline">{b._count.usuarios} usuarios</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Level distribution */}
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Distribucion de niveles
          </h2>
          <div className="space-y-2">
            {distribucionNiveles.map((d) => (
              <div key={d.nivel} className="flex items-center gap-3 text-sm">
                <span className="w-16">Nivel {d.nivel}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(d._count / totalUsuarios) * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-8 text-right">{d._count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* By area */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold mb-3">Por area</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {porArea.map((a) => (
              <div key={a.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="font-medium text-sm">{a.nombre}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{a._count.users} usuarios</span>
                  <span>{a._count.cursos} cursos</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
