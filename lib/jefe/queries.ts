import { prisma } from "@/lib/prisma";
import type { TipoRango } from "@prisma/client";
import { obtenerPilotoContextoPorArea } from "@/lib/piloto/queries";

export type DashboardJefeData = {
  enModoAnonimizado: boolean;
  totalMiembros: number;
  promedioPuntos: number;
  promedioCumplimientoKpis: number;
  distribucionRangos: Record<TipoRango, number>;
  breakdownEquipo: {
    kpis: number;
    cursos: number;
    compromisos: number;
    reconocimientos: number;
    misiones: number;
  };
  miembrosDetalle: Array<{
    userId: string;
    nombre: string;
    avatarUrl: string | null;
    puesto: string | null;
    puntosTotales: number;
    rango: TipoRango;
    cumplimientoKpis: number;
  }> | null;
};

export async function obtenerDashboardJefe(params: {
  jefeId: string;
  mes: number;
  anio: number;
}): Promise<DashboardJefeData> {
  const jefe = await prisma.user.findUnique({
    where: { id: params.jefeId },
    select: { areaId: true },
  });
  if (!jefe?.areaId) {
    throw new Error("Jefe sin area asignada");
  }

  const ctx = await obtenerPilotoContextoPorArea(jefe.areaId);
  const enModoAnon = ctx.enModoAnonimizado;

  const rangos = await prisma.rangoMensual.findMany({
    where: {
      periodoMes: params.mes,
      periodoAnio: params.anio,
      user: { areaId: jefe.areaId, id: { not: params.jefeId }, activo: true },
    },
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          avatarUrl: true,
          puesto: { select: { nombre: true } },
        },
      },
    },
    orderBy: { puntosTotales: "desc" },
  });

  const total = rangos.length;
  const promedioPuntos =
    total > 0 ? rangos.reduce((s, r) => s + r.puntosTotales, 0) / total : 0;
  const promedioCumplimiento =
    total > 0
      ? rangos.reduce((s, r) => s + r.cumplimientoKpis, 0) / total
      : 0;

  const distribucionRangos: Record<TipoRango, number> = {
    BRONCE: 0,
    PLATA: 0,
    ORO: 0,
    DIAMANTE: 0,
  };
  for (const r of rangos) distribucionRangos[r.rango]++;

  const breakdownEquipo = {
    kpis: rangos.reduce((s, r) => s + r.puntosKpis, 0),
    cursos: rangos.reduce((s, r) => s + r.puntosCursos, 0),
    compromisos: rangos.reduce((s, r) => s + r.puntosCompromisos, 0),
    reconocimientos: rangos.reduce((s, r) => s + r.puntosReconocimientos, 0),
    misiones: rangos.reduce((s, r) => s + r.puntosMisiones, 0),
  };

  return {
    enModoAnonimizado: enModoAnon,
    totalMiembros: total,
    promedioPuntos,
    promedioCumplimientoKpis: promedioCumplimiento,
    distribucionRangos,
    breakdownEquipo,
    miembrosDetalle: enModoAnon
      ? null
      : rangos.map((r) => ({
          userId: r.userId,
          nombre: `${r.user.nombre} ${r.user.apellido}`,
          avatarUrl: r.user.avatarUrl,
          puesto: r.user.puesto?.nombre ?? null,
          puntosTotales: r.puntosTotales,
          rango: r.rango,
          cumplimientoKpis: r.cumplimientoKpis,
        })),
  };
}

export async function obtenerAdopcionEquipo(params: {
  areaId: string;
  mes: number;
  anio: number;
}) {
  const miembros = await prisma.user.findMany({
    where: { areaId: params.areaId, activo: true },
    select: { id: true },
  });
  const total = miembros.length || 1;
  const ids = miembros.map((m) => m.id);

  const inicio = new Date(params.anio, params.mes - 1, 1);
  const fin = new Date(params.anio, params.mes, 0, 23, 59, 59);

  const conReporteKpi = await prisma.user.count({
    where: {
      id: { in: ids },
      kpiRegistros: { some: { createdAt: { gte: inicio, lte: fin } } },
    },
  });
  const conReconocimiento = await prisma.user.count({
    where: {
      id: { in: ids },
      reconocimientosDados: {
        some: { createdAt: { gte: inicio, lte: fin } },
      },
    },
  });
  const conCompromiso = await prisma.user.count({
    where: {
      id: { in: ids },
      compromisos: { some: { createdAt: { gte: inicio, lte: fin } } },
    },
  });
  const conMisionCompletada = await prisma.user.count({
    where: {
      id: { in: ids },
      misiones: {
        some: { estado: "COMPLETADA", createdAt: { gte: inicio, lte: fin } },
      },
    },
  });

  return {
    miembros: total,
    conReporteKpi,
    conReconocimiento,
    conCompromiso,
    conMisionCompletada,
    pctReporteKpi: Math.round((conReporteKpi / total) * 100),
    pctReconocimiento: Math.round((conReconocimiento / total) * 100),
    pctCompromiso: Math.round((conCompromiso / total) * 100),
    pctMisionCompletada: Math.round((conMisionCompletada / total) * 100),
  };
}
