import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import { obtenerHitosUsuario } from "@/lib/kpis/hitos-queries";
import { HitosKanban } from "@/components/kpis/hitos/HitosKanban";

export const metadata = { title: "Mis hitos KPI" };

export default async function HitosPage() {
  const user = await requireAuth();
  const { mes, anio } = mesActual();
  const hitos = await obtenerHitosUsuario(user.id, mes, anio);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis hitos KPI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.puesto?.nombre ?? "Sin puesto"} · Marca cada hito como terminado.
          Tu jefe revisa cada semana y te puede regresar tareas si algo no esta bien.
        </p>
      </div>
      <HitosKanban progreso={hitos} />
    </div>
  );
}
