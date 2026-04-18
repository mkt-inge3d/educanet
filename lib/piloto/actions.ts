"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { evaluarYOtorgarBonusEquipo } from "./bonus-equipo";

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function actualizarConfiguracionPiloto(input: {
  areaId: string;
  activo?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  mostrarBannerPiloto?: boolean;
  fechaFinBanner?: string | null;
  anonimizarParaJefe?: boolean;
  fechaFinAnonimizacion?: string | null;
  metaCumplimientoKpis?: number;
  bonusEquipoPuntos?: number;
  notas?: string | null;
}): Promise<Result> {
  await requireRole(["ADMIN", "RRHH"]);

  const data: Record<string, unknown> = {};
  if (input.activo !== undefined) data.activo = input.activo;
  if (input.fechaInicio) data.fechaInicio = new Date(input.fechaInicio);
  if (input.fechaFin) data.fechaFin = new Date(input.fechaFin);
  if (input.mostrarBannerPiloto !== undefined)
    data.mostrarBannerPiloto = input.mostrarBannerPiloto;
  if (input.fechaFinBanner !== undefined)
    data.fechaFinBanner = input.fechaFinBanner
      ? new Date(input.fechaFinBanner)
      : null;
  if (input.anonimizarParaJefe !== undefined)
    data.anonimizarParaJefe = input.anonimizarParaJefe;
  if (input.fechaFinAnonimizacion !== undefined)
    data.fechaFinAnonimizacion = input.fechaFinAnonimizacion
      ? new Date(input.fechaFinAnonimizacion)
      : null;
  if (input.metaCumplimientoKpis !== undefined)
    data.metaCumplimientoKpis = input.metaCumplimientoKpis;
  if (input.bonusEquipoPuntos !== undefined)
    data.bonusEquipoPuntos = input.bonusEquipoPuntos;
  if (input.notas !== undefined) data.notas = input.notas;

  await prisma.configuracionPiloto.update({
    where: { areaId: input.areaId },
    data,
  });

  revalidatePath("/admin/piloto");
  revalidatePath("/mi-progreso");
  revalidatePath("/mi-equipo");
  return { success: true };
}

export async function evaluarBonusManual(input: {
  areaId: string;
  mes: number;
  anio: number;
}): Promise<Result<Awaited<ReturnType<typeof evaluarYOtorgarBonusEquipo>>>> {
  await requireRole(["ADMIN", "RRHH"]);
  const resultado = await evaluarYOtorgarBonusEquipo(input);
  revalidatePath("/admin/piloto");
  return { success: true, data: resultado };
}
