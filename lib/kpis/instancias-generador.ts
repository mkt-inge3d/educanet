import { prisma } from "@/lib/prisma";

/**
 * Devuelve el numero ISO 8601 de semana del año.
 * Misma logica usada en seed-piloto-marketing.ts.
 */
export function isoWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff =
    (target.getTime() - firstThursday.getTime()) / (1000 * 60 * 60 * 24);
  return 1 + Math.round((diff - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

type PeriodoMes = { mes: number; anio: number };

/**
 * Para cada usuario activo con un puesto que tenga definiciones de hitos
 * (frecuencia != null && activa), asegura un KpiAsignacionMes para el periodo dado.
 * Idempotente.
 */
export async function asegurarAsignacionesMes(periodo: PeriodoMes) {
  const definiciones = await prisma.puestoKpiDefinicion.findMany({
    where: { activa: true, frecuencia: { not: null } },
    select: { id: true, puestoId: true },
  });
  const porPuesto = new Map<string, string[]>();
  for (const d of definiciones) {
    const lista = porPuesto.get(d.puestoId) ?? [];
    lista.push(d.id);
    porPuesto.set(d.puestoId, lista);
  }

  const puestoIds = Array.from(porPuesto.keys());
  const usuarios = await prisma.user.findMany({
    where: { activo: true, puestoId: { in: puestoIds } },
    select: { id: true, puestoId: true },
  });

  let creadas = 0;
  for (const u of usuarios) {
    if (!u.puestoId) continue;
    const defs = porPuesto.get(u.puestoId) ?? [];
    for (const definicionId of defs) {
      const exist = await prisma.kpiAsignacionMes.findUnique({
        where: {
          definicionId_userId_periodoMes_periodoAnio: {
            definicionId,
            userId: u.id,
            periodoMes: periodo.mes,
            periodoAnio: periodo.anio,
          },
        },
        select: { id: true },
      });
      if (!exist) {
        await prisma.kpiAsignacionMes.create({
          data: {
            definicionId,
            userId: u.id,
            periodoMes: periodo.mes,
            periodoAnio: periodo.anio,
          },
        });
        creadas++;
      }
    }
  }
  return { asignacionesCreadas: creadas };
}

/**
 * Genera las instancias semanales para todas las asignaciones activas
 * (no marcadas noAplica) cuyo KPI sea de frecuencia SEMANAL.
 * Idempotente: una sola instancia por (asignacion, semana).
 */
export async function generarInstanciasSemana(input: {
  semana: number;
  anio: number;
  mes: number;
}) {
  const asignaciones = await prisma.kpiAsignacionMes.findMany({
    where: {
      periodoMes: input.mes,
      periodoAnio: input.anio,
      noAplica: false,
      definicion: { frecuencia: "SEMANAL", activa: true },
    },
    select: { id: true },
  });

  let creadas = 0;
  for (const a of asignaciones) {
    const exist = await prisma.kpiInstancia.findUnique({
      where: {
        asignacionMesId_semanaDelAnio_numeroOcurrencia: {
          asignacionMesId: a.id,
          semanaDelAnio: input.semana,
          numeroOcurrencia: 1,
        },
      },
      select: { id: true },
    });
    if (!exist) {
      await prisma.kpiInstancia.create({
        data: {
          asignacionMesId: a.id,
          semanaDelAnio: input.semana,
          numeroOcurrencia: 1,
          estado: "PENDIENTE",
        },
      });
      creadas++;
    }
  }
  return { instanciasCreadas: creadas };
}

/**
 * Genera las instancias mensuales (semanaDelAnio = null).
 * Para KPIs condicionales con cantidadMaxMes, genera N ocurrencias segun
 * la cantidadMes configurada (o cantidadMaxMes si no hay override).
 * Para mensuales normales, una sola instancia.
 */
export async function generarInstanciasMes(periodo: PeriodoMes) {
  const asignaciones = await prisma.kpiAsignacionMes.findMany({
    where: {
      periodoMes: periodo.mes,
      periodoAnio: periodo.anio,
      noAplica: false,
      definicion: { frecuencia: "MENSUAL", activa: true },
    },
    include: { definicion: true },
  });

  let creadas = 0;
  for (const a of asignaciones) {
    const cantidad = a.definicion.cantidadMaxMes
      ? a.cantidadMes ?? a.definicion.cantidadMaxMes
      : 1;

    for (let n = 1; n <= cantidad; n++) {
      const exist = await prisma.kpiInstancia.findUnique({
        where: {
          asignacionMesId_semanaDelAnio_numeroOcurrencia: {
            asignacionMesId: a.id,
            semanaDelAnio: 0, // Prisma no acepta null en parte de unique
            numeroOcurrencia: n,
          },
        },
        select: { id: true },
      }).catch(() => null);
      // Workaround: como semanaDelAnio es nullable y no participa bien en
      // unique con null, usamos un findFirst en su lugar.
      const yaExiste = exist
        ? true
        : !!(await prisma.kpiInstancia.findFirst({
            where: {
              asignacionMesId: a.id,
              semanaDelAnio: null,
              numeroOcurrencia: n,
            },
            select: { id: true },
          }));
      if (!yaExiste) {
        await prisma.kpiInstancia.create({
          data: {
            asignacionMesId: a.id,
            semanaDelAnio: null,
            numeroOcurrencia: n,
            estado: "PENDIENTE",
          },
        });
        creadas++;
      }
    }
  }
  return { instanciasCreadas: creadas };
}
