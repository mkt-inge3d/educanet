import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import type { CursoListado, EstadoCurso } from "@/types/cursos";

type InputRelacionados = {
  cursoId: string;
  userId: string;
  limite?: number;
};

const LIMITE_DEFAULT = 3;

function construirListado(
  cursos: Array<{
    id: string;
    slug: string;
    titulo: string;
    descripcion: string;
    descripcionCorta: string | null;
    thumbnailUrl: string | null;
    duracionMinutos: number;
    nivel: "BASICO" | "INTERMEDIO" | "AVANZADO";
    puntosRecompensa: number;
    instructorNombre: string;
    instructorAvatarUrl: string | null;
    orden: number;
    area: {
      id: string;
      nombre: string;
      color: string;
      icono: string;
    } | null;
    modulos: Array<{
      lecciones: Array<{
        progresos: Array<{ completada: boolean }>;
      }>;
    }>;
  }>
): CursoListado[] {
  return cursos.map((curso) => {
    const totalLecciones = curso.modulos.reduce(
      (acc, m) => acc + m.lecciones.length,
      0
    );
    const leccionesCompletadas = curso.modulos.reduce(
      (acc, m) =>
        acc +
        m.lecciones.filter((l) => l.progresos[0]?.completada === true).length,
      0
    );
    const porcentaje =
      totalLecciones > 0
        ? Math.round((leccionesCompletadas / totalLecciones) * 100)
        : 0;
    const estado: EstadoCurso =
      porcentaje === 100
        ? "completado"
        : porcentaje > 0
          ? "en-progreso"
          : "no-iniciado";

    return {
      id: curso.id,
      slug: curso.slug,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      descripcionCorta: curso.descripcionCorta,
      thumbnailUrl: curso.thumbnailUrl,
      duracionMinutos: curso.duracionMinutos,
      nivel: curso.nivel,
      puntosRecompensa: curso.puntosRecompensa,
      instructorNombre: curso.instructorNombre,
      instructorAvatarUrl: curso.instructorAvatarUrl,
      orden: curso.orden,
      area: curso.area,
      totalLecciones,
      leccionesCompletadas,
      porcentaje,
      estado,
    };
  });
}

const incluirParaListado = {
  area: true,
  modulos: {
    include: {
      lecciones: {
        select: {
          id: true,
          progresos: {
            select: { completada: true },
          },
        },
      },
    },
  },
} as const;

export async function obtenerCursosRelacionados(
  params: InputRelacionados
): Promise<CursoListado[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("cursos", `cursos-usuario-${params.userId}`);

  const limite = params.limite ?? LIMITE_DEFAULT;

  const manualEntries = await prisma.cursoRelacionado.findMany({
    where: { cursoOrigenId: params.cursoId },
    orderBy: { orden: "asc" },
    include: {
      cursoDestino: {
        include: {
          area: true,
          modulos: {
            include: {
              lecciones: {
                select: {
                  id: true,
                  progresos: {
                    where: { userId: params.userId },
                    select: { completada: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const manualCursos = manualEntries
    .filter((e) => e.cursoDestino.publicado)
    .map((e) => e.cursoDestino);

  if (manualCursos.length >= limite) {
    return construirListado(manualCursos).slice(0, limite);
  }

  const idsExcluir = new Set<string>([params.cursoId]);
  manualCursos.forEach((c) => idsExcluir.add(c.id));

  const origen = await prisma.curso.findUnique({
    where: { id: params.cursoId },
    select: { areaId: true },
  });

  const fallback = await prisma.curso.findMany({
    where: {
      publicado: true,
      id: { notIn: Array.from(idsExcluir) },
      ...(origen?.areaId ? { areaId: origen.areaId } : {}),
    },
    include: {
      ...incluirParaListado,
      modulos: {
        include: {
          lecciones: {
            select: {
              id: true,
              progresos: {
                where: { userId: params.userId },
                select: { completada: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: limite * 2,
  });

  const fallbackListado = construirListado(fallback);
  fallbackListado.sort((a, b) => {
    const aNoIniciado = a.estado === "no-iniciado" ? 0 : 1;
    const bNoIniciado = b.estado === "no-iniciado" ? 0 : 1;
    return aNoIniciado - bNoIniciado;
  });

  const manualListado = construirListado(manualCursos);
  const resultado = [...manualListado, ...fallbackListado];
  return resultado.slice(0, limite);
}
