import { prisma } from "@/lib/prisma";
import type { ConfiguracionPiloto } from "@prisma/client";

export type PilotoContexto = {
  enPiloto: boolean;
  config: ConfiguracionPiloto | null;
  mostrarBanner: boolean;
  enModoAnonimizado: boolean;
  diasRestantes: number;
};

const VACIO: PilotoContexto = {
  enPiloto: false,
  config: null,
  mostrarBanner: false,
  enModoAnonimizado: false,
  diasRestantes: 0,
};

export async function obtenerPilotoContextoPorArea(
  areaId: string | null | undefined
): Promise<PilotoContexto> {
  if (!areaId) return VACIO;

  const config = await prisma.configuracionPiloto.findUnique({
    where: { areaId },
  });
  if (!config || !config.activo) return { ...VACIO, config };

  const ahora = new Date();
  const diasRestantes = Math.max(
    0,
    Math.ceil((config.fechaFin.getTime() - ahora.getTime()) / 86400000)
  );
  const mostrarBanner =
    config.mostrarBannerPiloto &&
    (!config.fechaFinBanner || ahora < config.fechaFinBanner);
  const enModoAnonimizado =
    config.anonimizarParaJefe &&
    (!config.fechaFinAnonimizacion ||
      ahora < config.fechaFinAnonimizacion);

  return {
    enPiloto: true,
    config,
    mostrarBanner,
    enModoAnonimizado,
    diasRestantes,
  };
}

export async function obtenerPilotoContextoUsuario(
  userId: string
): Promise<PilotoContexto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { areaId: true },
  });
  return obtenerPilotoContextoPorArea(user?.areaId);
}
