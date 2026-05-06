import { obtenerKpisDashboard, obtenerTopCursos, obtenerUsuariosRecientes } from "@/lib/admin/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, CheckCircle, Award, Sparkles, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TiempoRelativo } from "@/components/ui/TiempoRelativo";

export const metadata = { title: "Admin - Dashboard" };

export default async function AdminDashboardPage() {
  const [kpis, topCursos, usuariosRecientes] = await Promise.all([
    obtenerKpisDashboard(),
    obtenerTopCursos(),
    obtenerUsuariosRecientes(),
  ]);

  const stats = [
    { label: "Usuarios activos (7d)", value: kpis.usuariosActivos7d, icon: Users, color: "text-primary" },
    { label: "Cursos publicados", value: kpis.cursosPublicados, icon: BookOpen, color: "text-primary" },
    { label: "Lecciones completadas (mes)", value: kpis.leccionesCompletadasMes, icon: CheckCircle, color: "text-success" },
    { label: "Certificados (mes)", value: kpis.certificadosMes, icon: Award, color: "text-amber-500" },
    { label: "Puntos otorgados (mes)", value: kpis.puntosOtorgadosMes, icon: Sparkles, color: "text-primary" },
    { label: "Total usuarios", value: kpis.totalUsuarios, icon: Activity, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${s.color}`} />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top courses */}
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Cursos mas completados</h2>
          {topCursos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos aun</p>
          ) : (
            <div className="space-y-2">
              {topCursos.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/cursos`}
                  className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{c.titulo}</p>
                    <p className="text-xs text-muted-foreground">{c.areaNombre}</p>
                  </div>
                  <Badge variant="outline">{c.certificados} cert.</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent users */}
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Usuarios recientes</h2>
          <div className="space-y-2">
            {usuariosRecientes.map((u) => (
              <Link
                key={u.id}
                href={`/admin/usuarios`}
                className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium">{u.nombre} {u.apellido}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">{u.rol}</Badge>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <TiempoRelativo fecha={u.createdAt} />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold mb-3">Acciones rapidas</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" render={<Link href="/admin/cursos/nuevo" />}>
            <BookOpen className="h-6 w-6 text-primary" />
            <span>Crear nuevo curso</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" render={<Link href="/admin/usuarios" />}>
            <Users className="h-6 w-6 text-primary" />
            <span>Gestionar usuarios</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" render={<Link href="/admin/metricas/registrar" />}>
            <Award className="h-6 w-6 text-primary" />
            <span>Registrar metricas</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
