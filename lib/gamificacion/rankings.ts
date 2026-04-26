import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export type RankingEntry = {
  position: number;
  userId: string;
  nombre: string;
  apellido: string;
  avatarUrl: string | null;
  puesto: string | null;
  valor: number;
  esUsuarioActual: boolean;
};

export async function obtenerRankingArea(params: {
  areaId: string;
  userIdActual: string;
  metrica: "puntos_total" | "racha";
}): Promise<{
  lideres: RankingEntry[];
  posicionUsuario: number | null;
  cercanosAlUsuario: RankingEntry[];
  totalParticipantes: number;
}> {
  "use cache";
  cacheLife("minutes");
  cacheTag("ranking", `ranking-area-${params.areaId}`);
  const orderField =
    params.metrica === "puntos_total" ? "puntosTotales" : "rachaActual";

  const usuarios = await prisma.user.findMany({
    where: { areaId: params.areaId, activo: true, mostrarEnRanking: true },
    orderBy: { [orderField]: "desc" },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      avatarUrl: true,
      puntosTotales: true,
      rachaActual: true,
      puesto: { select: { nombre: true } },
    },
  });

  const entries: RankingEntry[] = usuarios.map((u, i) => ({
    position: i + 1,
    userId: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    avatarUrl: u.avatarUrl,
    puesto: u.puesto?.nombre ?? null,
    valor: params.metrica === "puntos_total" ? u.puntosTotales : u.rachaActual,
    esUsuarioActual: u.id === params.userIdActual,
  }));

  const lideres = entries.slice(0, 3);
  const userIdx = entries.findIndex((e) => e.esUsuarioActual);
  const posicionUsuario = userIdx >= 0 ? userIdx + 1 : null;

  let cercanosAlUsuario: RankingEntry[] = [];
  if (userIdx >= 0) {
    const start = Math.max(0, userIdx - 2);
    const end = Math.min(entries.length, userIdx + 3);
    cercanosAlUsuario = entries.slice(start, end);
  }

  return {
    lideres,
    posicionUsuario,
    cercanosAlUsuario,
    totalParticipantes: entries.length,
  };
}
