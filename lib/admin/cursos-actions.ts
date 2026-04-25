"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function crearCurso(data: {
  titulo: string;
  descripcion: string;
  descripcionCorta?: string;
  nivel: "BASICO" | "INTERMEDIO" | "AVANZADO";
  areaId?: string;
  duracionMinutos: number;
  puntosRecompensa: number;
  instructorNombre: string;
  publicado: boolean;
}) {
  await requireRole(["ADMIN"]);

  const slug = slugify(data.titulo);
  const curso = await prisma.curso.create({
    data: { ...data, slug, areaId: data.areaId || null },
  });

  revalidatePath("/admin/cursos");
  return curso;
}

export async function actualizarCurso(
  id: string,
  data: {
    titulo?: string;
    descripcion?: string;
    descripcionCorta?: string;
    nivel?: "BASICO" | "INTERMEDIO" | "AVANZADO";
    areaId?: string | null;
    duracionMinutos?: number;
    puntosRecompensa?: number;
    instructorNombre?: string;
  }
) {
  await requireRole(["ADMIN"]);
  await prisma.curso.update({ where: { id }, data });
  revalidatePath("/admin/cursos");
}

export async function publicarCurso(id: string, publicado: boolean) {
  await requireRole(["ADMIN"]);
  await prisma.curso.update({ where: { id }, data: { publicado } });
  revalidatePath("/admin/cursos");
  revalidatePath("/cursos");
}

export async function eliminarCurso(id: string) {
  await requireRole(["ADMIN"]);

  const certs = await prisma.certificado.count({ where: { cursoId: id } });
  if (certs > 0) {
    return { error: "No se puede eliminar un curso con certificados emitidos" };
  }

  await prisma.curso.delete({ where: { id } });
  revalidatePath("/admin/cursos");
  return { ok: true };
}

export async function crearModulo(cursoId: string, data: { titulo: string; descripcion?: string }) {
  await requireRole(["ADMIN"]);
  const maxOrden = await prisma.modulo.aggregate({
    where: { cursoId },
    _max: { orden: true },
  });
  const orden = (maxOrden._max.orden ?? 0) + 1;

  await prisma.modulo.create({ data: { cursoId, titulo: data.titulo, descripcion: data.descripcion, orden } });
  revalidatePath("/admin/cursos");
}

export async function actualizarVideoUrlLeccion(leccionId: string, videoUrl: string | null) {
  await requireRole(["ADMIN"]);
  await prisma.leccion.update({
    where: { id: leccionId },
    data: { videoUrl: videoUrl || null },
  });
  revalidatePath("/admin/cursos");
  revalidatePath("/cursos");
}

export async function crearLeccion(moduloId: string, data: {
  titulo: string;
  tipo: "VIDEO" | "LECTURA" | "QUIZ";
  duracionSegundos?: number;
  puntosRecompensa?: number;
  contenidoMarkdown?: string;
  bunnyVideoId?: string;
}) {
  await requireRole(["ADMIN"]);
  const slug = slugify(data.titulo);
  const maxOrden = await prisma.leccion.aggregate({
    where: { moduloId },
    _max: { orden: true },
  });
  const orden = (maxOrden._max.orden ?? 0) + 1;

  await prisma.leccion.create({
    data: {
      moduloId,
      slug,
      titulo: data.titulo,
      tipo: data.tipo,
      duracionSegundos: data.duracionSegundos ?? 0,
      puntosRecompensa: data.puntosRecompensa ?? 10,
      contenidoMarkdown: data.contenidoMarkdown,
      bunnyVideoId: data.bunnyVideoId,
      orden,
    },
  });
  revalidatePath("/admin/cursos");
}
