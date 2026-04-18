"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type Result = { success: true } | { success: false; error: string };

export async function agregarCursoRelacionado(
  cursoOrigenId: string,
  cursoDestinoId: string
): Promise<Result> {
  await requireRole(["ADMIN"]);

  if (cursoOrigenId === cursoDestinoId) {
    return { success: false, error: "No se puede relacionar un curso consigo mismo" };
  }

  const existente = await prisma.cursoRelacionado.findUnique({
    where: {
      cursoOrigenId_cursoDestinoId: { cursoOrigenId, cursoDestinoId },
    },
    select: { cursoOrigenId: true },
  });
  if (existente) return { success: false, error: "Ya estaba relacionado" };

  const ultimoOrden = await prisma.cursoRelacionado.findFirst({
    where: { cursoOrigenId },
    orderBy: { orden: "desc" },
    select: { orden: true },
  });

  await prisma.cursoRelacionado.create({
    data: {
      cursoOrigenId,
      cursoDestinoId,
      orden: (ultimoOrden?.orden ?? -1) + 1,
    },
  });

  revalidatePath("/admin/cursos");
  return { success: true };
}

export async function eliminarCursoRelacionado(
  cursoOrigenId: string,
  cursoDestinoId: string
): Promise<Result> {
  await requireRole(["ADMIN"]);

  await prisma.cursoRelacionado.delete({
    where: {
      cursoOrigenId_cursoDestinoId: { cursoOrigenId, cursoDestinoId },
    },
  });

  revalidatePath("/admin/cursos");
  return { success: true };
}

export async function reordenarCursosRelacionados(
  cursoOrigenId: string,
  ordenIds: string[]
): Promise<Result> {
  await requireRole(["ADMIN"]);

  await prisma.$transaction(
    ordenIds.map((destinoId, idx) =>
      prisma.cursoRelacionado.update({
        where: {
          cursoOrigenId_cursoDestinoId: {
            cursoOrigenId,
            cursoDestinoId: destinoId,
          },
        },
        data: { orden: idx },
      })
    )
  );

  revalidatePath("/admin/cursos");
  return { success: true };
}
