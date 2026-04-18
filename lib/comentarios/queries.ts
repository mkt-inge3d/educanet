import { prisma } from "@/lib/prisma";
import type {
  ComentarioConDetalle,
  ComentarioRespuesta,
  OrdenComentarios,
} from "@/types/comentarios";

const LIMITE_DEFAULT = 20;

type ComentarioRaw = {
  id: string;
  leccionId: string;
  userId: string;
  contenido: string;
  createdAt: Date;
  editado: boolean;
  fechaEdicion: Date | null;
  reportado: boolean;
  comentarioPadreId: string | null;
  user: {
    id: string;
    nombre: string;
    apellido: string;
    avatarUrl: string | null;
    puesto: { nombre: string } | null;
  };
  _count: { likes: number; respuestas: number };
  likes: { userId: string }[];
};

function mapear(
  raw: ComentarioRaw,
  respuestas: ComentarioRespuesta[] = []
): ComentarioConDetalle {
  return {
    id: raw.id,
    leccionId: raw.leccionId,
    userId: raw.userId,
    contenido: raw.contenido,
    createdAt: raw.createdAt,
    editado: raw.editado,
    fechaEdicion: raw.fechaEdicion,
    reportado: raw.reportado,
    comentarioPadreId: raw.comentarioPadreId,
    user: raw.user,
    totalLikes: raw._count.likes,
    totalRespuestas: raw._count.respuestas,
    usuarioDioLike: raw.likes.length > 0,
    respuestas,
  };
}

function mapearRespuesta(raw: ComentarioRaw): ComentarioRespuesta {
  return {
    id: raw.id,
    leccionId: raw.leccionId,
    userId: raw.userId,
    contenido: raw.contenido,
    createdAt: raw.createdAt,
    editado: raw.editado,
    fechaEdicion: raw.fechaEdicion,
    reportado: raw.reportado,
    comentarioPadreId: raw.comentarioPadreId,
    user: raw.user,
    totalLikes: raw._count.likes,
    usuarioDioLike: raw.likes.length > 0,
  };
}

export async function listarComentariosLeccion(params: {
  leccionId: string;
  userId: string;
  orden: OrdenComentarios;
  cursor?: string;
  limite?: number;
}): Promise<{
  comentarios: ComentarioConDetalle[];
  siguienteCursor: string | null;
}> {
  const limite = params.limite ?? LIMITE_DEFAULT;

  const whereBase = {
    leccionId: params.leccionId,
    comentarioPadreId: null,
    oculto: false,
    ...(params.orden === "favoritos"
      ? { likes: { some: { userId: params.userId } } }
      : {}),
  };

  let orderBy;
  if (params.orden === "mas-votados") {
    orderBy = [
      { likes: { _count: "desc" } },
      { createdAt: "desc" },
    ] as const;
  } else {
    orderBy = [{ createdAt: "desc" }] as const;
  }

  const topLevel = await prisma.comentario.findMany({
    where: whereBase,
    orderBy: [...orderBy],
    take: limite + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          avatarUrl: true,
          puesto: { select: { nombre: true } },
        },
      },
      _count: { select: { likes: true, respuestas: true } },
      likes: {
        where: { userId: params.userId },
        select: { userId: true },
      },
    },
  });

  const hayMas = topLevel.length > limite;
  const pagina = hayMas ? topLevel.slice(0, limite) : topLevel;
  const siguienteCursor = hayMas ? pagina[pagina.length - 1].id : null;

  const padresIds = pagina.map((c) => c.id);
  const respuestasRaw = padresIds.length
    ? await prisma.comentario.findMany({
        where: {
          comentarioPadreId: { in: padresIds },
          oculto: false,
        },
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatarUrl: true,
              puesto: { select: { nombre: true } },
            },
          },
          _count: { select: { likes: true, respuestas: true } },
          likes: {
            where: { userId: params.userId },
            select: { userId: true },
          },
        },
      })
    : [];

  const respuestasPorPadre = new Map<string, ComentarioRespuesta[]>();
  for (const r of respuestasRaw) {
    const key = r.comentarioPadreId!;
    const arr = respuestasPorPadre.get(key) ?? [];
    arr.push(mapearRespuesta(r));
    respuestasPorPadre.set(key, arr);
  }

  const comentarios = pagina.map((c) =>
    mapear(c, respuestasPorPadre.get(c.id) ?? [])
  );

  return { comentarios, siguienteCursor };
}

export async function obtenerContadorComentarios(
  leccionId: string
): Promise<number> {
  return prisma.comentario.count({
    where: { leccionId, oculto: false },
  });
}

export async function obtenerReportesPendientes() {
  return prisma.reporteComentario.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { createdAt: "desc" },
    include: {
      comentario: {
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatarUrl: true,
            },
          },
          leccion: {
            select: {
              id: true,
              slug: true,
              titulo: true,
              modulo: {
                select: {
                  curso: { select: { slug: true, titulo: true } },
                },
              },
            },
          },
        },
      },
      reportador: {
        select: { id: true, nombre: true, apellido: true },
      },
    },
  });
}

export async function contarReportesPendientes(): Promise<number> {
  return prisma.reporteComentario.count({ where: { estado: "PENDIENTE" } });
}
