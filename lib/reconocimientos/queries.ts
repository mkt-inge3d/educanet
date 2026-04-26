import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

const detalleInclude = {
  nominador: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      avatarUrl: true,
      puesto: { select: { nombre: true } },
    },
  },
  reconocido: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      avatarUrl: true,
      puesto: { select: { nombre: true } },
    },
  },
  categoria: true,
} as const;

export async function listarCategorias() {
  "use cache";
  cacheLife("hours");
  cacheTag("categorias-reconocimiento");
  return prisma.categoriaReconocimiento.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  });
}

export async function obtenerReconocimientosDelEquipo(params: {
  areaId: string;
  currentUserId: string;
  limite?: number;
  cursor?: string;
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("reconocimientos", `reconocimientos-area-${params.areaId}`);
  const limite = params.limite ?? 20;
  const registros = await prisma.reconocimiento.findMany({
    where: {
      OR: [
        { visibilidad: "PUBLICO" },
        { nominadorId: params.currentUserId },
        { reconocidoId: params.currentUserId },
      ],
      nominador: { areaId: params.areaId },
    },
    orderBy: { createdAt: "desc" },
    take: limite + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    include: detalleInclude,
  });
  const hayMas = registros.length > limite;
  const pagina = hayMas ? registros.slice(0, limite) : registros;
  return {
    reconocimientos: pagina,
    siguienteCursor: hayMas ? pagina[pagina.length - 1].id : null,
  };
}

export async function obtenerReconocimientosRecibidos(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("reconocimientos", `reconocimientos-usuario-${userId}`);
  return prisma.reconocimiento.findMany({
    where: { reconocidoId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: detalleInclude,
  });
}

export async function obtenerReconocimientosDados(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("reconocimientos", `reconocimientos-dados-${userId}`);
  return prisma.reconocimiento.findMany({
    where: { nominadorId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: detalleInclude,
  });
}

export async function puedeNominarEstaSemana(params: {
  nominadorId: string;
  reconocidoId: string;
  anio: number;
  semana: number;
}): Promise<{ puede: boolean; razon?: string }> {
  if (params.nominadorId === params.reconocidoId) {
    return { puede: false, razon: "No puedes reconocerte a ti mismo" };
  }
  const existente = await prisma.reconocimiento.findFirst({
    where: {
      nominadorId: params.nominadorId,
      reconocidoId: params.reconocidoId,
      anio: params.anio,
      semanaDelAnio: params.semana,
    },
    select: { id: true },
  });
  if (existente) {
    return {
      puede: false,
      razon: "Ya reconociste a esta persona esta semana",
    };
  }
  return { puede: true };
}

export async function obtenerCompanerosDelArea(params: {
  areaId: string;
  excluirUserId: string;
}) {
  "use cache";
  cacheLife("hours");
  cacheTag("companeros", `companeros-area-${params.areaId}`);
  return prisma.user.findMany({
    where: {
      areaId: params.areaId,
      id: { not: params.excluirUserId },
      activo: true,
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      apellido: true,
      avatarUrl: true,
      puesto: { select: { nombre: true } },
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
}

export async function contarRecibidosMes(
  userId: string,
  mes: number,
  anio: number
): Promise<number> {
  "use cache";
  cacheLife("minutes");
  cacheTag("reconocimientos", `reconocimientos-usuario-${userId}`);
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 0, 23, 59, 59);
  return prisma.reconocimiento.count({
    where: {
      reconocidoId: userId,
      createdAt: { gte: inicio, lte: fin },
    },
  });
}
