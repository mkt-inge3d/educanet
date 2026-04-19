import { prisma } from "@/lib/prisma";
import type {
  LeccionDetalleCompleta,
  ModuloConLeccionesYProgreso,
  LeccionAdyacente,
} from "@/types/lecciones";

export async function obtenerLeccionCompleta(
  cursoSlug: string,
  leccionSlug: string,
  userId: string
): Promise<LeccionDetalleCompleta | null> {
  const curso = await prisma.curso.findUnique({
    where: { slug: cursoSlug },
    select: { id: true, slug: true, titulo: true, puntosRecompensa: true, publicado: true },
  });
  if (!curso) return null;

  // Find leccion by slug within this course's modules
  const leccion = await prisma.leccion.findFirst({
    where: {
      slug: leccionSlug,
      modulo: { cursoId: curso.id },
    },
    include: {
      modulo: { select: { id: true, titulo: true, orden: true } },
      quiz: {
        include: {
          preguntas: {
            orderBy: { orden: "asc" },
            include: { opciones: { orderBy: { orden: "asc" } } },
          },
        },
      },
      recursos: { orderBy: { orden: "asc" } },
      progresos: {
        where: { userId },
        select: { completada: true, porcentajeVisto: true },
      },
      notas: {
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, contenido: true, timestampVideo: true, createdAt: true },
      },
    },
  });

  if (!leccion) return null;

  // Best quiz attempt
  let mejorIntentoQuiz = null;
  if (leccion.quiz) {
    const mejor = await prisma.intentoQuiz.findFirst({
      where: { userId, quizId: leccion.quiz.id },
      orderBy: { puntaje: "desc" },
      select: { puntaje: true, aprobado: true },
    });
    mejorIntentoQuiz = mejor;
  }

  const progreso = leccion.progresos[0];

  return {
    id: leccion.id,
    slug: leccion.slug,
    titulo: leccion.titulo,
    descripcion: leccion.descripcion,
    tipo: leccion.tipo,
    bunnyVideoId: leccion.bunnyVideoId,
    contenidoMarkdown: leccion.contenidoMarkdown,
    duracionSegundos: leccion.duracionSegundos,
    puntosRecompensa: leccion.puntosRecompensa,
    orden: leccion.orden,
    modulo: leccion.modulo,
    curso,
    quiz: leccion.quiz,
    recursos: leccion.recursos,
    notas: leccion.notas,
    completada: progreso?.completada ?? false,
    porcentajeVisto: progreso?.porcentajeVisto ?? 0,
    mejorIntentoQuiz,
  };
}

export async function obtenerEstructuraCurso(
  cursoSlug: string,
  userId: string
): Promise<ModuloConLeccionesYProgreso[]> {
  const curso = await prisma.curso.findUnique({
    where: { slug: cursoSlug },
    include: {
      modulos: {
        orderBy: { orden: "asc" },
        include: {
          lecciones: {
            orderBy: { orden: "asc" },
            select: {
              id: true,
              slug: true,
              titulo: true,
              tipo: true,
              duracionSegundos: true,
              progresos: {
                where: { userId },
                select: { completada: true, porcentajeVisto: true },
              },
            },
          },
        },
      },
    },
  });

  if (!curso) return [];

  return curso.modulos.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    orden: m.orden,
    lecciones: m.lecciones.map((l) => ({
      id: l.id,
      slug: l.slug,
      titulo: l.titulo,
      tipo: l.tipo,
      duracionSegundos: l.duracionSegundos,
      completada: l.progresos[0]?.completada ?? false,
      porcentajeVisto: l.progresos[0]?.porcentajeVisto ?? 0,
    })),
  }));
}

export async function obtenerLeccionesAdyacentes(
  cursoSlug: string,
  moduloOrden: number,
  leccionOrden: number
): Promise<{ anterior: LeccionAdyacente | null; siguiente: LeccionAdyacente | null }> {
  const curso = await prisma.curso.findUnique({
    where: { slug: cursoSlug },
    include: {
      modulos: {
        orderBy: { orden: "asc" },
        include: {
          lecciones: {
            orderBy: { orden: "asc" },
            select: { slug: true, titulo: true, tipo: true, orden: true },
          },
        },
      },
    },
  });

  if (!curso) return { anterior: null, siguiente: null };

  return adyacentesDesdeModulos(curso.modulos, moduloOrden, leccionOrden);
}

type ModuloMin = {
  lecciones: { slug: string; titulo: string; tipo: LeccionAdyacente["tipo"] }[];
};

export function adyacentesDesdeModulos(
  modulos: ModuloMin[],
  _moduloOrden: number,
  _leccionOrden: number,
  leccionSlug?: string
): { anterior: LeccionAdyacente | null; siguiente: LeccionAdyacente | null } {
  const todas: LeccionAdyacente[] = modulos.flatMap((m) =>
    m.lecciones.map((l) => ({ slug: l.slug, titulo: l.titulo, tipo: l.tipo }))
  );

  const idx = leccionSlug ? todas.findIndex((l) => l.slug === leccionSlug) : -1;

  return {
    anterior: idx > 0 ? todas[idx - 1] : null,
    siguiente: idx >= 0 && idx < todas.length - 1 ? todas[idx + 1] : null,
  };
}
