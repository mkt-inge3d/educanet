import { Prisma } from "@prisma/client";

// ─── Include definitions (reusable in queries) ─────────────────────────────

export const userConRelacionesInclude = {
  puesto: true,
  area: true,
  organization: true,
  memberships: {
    include: { organization: true },
    orderBy: [{ esPrincipal: "desc" as const }, { createdAt: "asc" as const }],
  },
} satisfies Prisma.UserInclude;

export const userConStatsInclude = {
  puesto: true,
  area: true,
  _count: {
    select: {
      progresos: { where: { completada: true } },
      certificados: true,
      badges: true,
    },
  },
} satisfies Prisma.UserInclude;

export const cursoListadoInclude = {
  area: true,
  _count: {
    select: {
      modulos: true,
    },
  },
  modulos: {
    select: {
      _count: {
        select: { lecciones: true },
      },
    },
  },
} satisfies Prisma.CursoInclude;

export const cursoCompletoInclude = {
  area: true,
  modulos: {
    orderBy: { orden: "asc" as const },
    include: {
      lecciones: {
        orderBy: { orden: "asc" as const },
        include: {
          quiz: {
            include: {
              preguntas: {
                orderBy: { orden: "asc" as const },
                include: {
                  opciones: {
                    orderBy: { orden: "asc" as const },
                  },
                },
              },
            },
          },
          recursos: {
            orderBy: { orden: "asc" as const },
          },
        },
      },
    },
  },
} satisfies Prisma.CursoInclude;

export const leccionConQuizInclude = {
  quiz: {
    include: {
      preguntas: {
        orderBy: { orden: "asc" as const },
        include: {
          opciones: {
            orderBy: { orden: "asc" as const },
          },
        },
      },
    },
  },
} satisfies Prisma.LeccionInclude;

export const rutaCarreraCompletaInclude = {
  puestoOrigen: true,
  puestoDestino: true,
  cursos: {
    orderBy: { orden: "asc" as const },
    include: {
      curso: true,
    },
  },
  metricas: true,
} satisfies Prisma.RutaCarreraInclude;

// ─── Derived types ──────────────────────────────────────────────────────────

export type UserConRelaciones = Prisma.UserGetPayload<{
  include: typeof userConRelacionesInclude;
}>;

export type UserConStats = Prisma.UserGetPayload<{
  include: typeof userConStatsInclude;
}>;

export type CursoListado = Prisma.CursoGetPayload<{
  include: typeof cursoListadoInclude;
}>;

export type CursoCompleto = Prisma.CursoGetPayload<{
  include: typeof cursoCompletoInclude;
}>;

export type LeccionConQuiz = Prisma.LeccionGetPayload<{
  include: typeof leccionConQuizInclude;
}>;

export type RutaCarreraCompleta = Prisma.RutaCarreraGetPayload<{
  include: typeof rutaCarreraCompletaInclude;
}>;

// ─── Utility types ──────────────────────────────────────────────────────────

export type ProgresoResumen = {
  leccionesCompletadas: number;
  leccionesTotales: number;
  porcentajeProgreso: number;
  cursosCompletados: number;
  cursosTotales: number;
  puntosTotales: number;
  badgesObtenidos: number;
  rachaActual: number;
};
