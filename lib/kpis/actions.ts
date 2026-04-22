"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { procesarEvento } from "@/lib/gamificacion/motor";
import { getSemanaISO, getAnio } from "@/lib/gamificacion/periodo";
import {
  calcularCumplimientoKpis,
  consolidarRegistros,
  calcularCumplimientoIndividual,
  MAX_PUNTOS_KPIS_MES,
} from "./calculo";

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function reportarKpiSemanal(input: {
  asignacionId: string;
  valor: number;
  comentario?: string;
  semanaDelAnio?: number;
  anio?: number;
}): Promise<Result> {
  const user = await requireAuth();

  const asignacion = await prisma.kpiAsignacion.findUnique({
    where: { id: input.asignacionId },
    select: { userId: true, periodoMes: true, periodoAnio: true },
  });
  if (!asignacion) return { success: false, error: "Asignacion no existe" };

  const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
  if (asignacion.userId !== user.id && !esAdmin) {
    return { success: false, error: "No autorizado" };
  }

  const ahora = new Date();
  const semana = input.semanaDelAnio ?? getSemanaISO(ahora).semana;
  const anio = input.anio ?? getAnio(ahora);

  await prisma.kpiRegistroSemanal.upsert({
    where: {
      asignacionId_semanaDelAnio_anio: {
        asignacionId: input.asignacionId,
        semanaDelAnio: semana,
        anio,
      },
    },
    create: {
      asignacionId: input.asignacionId,
      semanaDelAnio: semana,
      anio,
      valor: input.valor,
      comentario: input.comentario ?? null,
      reportadoPorId: user.id,
    },
    update: {
      valor: input.valor,
      comentario: input.comentario ?? null,
      reportadoPorId: user.id,
    },
  });

  revalidatePath("/mi-progreso");
  revalidatePath("/mi-progreso/kpis");
  return { success: true };
}

export async function asignarKpisAEmpleado(input: {
  userId: string;
  mes: number;
  anio: number;
  asignaciones: Array<{
    definicionId: string;
    valorObjetivo: number;
    valorBaseline?: number;
    notasInternas?: string;
  }>;
}): Promise<Result> {
  await requireRole(["ADMIN", "RRHH"]);

  await prisma.$transaction(
    input.asignaciones.map((a) =>
      prisma.kpiAsignacion.upsert({
        where: {
          userId_definicionId_periodoMes_periodoAnio: {
            userId: input.userId,
            definicionId: a.definicionId,
            periodoMes: input.mes,
            periodoAnio: input.anio,
          },
        },
        create: {
          userId: input.userId,
          definicionId: a.definicionId,
          periodoMes: input.mes,
          periodoAnio: input.anio,
          valorObjetivo: a.valorObjetivo,
          valorBaseline: a.valorBaseline ?? null,
          notasInternas: a.notasInternas ?? null,
        },
        update: {
          valorObjetivo: a.valorObjetivo,
          valorBaseline: a.valorBaseline ?? null,
          notasInternas: a.notasInternas ?? null,
        },
      })
    )
  );

  revalidatePath("/admin/kpis");
  return { success: true };
}

export async function cerrarMesKpis(input: {
  userId: string;
  mes: number;
  anio: number;
}): Promise<Result<{ puntosTotalOtorgados: number }>> {
  await requireRole(["ADMIN", "RRHH"]);

  const cumplimiento = await calcularCumplimientoKpis({
    userId: input.userId,
    mes: input.mes,
    anio: input.anio,
  });

  let totalOtorgado = 0;

  for (const c of cumplimiento.cumplimientos) {
    const asig = await prisma.kpiAsignacion.findUnique({
      where: { id: c.asignacionId },
      include: { definicion: true, registros: true },
    });
    if (!asig) continue;

    const valorConsolidado = consolidarRegistros(
      asig.registros,
      asig.definicion.tipoMeta!
    );
    const cumplIndividual = calcularCumplimientoIndividual(
      valorConsolidado,
      asig.valorObjetivo,
      asig.definicion.tipoMeta!
    );

    const superoMeta = cumplIndividual > 100 && asig.definicion.permiteSupera;
    const bonusPct = superoMeta ? asig.definicion.bonusPorcentaje : 0;

    const puntosBase = Math.floor(
      (Math.min(100, cumplIndividual) / 100) *
        MAX_PUNTOS_KPIS_MES *
        ((asig.definicion.peso ?? 0) / 100)
    );
    const bonus = Math.floor(puntosBase * (bonusPct / 100));
    const puntosTotal = puntosBase + bonus;

    await prisma.kpiResultadoMensual.upsert({
      where: { asignacionId: asig.id },
      create: {
        asignacionId: asig.id,
        valorConsolidado,
        porcentajeCumplimiento: cumplIndividual,
        superoMeta,
        puntosOtorgados: puntosTotal,
        incluyeBonus: bonus > 0,
      },
      update: {
        valorConsolidado,
        porcentajeCumplimiento: cumplIndividual,
        superoMeta,
        puntosOtorgados: puntosTotal,
        incluyeBonus: bonus > 0,
      },
    });

    if (puntosTotal > 0) {
      await procesarEvento({
        userId: input.userId,
        tipo: "KPI_MES_CUMPLIDO",
        fuente: "KPIS",
        puntosBrutos: puntosTotal,
        referenciaId: asig.id,
        descripcion: `KPI "${asig.definicion.nombre}" cierre ${input.mes}/${input.anio}`,
        fecha: new Date(input.anio, input.mes - 1, 28),
      });
      totalOtorgado += puntosTotal;
    }
  }

  await prisma.notificacion.create({
    data: {
      userId: input.userId,
      tipo: "LOGRO",
      titulo: `Cierre de KPIs ${input.mes}/${input.anio}`,
      mensaje: `Cumplimiento: ${cumplimiento.porcentaje.toFixed(0)}%. Puntos otorgados: ${totalOtorgado}.`,
      url: "/mi-progreso",
    },
  });

  revalidatePath("/mi-progreso");
  revalidatePath("/admin/kpis");

  return { success: true, data: { puntosTotalOtorgados: totalOtorgado } };
}

export async function crearDefinicionKpi(input: {
  puestoId: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  unidad: string;
  peso: number;
  tipoMeta: "ABSOLUTA" | "RELATIVA_BASELINE" | "BINARIA";
  valorObjetivoDefault?: number;
  bonusPorcentaje?: number;
}): Promise<Result> {
  await requireRole(["ADMIN", "RRHH"]);
  await prisma.puestoKpiDefinicion.create({
    data: {
      puestoId: input.puestoId,
      codigo: input.codigo,
      nombre: input.nombre,
      descripcion: input.descripcion,
      unidad: input.unidad,
      peso: input.peso,
      tipoMeta: input.tipoMeta,
      valorObjetivoDefault: input.valorObjetivoDefault ?? null,
      bonusPorcentaje: input.bonusPorcentaje ?? 15,
    },
  });
  revalidatePath("/admin/kpis");
  return { success: true };
}

export async function actualizarDefinicionKpi(
  id: string,
  data: Partial<{
    nombre: string;
    descripcion: string;
    unidad: string;
    peso: number;
    valorObjetivoDefault: number | null;
    bonusPorcentaje: number;
    activa: boolean;
  }>
): Promise<Result> {
  await requireRole(["ADMIN", "RRHH"]);
  await prisma.puestoKpiDefinicion.update({ where: { id }, data });
  revalidatePath("/admin/kpis");
  return { success: true };
}

export async function eliminarDefinicionKpi(id: string): Promise<Result> {
  await requireRole(["ADMIN"]);
  try {
    await prisma.puestoKpiDefinicion.delete({ where: { id } });
  } catch {
    return {
      success: false,
      error:
        "No se puede eliminar: la definicion tiene asignaciones activas. Desactivala en su lugar.",
    };
  }
  revalidatePath("/admin/kpis");
  return { success: true };
}
