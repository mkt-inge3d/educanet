import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { mesActual } from "@/lib/gamificacion/periodo";
import { obtenerDashboardJefe, obtenerAdopcionEquipo } from "@/lib/jefe/queries";
import { obtenerProgresoBonusEquipo } from "@/lib/piloto/bonus-equipo";
import { obtenerAgregadosEncuestas } from "@/lib/encuestas/queries";
import { PilotoPanelCliente } from "./piloto-panel-cliente";

async function obtenerConfigPiloto() {
  "use cache";
  cacheLife("minutes");
  cacheTag("piloto-config");
  return prisma.configuracionPiloto.findMany({
    include: { area: true },
    orderBy: { createdAt: "desc" },
  });
}

async function obtenerCualquierMiembroDelArea(areaId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("companeros", `companeros-area-${areaId}`);
  return prisma.user.findFirst({
    where: { areaId, activo: true },
    select: { id: true },
  });
}

export const metadata = { title: "Admin - Piloto" };

export default async function AdminPilotoPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const configs = await obtenerConfigPiloto();

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

  const cualquierMiembro = await obtenerCualquierMiembroDelArea(config.areaId);

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
