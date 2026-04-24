import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import { obtenerPilotoContextoPorArea } from "@/lib/piloto/queries";
import { obtenerDashboardJefe, obtenerAdopcionEquipo } from "@/lib/jefe/queries";
import {
  obtenerCompromisosPendientesValidacion,
  obtenerPropuestasPorAprobar,
  obtenerCompromisosDelEquipoPorMiembro,
} from "@/lib/compromisos/queries";
import { AvisoAnonimizado } from "@/components/jefe/AvisoAnonimizado";
import { StatsAgregadasEquipo } from "@/components/jefe/StatsAgregadasEquipo";
import { DistribucionRangos } from "@/components/jefe/DistribucionRangos";
import { BreakdownFuentesEquipo } from "@/components/jefe/BreakdownFuentesEquipo";
import { MiembrosDetalle } from "@/components/jefe/MiembrosDetalle";
import { MiembrosCompromisosPanel } from "@/components/jefe/MiembrosCompromisosPanel";
import { PanelValidacionJefe } from "@/components/compromisos/PanelValidacionJefe";
import { PanelPropuestasJefe } from "@/components/compromisos/PanelPropuestasJefe";
import { BentoGrid, BentoItem } from "@/components/ui/primitives/BentoGrid";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";
import { NumeroAnimado } from "@/components/ui/primitives/NumeroAnimado";
import { GlassCard } from "@/components/ui/primitives/GlassCard";

export const metadata = { title: "Mi equipo" };

export default async function MiEquipoPage() {
  const user = await requireAuth();
  const esJefe = user.puesto?.nombre?.startsWith("Jefe") ?? false;
  const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
  if (!esJefe && !esAdmin) redirect("/unauthorized");
  if (!user.areaId) redirect("/mi-progreso");

  const { mes, anio } = mesActual();
  const [
    dashboard,
    adopcion,
    ctxPiloto,
    pendientesValidar,
    propuestas,
    miembrosCompromisos,
  ] = await Promise.all([
    obtenerDashboardJefe({ jefeId: user.id, mes, anio }),
    obtenerAdopcionEquipo({ areaId: user.areaId, mes, anio }),
    obtenerPilotoContextoPorArea(user.areaId),
    obtenerCompromisosPendientesValidacion(user.areaId),
    obtenerPropuestasPorAprobar(user.areaId),
    obtenerCompromisosDelEquipoPorMiembro(user.areaId, user.id),
  ]);

  return (
    <div className="relative mx-auto max-w-6xl">
      <section className="relative mb-8 overflow-hidden pb-4 pt-2">
        <HaloBackground variant="top" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {user.area?.nombre ?? "Área"} · {dashboard.totalMiembros} miembros
          </p>
          <KineticTitle
            text="Mi equipo"
            as="h1"
            className="mt-1 text-3xl font-semibold tracking-tighter sm:text-4xl"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Tendencias agregadas del equipo. Sin datos individuales durante el
            primer mes del piloto.
          </p>
        </div>
      </section>

      <div className="space-y-6">
        {dashboard.enModoAnonimizado && (
          <AvisoAnonimizado
            fechaFin={ctxPiloto.config?.fechaFinAnonimizacion ?? null}
          />
        )}

        {/* Operativo: cards sólidas por diseño */}
        {propuestas.length > 0 && <PanelPropuestasJefe propuestas={propuestas} />}
        {pendientesValidar.length > 0 && (
          <PanelValidacionJefe pendientes={pendientesValidar} />
        )}

        <MiembrosCompromisosPanel miembros={miembrosCompromisos} />

        <BentoGrid>
          <BentoItem span="2x2">
            <GlassCard className="h-full p-5">
              <DistribucionRangos
                distribucion={dashboard.distribucionRangos}
                total={dashboard.totalMiembros}
              />
            </GlassCard>
          </BentoItem>

          <BentoItem span="2x1">
            <GlassCard className="h-full p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Promedio de puntos
              </p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">
                <NumeroAnimado value={dashboard.promedioPuntos} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Puntos promedio del equipo este mes
              </p>
            </GlassCard>
          </BentoItem>

          <BentoItem span="2x1">
            <GlassCard className="h-full p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Cumplimiento KPI
              </p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">
                <NumeroAnimado
                  value={dashboard.promedioCumplimientoKpis}
                  suffix="%"
                />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Promedio del equipo
              </p>
            </GlassCard>
          </BentoItem>

          <BentoItem span="3x2">
            <GlassCard className="h-full p-5">
              <BreakdownFuentesEquipo
                breakdown={dashboard.breakdownEquipo}
              />
            </GlassCard>
          </BentoItem>

          <BentoItem span="3x2">
            <GlassCard className="h-full p-5">
              <div>
                <h3 className="text-base font-semibold">Adopción del sistema</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  % de miembros que realizó cada acción este mes
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Reportaron KPIs", pct: adopcion.pctReporteKpi },
                  {
                    label: "Dieron reconocimiento",
                    pct: adopcion.pctReconocimiento,
                  },
                  { label: "Crearon compromiso", pct: adopcion.pctCompromiso },
                  {
                    label: "Completaron misión",
                    pct: adopcion.pctMisionCompletada,
                  },
                ].map((a) => (
                  <div
                    key={a.label}
                    className="rounded-lg border border-border/60 bg-background/50 p-3"
                  >
                    <p className="text-xs text-muted-foreground">{a.label}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                      <NumeroAnimado value={a.pct} suffix="%" />
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </BentoItem>
        </BentoGrid>

        {/* StatsAgregadas y MiembrosDetalle — densos, card sólida */}
        <StatsAgregadasEquipo
          totalMiembros={dashboard.totalMiembros}
          promedioPuntos={dashboard.promedioPuntos}
          promedioCumplimientoKpis={dashboard.promedioCumplimientoKpis}
          distribucionRangos={dashboard.distribucionRangos}
        />

        <MiembrosDetalle miembros={dashboard.miembrosDetalle} />
      </div>
    </div>
  );
}
