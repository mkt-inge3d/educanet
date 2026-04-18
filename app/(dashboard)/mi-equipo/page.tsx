import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import { obtenerPilotoContextoPorArea } from "@/lib/piloto/queries";
import { obtenerDashboardJefe, obtenerAdopcionEquipo } from "@/lib/jefe/queries";
import { obtenerCompromisosPendientesValidacion } from "@/lib/compromisos/queries";
import { AvisoAnonimizado } from "@/components/jefe/AvisoAnonimizado";
import { StatsAgregadasEquipo } from "@/components/jefe/StatsAgregadasEquipo";
import { DistribucionRangos } from "@/components/jefe/DistribucionRangos";
import { BreakdownFuentesEquipo } from "@/components/jefe/BreakdownFuentesEquipo";
import { MiembrosDetalle } from "@/components/jefe/MiembrosDetalle";
import { PanelValidacionJefe } from "@/components/compromisos/PanelValidacionJefe";

export const metadata = { title: "Mi equipo" };

export default async function MiEquipoPage() {
  const user = await requireAuth();
  const esJefe = user.puesto?.nombre?.startsWith("Jefe") ?? false;
  const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
  if (!esJefe && !esAdmin) redirect("/unauthorized");
  if (!user.areaId) redirect("/mi-progreso");

  const { mes, anio } = mesActual();
  const [dashboard, adopcion, ctxPiloto, pendientes] = await Promise.all([
    obtenerDashboardJefe({ jefeId: user.id, mes, anio }),
    obtenerAdopcionEquipo({ areaId: user.areaId, mes, anio }),
    obtenerPilotoContextoPorArea(user.areaId),
    obtenerCompromisosPendientesValidacion(user.areaId),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi equipo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.area?.nombre ?? "Area"} · {dashboard.totalMiembros} miembros
        </p>
      </div>

      {dashboard.enModoAnonimizado && (
        <AvisoAnonimizado
          fechaFin={ctxPiloto.config?.fechaFinAnonimizacion ?? null}
        />
      )}

      <StatsAgregadasEquipo
        totalMiembros={dashboard.totalMiembros}
        promedioPuntos={dashboard.promedioPuntos}
        promedioCumplimientoKpis={dashboard.promedioCumplimientoKpis}
        distribucionRangos={dashboard.distribucionRangos}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <DistribucionRangos
          distribucion={dashboard.distribucionRangos}
          total={dashboard.totalMiembros}
        />
        <BreakdownFuentesEquipo breakdown={dashboard.breakdownEquipo} />
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h3 className="text-base font-semibold">Adopcion del sistema</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          % de miembros que realizo cada accion este mes
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Reportaron KPIs", pct: adopcion.pctReporteKpi },
            { label: "Dieron reconocimiento", pct: adopcion.pctReconocimiento },
            { label: "Crearon compromiso", pct: adopcion.pctCompromiso },
            {
              label: "Completaron mision",
              pct: adopcion.pctMisionCompletada,
            },
          ].map((a) => (
            <div key={a.label} className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">{a.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{a.pct}%</p>
            </div>
          ))}
        </div>
      </section>

      <MiembrosDetalle miembros={dashboard.miembrosDetalle} />

      {pendientes.length > 0 && (
        <PanelValidacionJefe pendientes={pendientes} />
      )}
    </div>
  );
}
