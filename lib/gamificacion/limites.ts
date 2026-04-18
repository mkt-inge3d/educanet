import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import type { RazonPuntos } from "@prisma/client";

export const LIMITES_DIARIOS = {
  PUNTOS_POR_LIKES_RECIBIDOS: 20,
} as const;

export async function puntosGanadosHoyPorRazon(
  userId: string,
  razon: RazonPuntos
): Promise<number> {
  const inicio = startOfDay(new Date());
  const fin = endOfDay(new Date());

  const result = await prisma.transaccionPuntos.aggregate({
    where: {
      userId,
      razon,
      fecha: { gte: inicio, lte: fin },
    },
    _sum: { cantidad: true },
  });

  return result._sum.cantidad ?? 0;
}

export async function puedeRecibirPuntosPorLike(
  userId: string
): Promise<{ puede: boolean; restante: number; alcanzado: number }> {
  const alcanzado = await puntosGanadosHoyPorRazon(userId, "LIKE_RECIBIDO");
  const tope = LIMITES_DIARIOS.PUNTOS_POR_LIKES_RECIBIDOS;
  return {
    puede: alcanzado < tope,
    restante: Math.max(0, tope - alcanzado),
    alcanzado,
  };
}
