"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { procesarEvento } from "@/lib/gamificacion/motor";
import { getSemanaISO } from "@/lib/gamificacion/periodo";
import { puedeResponderEncuesta } from "./queries";

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const PUNTOS_ENCUESTA = 20;

const encuestaSchema = z.object({
  justiciaKpis: z.number().int().min(1).max(5),
  motivacionSistema: z.number().int().min(1).max(5),
  claridadProgreso: z.number().int().min(1).max(5),
  comentario: z.string().max(500).optional(),
  kpiMasJusto: z.string().max(100).optional(),
  kpiMenosJusto: z.string().max(100).optional(),
});

export async function responderEncuesta(input: {
  justiciaKpis: number;
  motivacionSistema: number;
  claridadProgreso: number;
  comentario?: string;
  kpiMasJusto?: string;
  kpiMenosJusto?: string;
}): Promise<Result<{ puntosGanados: number }>> {
  const user = await requireAuth();

  const parsed = encuestaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const check = await puedeResponderEncuesta(user.id);
  if (!check.puede) {
    return {
      success: false,
      error: check.yaRespondida
        ? "Ya respondiste esta semana"
        : (check.razon ?? "No disponible"),
    };
  }

  const { semana, anio } = getSemanaISO(new Date());

  const encuesta = await prisma.encuestaSemanal.create({
    data: {
      userId: user.id,
      semanaDelAnio: semana,
      anio,
      justiciaKpis: parsed.data.justiciaKpis,
      motivacionSistema: parsed.data.motivacionSistema,
      claridadProgreso: parsed.data.claridadProgreso,
      comentario: parsed.data.comentario?.trim() || null,
      kpiMasJusto: parsed.data.kpiMasJusto?.trim() || null,
      kpiMenosJusto: parsed.data.kpiMenosJusto?.trim() || null,
      puntosOtorgados: PUNTOS_ENCUESTA,
    },
  });

  await procesarEvento({
    userId: user.id,
    tipo: "MISION_COMPLETADA",
    fuente: "MISIONES",
    puntosBrutos: PUNTOS_ENCUESTA,
    referenciaId: encuesta.id,
    descripcion: "Encuesta semanal de percepcion",
    metadatos: { encuesta: true },
  });

  // Completar mision de encuesta si existe (sin duplicar puntos)
  const misionEncuesta = await prisma.mision.findFirst({
    where: {
      userId: user.id,
      semanaDelAnio: semana,
      anio,
      estado: "ACTIVA",
      tipo: "PERSONALIZADA",
      titulo: { contains: "feedback", mode: "insensitive" },
    },
  });
  if (misionEncuesta) {
    await prisma.mision.update({
      where: { id: misionEncuesta.id },
      data: { estado: "COMPLETADA", completadaEn: new Date() },
    });
  }

  revalidatePath("/mi-progreso");
  return { success: true, data: { puntosGanados: PUNTOS_ENCUESTA } };
}
