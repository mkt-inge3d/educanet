import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { procesarEvento } from "@/lib/gamificacion/motor";

export type ResultadoBonus = {
  otorgado: boolean;
  miembrosBeneficiados: number;
  puntos: number;
  promedio: number;
  meta: number;
  razon?: string;
};

export async function evaluarYOtorgarBonusEquipo(params: {
  areaId: string;
  mes: number;
  anio: number;
}): Promise<ResultadoBonus> {
  const config = await prisma.configuracionPiloto.findUnique({
    where: { areaId: params.areaId },
  });
  if (!config?.activo) {
    return {
      otorgado: false,
      miembrosBeneficiados: 0,
      puntos: 0,
      promedio: 0,
      meta: 0,
      razon: "Piloto inactivo",
    };
  }

  if (
    config.bonusYaOtorgadoMes === params.mes &&
    config.bonusYaOtorgadoAnio === params.anio
  ) {
    return {
      otorgado: false,
      miembrosBeneficiados: 0,
      puntos: 0,
      promedio: 0,
      meta: config.metaCumplimientoKpis,
      razon: "Bonus ya otorgado este mes",
    };
  }

  const rangos = await prisma.rangoMensual.findMany({
    where: {
      periodoMes: params.mes,
      periodoAnio: params.anio,
      user: { areaId: params.areaId, activo: true },
    },
    select: { userId: true, cumplimientoKpis: true },
  });

  if (rangos.length === 0) {
    return {
      otorgado: false,
      miembrosBeneficiados: 0,
      puntos: 0,
      promedio: 0,
      meta: config.metaCumplimientoKpis,
      razon: "Sin datos del equipo para el mes",
    };
  }

  const promedio =
    rangos.reduce((s, r) => s + r.cumplimientoKpis, 0) / rangos.length;

  if (promedio < config.metaCumplimientoKpis) {
    return {
      otorgado: false,
      miembrosBeneficiados: 0,
      puntos: 0,
      promedio,
      meta: config.metaCumplimientoKpis,
      razon: `Promedio ${promedio.toFixed(1)}% < meta ${config.metaCumplimientoKpis}%`,
    };
  }

  for (const r of rangos) {
    await procesarEvento({
      userId: r.userId,
      tipo: "BONUS_EQUIPO",
      fuente: "EQUIPO",
      puntosBrutos: config.bonusEquipoPuntos,
      descripcion: `Bonus de equipo · ${promedio.toFixed(1)}% de cumplimiento`,
      metadatos: {
        bonus_equipo: true,
        promedioEquipo: promedio,
        meta: config.metaCumplimientoKpis,
        mes: params.mes,
        anio: params.anio,
      },
    });
  }

  await prisma.configuracionPiloto.update({
    where: { areaId: params.areaId },
    data: {
      bonusYaOtorgadoMes: params.mes,
      bonusYaOtorgadoAnio: params.anio,
    },
  });

  await prisma.notificacion.createMany({
    data: rangos.map((r) => ({
      userId: r.userId,
      tipo: "LOGRO" as const,
      titulo: "El equipo lo logro",
      mensaje: `Alcanzaron ${promedio.toFixed(1)}% de cumplimiento promedio. Todos ganan +${config.bonusEquipoPuntos} pts.`,
      url: "/mi-progreso",
    })),
  });

  return {
    otorgado: true,
    miembrosBeneficiados: rangos.length,
    puntos: config.bonusEquipoPuntos,
    promedio,
    meta: config.metaCumplimientoKpis,
  };
}

export async function obtenerProgresoBonusEquipo(
  areaId: string,
  mes: number,
  anio: number
) {
  "use cache";
  cacheLife("minutes");
  cacheTag("piloto-bonus", `piloto-bonus-${areaId}`);
  const config = await prisma.configuracionPiloto.findUnique({
    where: { areaId },
    select: {
      metaCumplimientoKpis: true,
      bonusEquipoPuntos: true,
      bonusYaOtorgadoMes: true,
      bonusYaOtorgadoAnio: true,
    },
  });
  if (!config) return null;

  const rangos = await prisma.rangoMensual.findMany({
    where: {
      periodoMes: mes,
      periodoAnio: anio,
      user: { areaId, activo: true },
    },
    select: { cumplimientoKpis: true },
  });
  const promedio =
    rangos.length > 0
      ? rangos.reduce((s, r) => s + r.cumplimientoKpis, 0) / rangos.length
      : 0;

  const yaOtorgado =
    config.bonusYaOtorgadoMes === mes && config.bonusYaOtorgadoAnio === anio;

  return {
    promedio,
    meta: config.metaCumplimientoKpis,
    bonusPuntos: config.bonusEquipoPuntos,
    yaOtorgado,
    alcanzado: promedio >= config.metaCumplimientoKpis,
    miembros: rangos.length,
  };
}
