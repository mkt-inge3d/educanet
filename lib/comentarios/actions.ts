"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import {
  comentarioSchema,
  actualizarComentarioSchema,
  reporteSchema,
  sanitizarTextoPlano,
} from "./schemas";
import { toggleLike } from "./likes-service";

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function revalidarLeccion(leccionId: string) {
  const leccion = await prisma.leccion.findUnique({
    where: { id: leccionId },
    select: {
      slug: true,
      modulo: { select: { curso: { select: { slug: true } } } },
    },
  });
  if (leccion) {
    revalidatePath(
      `/cursos/${leccion.modulo.curso.slug}/${leccion.slug}`
    );
  }
}

export async function crearComentario(input: {
  leccionId: string;
  contenido: string;
  comentarioPadreId?: string;
}): Promise<Result<{ comentarioId: string }>> {
  const user = await requireAuth();

  const contenidoLimpio = sanitizarTextoPlano(input.contenido);
  const parsed = comentarioSchema.safeParse({
    contenido: contenidoLimpio,
    leccionId: input.leccionId,
    comentarioPadreId: input.comentarioPadreId,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const leccion = await prisma.leccion.findUnique({
    where: { id: input.leccionId },
    select: { id: true },
  });
  if (!leccion) return { success: false, error: "Leccion no existe" };

  let padre: { id: string; userId: string; leccionId: string } | null = null;
  if (input.comentarioPadreId) {
    const found = await prisma.comentario.findUnique({
      where: { id: input.comentarioPadreId },
      select: { id: true, userId: true, leccionId: true, comentarioPadreId: true },
    });
    if (!found || found.leccionId !== input.leccionId) {
      return { success: false, error: "Comentario padre invalido" };
    }
    if (found.comentarioPadreId) {
      return {
        success: false,
        error: "No se puede responder a una respuesta",
      };
    }
    padre = { id: found.id, userId: found.userId, leccionId: found.leccionId };
  }

  const comentario = await prisma.comentario.create({
    data: {
      userId: user.id,
      leccionId: input.leccionId,
      contenido: contenidoLimpio,
      comentarioPadreId: padre?.id,
    },
  });

  if (padre && padre.userId !== user.id) {
    await prisma.notificacion.create({
      data: {
        userId: padre.userId,
        tipo: "COMENTARIO_RESPUESTA",
        titulo: `${user.nombre} ${user.apellido} respondio tu comentario`,
        mensaje: contenidoLimpio.slice(0, 120),
      },
    });
  }

  await revalidarLeccion(input.leccionId);

  return { success: true, data: { comentarioId: comentario.id } };
}

export async function actualizarComentario(input: {
  id: string;
  contenido: string;
}): Promise<Result> {
  const user = await requireAuth();

  const contenidoLimpio = sanitizarTextoPlano(input.contenido);
  const parsed = actualizarComentarioSchema.safeParse({
    id: input.id,
    contenido: contenidoLimpio,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existente = await prisma.comentario.findUnique({
    where: { id: input.id },
    select: { userId: true, leccionId: true },
  });
  if (!existente) return { success: false, error: "Comentario no existe" };
  if (existente.userId !== user.id) {
    return { success: false, error: "Solo puedes editar tu comentario" };
  }

  await prisma.comentario.update({
    where: { id: input.id },
    data: {
      contenido: contenidoLimpio,
      editado: true,
      fechaEdicion: new Date(),
    },
  });

  await revalidarLeccion(existente.leccionId);
  return { success: true };
}

export async function eliminarComentario(id: string): Promise<Result> {
  const user = await requireAuth();

  const existente = await prisma.comentario.findUnique({
    where: { id },
    select: { userId: true, leccionId: true },
  });
  if (!existente) return { success: false, error: "Comentario no existe" };

  const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
  if (existente.userId !== user.id && !esAdmin) {
    return { success: false, error: "No autorizado" };
  }

  await prisma.comentario.delete({ where: { id } });
  await revalidarLeccion(existente.leccionId);
  return { success: true };
}

export async function toggleLikeComentario(
  comentarioId: string
): Promise<
  Result<{ conLike: boolean; totalLikes: number }>
> {
  const user = await requireAuth();

  try {
    const res = await toggleLike({ userId: user.id, comentarioId });
    const leccionId = await prisma.comentario
      .findUnique({
        where: { id: comentarioId },
        select: { leccionId: true },
      })
      .then((c) => c?.leccionId);
    if (leccionId) await revalidarLeccion(leccionId);
    return {
      success: true,
      data: { conLike: res.conLike, totalLikes: res.totalLikes },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al procesar el like",
    };
  }
}

export async function reportarComentario(input: {
  comentarioId: string;
  razon: string;
}): Promise<Result> {
  const user = await requireAuth();

  const parsed = reporteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existente = await prisma.comentario.findUnique({
    where: { id: input.comentarioId },
    select: { leccionId: true },
  });
  if (!existente) return { success: false, error: "Comentario no existe" };

  await prisma.$transaction([
    prisma.reporteComentario.create({
      data: {
        comentarioId: input.comentarioId,
        reportadorId: user.id,
        razon: input.razon.trim(),
      },
    }),
    prisma.comentario.update({
      where: { id: input.comentarioId },
      data: { reportado: true },
    }),
  ]);

  const admins = await prisma.user.findMany({
    where: { rol: { in: ["ADMIN", "RRHH"] }, activo: true },
    select: { id: true },
  });

  if (admins.length) {
    await prisma.notificacion.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        tipo: "COMENTARIO_REPORTADO" as const,
        titulo: "Nuevo comentario reportado",
        mensaje: "Revisalo en el panel de moderacion.",
        url: "/admin/moderacion",
      })),
    });
  }

  return { success: true };
}

export async function ocultarComentario(id: string): Promise<Result> {
  await requireRole(["ADMIN", "RRHH"]);

  const existente = await prisma.comentario.findUnique({
    where: { id },
    select: { leccionId: true },
  });
  if (!existente) return { success: false, error: "Comentario no existe" };

  await prisma.comentario.update({
    where: { id },
    data: { oculto: true },
  });

  await revalidarLeccion(existente.leccionId);
  return { success: true };
}

export async function resolverReporte(input: {
  reporteId: string;
  accion: "OCULTAR" | "DESESTIMAR";
}): Promise<Result> {
  const user = await requireRole(["ADMIN", "RRHH"]);

  const reporte = await prisma.reporteComentario.findUnique({
    where: { id: input.reporteId },
    select: { comentarioId: true, estado: true },
  });
  if (!reporte) return { success: false, error: "Reporte no existe" };
  if (reporte.estado !== "PENDIENTE") {
    return { success: false, error: "Reporte ya resuelto" };
  }

  if (input.accion === "OCULTAR") {
    await prisma.$transaction([
      prisma.comentario.update({
        where: { id: reporte.comentarioId },
        data: { oculto: true },
      }),
      prisma.reporteComentario.update({
        where: { id: input.reporteId },
        data: {
          estado: "APROBADO",
          resueltoEn: new Date(),
          resueltoPorId: user.id,
        },
      }),
    ]);
  } else {
    await prisma.reporteComentario.update({
      where: { id: input.reporteId },
      data: {
        estado: "DESESTIMADO",
        resueltoEn: new Date(),
        resueltoPorId: user.id,
      },
    });
  }

  revalidatePath("/admin/moderacion");
  return { success: true };
}
