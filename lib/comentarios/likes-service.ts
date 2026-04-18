import { prisma } from "@/lib/prisma";
import { otorgarPuntos } from "@/lib/gamificacion/puntos";
import { puedeRecibirPuntosPorLike } from "@/lib/gamificacion/limites";
import { PUNTOS_POR_ACCION } from "@/lib/gamificacion/constantes";

export type ResultadoLike = {
  conLike: boolean;
  totalLikes: number;
  puntosOtorgadosAlAutor: number;
};

async function obtenerAutorYTotal(comentarioId: string) {
  const c = await prisma.comentario.findUnique({
    where: { id: comentarioId },
    select: {
      userId: true,
      _count: { select: { likes: true } },
    },
  });
  return c;
}

export async function darLike(params: {
  userId: string;
  comentarioId: string;
}): Promise<ResultadoLike> {
  const info = await obtenerAutorYTotal(params.comentarioId);
  if (!info) throw new Error("Comentario no existe");
  if (info.userId === params.userId) {
    throw new Error("No puedes dar like a tu propio comentario");
  }

  const yaExistia = await prisma.comentarioLike.findUnique({
    where: {
      userId_comentarioId: {
        userId: params.userId,
        comentarioId: params.comentarioId,
      },
    },
    select: { userId: true },
  });

  if (yaExistia) {
    const totalLikes = info._count.likes;
    return { conLike: true, totalLikes, puntosOtorgadosAlAutor: 0 };
  }

  await prisma.comentarioLike.create({
    data: {
      userId: params.userId,
      comentarioId: params.comentarioId,
    },
  });

  let puntosOtorgadosAlAutor = 0;
  const estado = await puedeRecibirPuntosPorLike(info.userId);
  if (estado.puede) {
    await otorgarPuntos({
      userId: info.userId,
      cantidad: PUNTOS_POR_ACCION.LIKE_RECIBIDO,
      razon: "LIKE_RECIBIDO",
      descripcion: "Like recibido en tu comentario",
      referenciaId: params.comentarioId,
    });
    puntosOtorgadosAlAutor = PUNTOS_POR_ACCION.LIKE_RECIBIDO;
  }

  const nuevoTotal = info._count.likes + 1;

  if (nuevoTotal % 3 === 0 || nuevoTotal === 1) {
    await prisma.notificacion.create({
      data: {
        userId: info.userId,
        tipo: "COMENTARIO_LIKE",
        titulo:
          nuevoTotal === 1
            ? "Tu comentario recibio un like"
            : `Tu comentario ya tiene ${nuevoTotal} likes`,
        mensaje: "Tus aportes estan resonando con el equipo.",
      },
    });
  }

  return {
    conLike: true,
    totalLikes: nuevoTotal,
    puntosOtorgadosAlAutor,
  };
}

export async function quitarLike(params: {
  userId: string;
  comentarioId: string;
}): Promise<ResultadoLike> {
  const existente = await prisma.comentarioLike.findUnique({
    where: {
      userId_comentarioId: {
        userId: params.userId,
        comentarioId: params.comentarioId,
      },
    },
    select: { userId: true },
  });

  if (!existente) {
    const info = await obtenerAutorYTotal(params.comentarioId);
    return {
      conLike: false,
      totalLikes: info?._count.likes ?? 0,
      puntosOtorgadosAlAutor: 0,
    };
  }

  await prisma.comentarioLike.delete({
    where: {
      userId_comentarioId: {
        userId: params.userId,
        comentarioId: params.comentarioId,
      },
    },
  });

  const info = await obtenerAutorYTotal(params.comentarioId);

  return {
    conLike: false,
    totalLikes: info?._count.likes ?? 0,
    puntosOtorgadosAlAutor: 0,
  };
}

export async function toggleLike(params: {
  userId: string;
  comentarioId: string;
}): Promise<ResultadoLike> {
  const existente = await prisma.comentarioLike.findUnique({
    where: {
      userId_comentarioId: {
        userId: params.userId,
        comentarioId: params.comentarioId,
      },
    },
    select: { userId: true },
  });

  if (existente) return quitarLike(params);
  return darLike(params);
}
