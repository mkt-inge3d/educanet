import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mesActual } from "@/lib/gamificacion/periodo";
import { obtenerDashboardJefe, obtenerAdopcionEquipo } from "@/lib/jefe/queries";
import { obtenerProgresoBonusEquipo } from "@/lib/piloto/bonus-equipo";
import { obtenerAgregadosEncuestas } from "@/lib/encuestas/queries";
import { PilotoPanelCliente } from "./piloto-panel-cliente";

export const metadata = { title: "Admin - Piloto" };

export default async function AdminPilotoPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const configs = await prisma.configuracionPiloto.findMany({
    include: { area: true },
    orderBy: { createdAt: "desc" },
  });

  if (configs.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Piloto</h1>
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay piloto configurado aun. Corre{" "}
          <code className="text-foreground">npm run db:seed-piloto</code> para
          crear uno.
        </p>
      </div>
    );
  }

  const config = configs[0];
  const { mes, anio } = mesActual();

  // Usar cualquier miembro como referencia para el dashboard (bypassa
  // el filtro "jefeId"). Aqui como admin, siempre vemos todo (no
  // anonimizado desde la perspectiva del admin).
  const cualquierMiembro = await prisma.user.findFirst({
    where: { areaId: config.areaId, activo: true },
    select: { id: true },
  });

  const dashboard = cualquierMiembro
    ? await obtenerDashboardJefe({
        jefeId: cualquierMiembro.id,
        mes,
        anio,
      })
    : null;

  const [adopcion, bonus, encuestas] = await Promise.all([
    obtenerAdopcionEquipo({ areaId: config.areaId, mes, anio }),
    obtenerProgresoBonusEquipo(config.areaId, mes, anio),
    obtenerAgregadosEncuestas({ areaId: config.areaId, mes, anio }),
  ]);

  return (
    <PilotoPanelCliente
      config={{
        id: config.id,
        areaId: config.areaId,
        areaNombre: config.area.nombre,
        activo: config.activo,
        fechaInicio: config.fechaInicio.toISOString(),
        fechaFin: config.fechaFin.toISOString(),
        mostrarBannerPiloto: config.mostrarBannerPiloto,
        fechaFinBanner: config.fechaFinBanner?.toISOString() ?? null,
        anonimizarParaJefe: config.anonimizarParaJefe,
        fechaFinAnonimizacion:
          config.fechaFinAnonimizacion?.toISOString() ?? null,
        metaCumplimientoKpis: config.metaCumplimientoKpis,
        bonusEquipoPuntos: config.bonusEquipoPuntos,
        bonusYaOtorgadoMes: config.bonusYaOtorgadoMes,
        bonusYaOtorgadoAnio: config.bonusYaOtorgadoAnio,
        notas: config.notas ?? "",
      }}
      dashboard={
        dashboard
          ? {
              totalMiembros: dashboard.totalMiembros,
              promedioPuntos: dashboard.promedioPuntos,
              promedioCumplimientoKpis: dashboard.promedioCumplimientoKpis,
              distribucionRangos: dashboard.distribucionRangos,
            }
          : null
      }
      adopcion={adopcion}
      bonus={bonus}
      encuestas={encuestas}
      mes={mes}
      anio={anio}
    />
  );
}
