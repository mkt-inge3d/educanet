import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function obtenerMetricasPeriodoActual(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("desempeno", `desempeno-${userId}`);
  const now = new Date();
  return prisma.metricaDesempeno.findMany({
    where: {
      userId,
      fechaFin: { gte: now },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function obtenerHistoricoMetricas(
  userId: string,
  limite = 12
) {
  "use cache";
  cacheLife("minutes");
  cacheTag("desempeno", `desempeno-${userId}`);
  return prisma.metricaDesempeno.findMany({
    where: { userId },
    orderBy: { fechaFin: "desc" },
    take: limite,
  });
}

export type ResumenDesempeno = {
  totalMetricasPeriodo: number;
  metricasCumplidas: number;
  porcentajeCumplimiento: number;
  tendencia: "subiendo" | "bajando" | "estable";
  totalObjetivosCumplidos: number;
};

export async function obtenerResumenDesempeno(
  userId: string
): Promise<ResumenDesempeno> {
  "use cache";
  cacheLife("minutes");
  cacheTag("desempeno", `desempeno-${userId}`);
  const [actuales, historico, totalCumplidos] = await Promise.all([
    obtenerMetricasPeriodoActual(userId),
    obtenerHistoricoMetricas(userId),
    prisma.metricaDesempeno.count({
      where: { userId, objetivoAlcanzado: true },
    }),
  ]);

  const metricasCumplidas = actuales.filter(
    (m) => m.valor >= m.objetivo
  ).length;
  const porcentajeCumplimiento =
    actuales.length > 0
      ? Math.round((metricasCumplidas / actuales.length) * 100)
      : 0;

  // Calc tendency from last 3 periods
  let tendencia: "subiendo" | "bajando" | "estable" = "estable";
  if (historico.length >= 2) {
    const recientes = historico.slice(0, Math.min(3, historico.length));
    const promedioReciente =
      recientes.reduce((acc, m) => acc + m.valor / m.objetivo, 0) /
      recientes.length;
    const anteriores = historico.slice(
      Math.min(3, historico.length),
      Math.min(6, historico.length)
    );
    if (anteriores.length > 0) {
      const promedioAnterior =
        anteriores.reduce((acc, m) => acc + m.valor / m.objetivo, 0) /
        anteriores.length;
      if (promedioReciente > promedioAnterior * 1.05) tendencia = "subiendo";
      else if (promedioReciente < promedioAnterior * 0.95) tendencia = "bajando";
    }
  }

  return {
    totalMetricasPeriodo: actuales.length,
    metricasCumplidas,
    porcentajeCumplimiento,
    tendencia,
    totalObjetivosCumplidos: totalCumplidos,
  };
}
