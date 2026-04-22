import { prisma } from "@/lib/prisma";
import type { TipoMetaKpi, KpiRegistroSemanal } from "@prisma/client";
import { semanaDelMes } from "../gamificacion/periodo";

export const MAX_PUNTOS_KPIS_MES = 1000;

export type CumplimientoKpi = {
  definicionId: string;
  asignacionId: string;
  codigo: string;
  nombre: string;
  unidad: string;
  peso: number;
  tipoMeta: TipoMetaKpi;
  valorActual: number;
  valorObjetivo: number;
  cumplimiento: number; // 0-130
  puntosProyectados: number;
  tieneRegistros: boolean;
};

export type ResultadoCumplimiento = {
  porcentaje: number; // 0-130
  cumplimientos: CumplimientoKpi[];
  hayDatosSuficientes: boolean;
  puntosProyectados: number; // max 1000
  totalPeso: number;
};

export function consolidarRegistros(
  registros: KpiRegistroSemanal[],
  tipo: TipoMetaKpi
): number {
  if (registros.length === 0) return 0;
  switch (tipo) {
    case "ABSOLUTA":
    case "RELATIVA_BASELINE":
      return (
        registros.reduce((s, r) => s + r.valor, 0) / registros.length
      );
    case "BINARIA":
      return (
        registros.filter((r) => r.valor >= 1).length / registros.length
      );
  }
}

export function calcularCumplimientoIndividual(
  actual: number,
  objetivo: number,
  tipo: TipoMetaKpi
): number {
  if (tipo === "BINARIA") {
    return actual >= 1 ? 100 : Math.min(100, actual * 100);
  }
  if (objetivo === 0) return actual >= 0 ? 100 : 0;
  return Math.min(130, (actual / objetivo) * 100);
}

export async function calcularCumplimientoKpis(params: {
  userId: string;
  mes: number;
  anio: number;
}): Promise<ResultadoCumplimiento> {
  const asignaciones = await prisma.kpiAsignacion.findMany({
    where: {
      userId: params.userId,
      periodoMes: params.mes,
      periodoAnio: params.anio,
    },
    include: { definicion: true, registros: true },
  });

  if (asignaciones.length === 0) {
    return {
      porcentaje: 0,
      cumplimientos: [],
      hayDatosSuficientes: false,
      puntosProyectados: 0,
      totalPeso: 0,
    };
  }

  const cumplimientos: CumplimientoKpi[] = asignaciones.map((asig) => {
    const valorActual = consolidarRegistros(
      asig.registros,
      asig.definicion.tipoMeta!
    );
    const cumplimiento = calcularCumplimientoIndividual(
      valorActual,
      asig.valorObjetivo,
      asig.definicion.tipoMeta!
    );
    const puntosProyectados = Math.min(
      MAX_PUNTOS_KPIS_MES * ((asig.definicion.peso ?? 0) / 100),
      (cumplimiento / 100) *
        MAX_PUNTOS_KPIS_MES *
        ((asig.definicion.peso ?? 0) / 100)
    );
    return {
      definicionId: asig.definicionId,
      asignacionId: asig.id,
      codigo: asig.definicion.codigo,
      nombre: asig.definicion.nombre,
      unidad: asig.definicion.unidad ?? "",
      peso: asig.definicion.peso ?? 0,
      tipoMeta: asig.definicion.tipoMeta!,
      valorActual,
      valorObjetivo: asig.valorObjetivo,
      cumplimiento,
      puntosProyectados: Math.floor(puntosProyectados),
      tieneRegistros: asig.registros.length > 0,
    };
  });

  const totalPeso = cumplimientos.reduce((s, c) => s + c.peso, 0);
  const ponderado =
    totalPeso > 0
      ? cumplimientos.reduce((s, c) => s + c.cumplimiento * c.peso, 0) /
        totalPeso
      : 0;

  const conRegistros = cumplimientos.filter((c) => c.tieneRegistros).length;
  const esMesActual = (() => {
    const ahora = new Date();
    return (
      ahora.getMonth() + 1 === params.mes && ahora.getFullYear() === params.anio
    );
  })();
  const semanaActual = esMesActual ? semanaDelMes() : 5;
  // Hay datos suficientes si estamos en semana 3+ del mes y al menos
  // la mitad de los KPIs tiene registros, o si ya es mes pasado.
  const hayDatosSuficientes =
    semanaActual >= 3 && conRegistros / cumplimientos.length >= 0.5;

  const puntosProyectados = Math.min(
    MAX_PUNTOS_KPIS_MES,
    Math.floor((ponderado / 100) * MAX_PUNTOS_KPIS_MES)
  );

  return {
    porcentaje: ponderado,
    cumplimientos,
    hayDatosSuficientes,
    puntosProyectados,
    totalPeso,
  };
}
