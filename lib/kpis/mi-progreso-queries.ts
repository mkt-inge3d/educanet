import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import type { FuenteXP, TipoRango } from "@prisma/client";
import { calcularCumplimientoKpis } from "./calculo";
import {
  proyeccionRango,
  rangoSegunPuntos,
  sumarPuntosPorFuenteMes,
} from "@/lib/gamificacion/rangos";
import { TOPES_MENSUALES } from "@/lib/gamificacion/multiplicadores";
import { diasRestantesDelMes } from "@/lib/gamificacion/periodo";

export type FuenteResumen = {
  fuente: FuenteXP;
  puntos: number;
  tope: number;
  porcentaje: number;
};

export type ProgresoMes = {
  mes: number;
  anio: number;
  puntosTotales: number;
  rangoActual: TipoRango;
  siguienteRango: TipoRango | null;
  puntosParaSiguiente: number;
  porcentajeAlSiguiente: number;
  cumplimientoKpis: number;
  hayDatosSuficientesKpis: boolean;
  multiplicadorAplicado: boolean;
  diasRestantes: number;
  fuentes: FuenteResumen[];
  cumplimientos: Awaited<
    ReturnType<typeof calcularCumplimientoKpis>
  >["cumplimientos"];
};

const FUENTES_VISIBLES: FuenteXP[] = [
  "KPIS",
  "APRENDIZAJE",
  "TAREAS_OPERATIVAS",
  "COMPROMISOS",
  "RECONOCIMIENTOS",
  "MISIONES",
  "EQUIPO",
];

export async function obtenerProgresoMes(
  userId: string,
  mes: number,
  anio: number
): Promise<ProgresoMes> {
  "use cache";
  cacheLife("minutes");
  cacheTag("mi-progreso", `mi-progreso-${userId}`);
  const [puntosPorFuente, cumplimientoKpis] = await Promise.all([
    sumarPuntosPorFuenteMes(userId, mes, anio),
    calcularCumplimientoKpis({ userId, mes, anio }),
  ]);

  const puntosTotales = Object.values(puntosPorFuente).reduce(
    (a, b) => a + b,
    0
  );
  const rango = rangoSegunPuntos(puntosTotales);
  const proyeccion = proyeccionRango(puntosTotales);

  const fuentes: FuenteResumen[] = FUENTES_VISIBLES.map((f) => {
    const tope = TOPES_MENSUALES[f];
    const puntos = puntosPorFuente[f];
    const topeVisual = Number.isFinite(tope) ? tope : 1000;
    const porcentaje = Math.min(100, (puntos / topeVisual) * 100);
    return { fuente: f, puntos, tope: topeVisual, porcentaje };
  });

  const multiplicadorAplicado =
    cumplimientoKpis.hayDatosSuficientes && cumplimientoKpis.porcentaje < 70;

  return {
    mes,
    anio,
    puntosTotales,
    rangoActual: rango,
    siguienteRango: proyeccion.siguiente,
    puntosParaSiguiente: proyeccion.puntosParaSiguiente,
    porcentajeAlSiguiente: proyeccion.porcentajeAlSiguiente,
    cumplimientoKpis: cumplimientoKpis.porcentaje,
    hayDatosSuficientesKpis: cumplimientoKpis.hayDatosSuficientes,
    multiplicadorAplicado,
    diasRestantes: diasRestantesDelMes(),
    fuentes,
    cumplimientos: cumplimientoKpis.cumplimientos,
  };
}

export async function obtenerKpisConAsignaciones(
  userId: string,
  mes: number,
  anio: number
) {
  "use cache";
  cacheLife("minutes");
  cacheTag("kpis", `kpis-${userId}`);
  return prisma.kpiAsignacion.findMany({
    where: { userId, periodoMes: mes, periodoAnio: anio },
    include: {
      definicion: true,
      registros: { orderBy: [{ anio: "asc" }, { semanaDelAnio: "asc" }] },
    },
    orderBy: { definicion: { orden: "asc" } },
  });
}
