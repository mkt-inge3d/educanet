import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { getSemanaISO } from "@/lib/gamificacion/periodo";

export async function obtenerEncuestaSemanaActual(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`encuesta-${userId}`);
  const { semana, anio } = getSemanaISO(new Date());
  return prisma.encuestaSemanal.findUnique({
    where: {
      userId_semanaDelAnio_anio: {
        userId,
        semanaDelAnio: semana,
        anio,
      },
    },
  });
}

export async function puedeResponderEncuesta(userId: string): Promise<{
  puede: boolean;
  razon?: string;
  yaRespondida?: boolean;
}> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`encuesta-${userId}`);
  const ahora = new Date();
  const dia = ahora.getDay(); // 0=domingo, 5=viernes, 6=sabado
  const disponible = dia === 0 || dia === 5 || dia === 6;
  if (!disponible) {
    return {
      puede: false,
      razon: "Disponible solo viernes, sabado y domingo",
    };
  }
  const existente = await obtenerEncuestaSemanaActual(userId);
  if (existente) return { puede: false, yaRespondida: true };
  return { puede: true };
}

export type AgregadosEncuesta = {
  totalRespuestas: number;
  miembrosActivos: number;
  tasaRespuesta: number;
  promedios: {
    justiciaKpis: number;
    motivacionSistema: number;
    claridadProgreso: number;
  };
  porSemana: Array<{
    semana: number;
    total: number;
    justiciaKpis: number;
    motivacionSistema: number;
    claridadProgreso: number;
  }>;
  comentarios: Array<{ texto: string; semana: number }>;
  kpisMasJustos: Array<{ nombre: string; cuenta: number }>;
  kpisMenosJustos: Array<{ nombre: string; cuenta: number }>;
};

function promedio(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function contar(valores: (string | null)[]): Array<{ nombre: string; cuenta: number }> {
  const conteo = new Map<string, number>();
  for (const v of valores) {
    if (!v) continue;
    const k = v.trim();
    if (!k) continue;
    conteo.set(k, (conteo.get(k) ?? 0) + 1);
  }
  return Array.from(conteo.entries())
    .map(([nombre, cuenta]) => ({ nombre, cuenta }))
    .sort((a, b) => b.cuenta - a.cuenta)
    .slice(0, 8);
}

/**
 * IMPORTANTE: este agregado NUNCA debe exponer el userId del autor
 * de un comentario. La query solo trae el texto y la semana.
 */
export async function obtenerAgregadosEncuestas(params: {
  areaId: string;
  mes: number;
  anio: number;
}): Promise<AgregadosEncuesta> {
  "use cache";
  cacheLife("minutes");
  cacheTag("encuestas", `encuestas-area-${params.areaId}`);
  const inicio = new Date(params.anio, params.mes - 1, 1);
  const fin = new Date(params.anio, params.mes, 0, 23, 59, 59);

  const encuestas = await prisma.encuestaSemanal.findMany({
    where: {
      createdAt: { gte: inicio, lte: fin },
      user: { areaId: params.areaId },
    },
    select: {
      semanaDelAnio: true,
      justiciaKpis: true,
      motivacionSistema: true,
      claridadProgreso: true,
      comentario: true,
      kpiMasJusto: true,
      kpiMenosJusto: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const miembros = await prisma.user.count({
    where: { areaId: params.areaId, activo: true },
  });

  const porSemanaMap = new Map<
    number,
    { j: number[]; m: number[]; c: number[] }
  >();
  for (const e of encuestas) {
    const bucket =
      porSemanaMap.get(e.semanaDelAnio) ?? { j: [], m: [], c: [] };
    bucket.j.push(e.justiciaKpis);
    bucket.m.push(e.motivacionSistema);
    bucket.c.push(e.claridadProgreso);
    porSemanaMap.set(e.semanaDelAnio, bucket);
  }

  const porSemana = Array.from(porSemanaMap.entries())
    .map(([semana, b]) => ({
      semana,
      total: b.j.length,
      justiciaKpis: promedio(b.j),
      motivacionSistema: promedio(b.m),
      claridadProgreso: promedio(b.c),
    }))
    .sort((a, b) => a.semana - b.semana);

  return {
    totalRespuestas: encuestas.length,
    miembrosActivos: miembros,
    tasaRespuesta: miembros > 0 ? (encuestas.length / miembros) * 100 : 0,
    promedios: {
      justiciaKpis: promedio(encuestas.map((e) => e.justiciaKpis)),
      motivacionSistema: promedio(encuestas.map((e) => e.motivacionSistema)),
      claridadProgreso: promedio(encuestas.map((e) => e.claridadProgreso)),
    },
    porSemana,
    comentarios: encuestas
      .filter((e) => e.comentario && e.comentario.trim())
      .slice(0, 15)
      .map((e) => ({ texto: e.comentario!, semana: e.semanaDelAnio })),
    kpisMasJustos: contar(encuestas.map((e) => e.kpiMasJusto)),
    kpisMenosJustos: contar(encuestas.map((e) => e.kpiMenosJusto)),
  };
}
