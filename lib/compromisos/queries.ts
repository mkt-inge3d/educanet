import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { getSemanaISO } from "@/lib/gamificacion/periodo";

export async function listarCompromisosUsuario(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("compromisos", `compromisos-${userId}`);
  return prisma.compromiso.findMany({
    where: { userId },
    orderBy: [{ estado: "asc" }, { fechaLimite: "asc" }],
    take: 100,
    include: {
      asignadoPor: {
        select: { id: true, nombre: true, apellido: true },
      },
      validadoPor: {
        select: { id: true, nombre: true, apellido: true },
      },
    },
  });
}

export async function listarCompromisosPorEstado(userId: string) {
  const todos = await listarCompromisosUsuario(userId);
  return {
    propuestas: todos.filter((c) => c.estado === "PROPUESTO"),
    pendientes: todos.filter((c) => c.estado === "PENDIENTE"),
    porValidar: todos.filter((c) => c.estado === "CUMPLIDO_AUTO"),
    completados: todos
      .filter((c) => c.estado === "CUMPLIDO")
      .slice(0, 10),
    noCumplidos: todos.filter(
      (c) => c.estado === "ATRASADO" || c.estado === "NO_CUMPLIDO"
    ),
  };
}

export async function obtenerCompromisosPendientesValidacion(areaId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("compromisos", `compromisos-area-${areaId}`);
  return prisma.compromiso.findMany({
    where: {
      estado: "CUMPLIDO_AUTO",
      user: { areaId },
    },
    orderBy: { fechaCumplimiento: "asc" },
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
    },
  });
}

export async function obtenerPropuestasPorAprobar(areaId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("compromisos", `compromisos-area-${areaId}`);
  return prisma.compromiso.findMany({
    where: {
      estado: "PROPUESTO",
      user: { areaId },
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
    },
  });
}

export async function obtenerCompromisosDelEquipoPorMiembro(
  areaId: string,
  excluirUserId?: string
) {
  "use cache";
  cacheLife("minutes");
  cacheTag("compromisos", `compromisos-area-${areaId}`);
  const miembros = await prisma.user.findMany({
    where: {
      areaId,
      activo: true,
      ...(excluirUserId ? { id: { not: excluirUserId } } : {}),
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      avatarUrl: true,
      email: true,
      puesto: { select: { nombre: true } },
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });

  const { semana, anio } = getSemanaISO(new Date());

  const miembrosConCompromisos = await Promise.all(
    miembros.map(async (m) => {
      const compromisosSemana = await prisma.compromiso.findMany({
        where: {
          userId: m.id,
          semanaDelAnio: semana,
          anio,
        },
        orderBy: { fechaLimite: "asc" },
      });

      const cumplidos = compromisosSemana.filter(
        (c) => c.estado === "CUMPLIDO"
      ).length;
      const totalRelevantes = compromisosSemana.filter(
        (c) => c.estado !== "PROPUESTO"
      ).length;
      const tasa =
        totalRelevantes > 0 ? (cumplidos / totalRelevantes) * 100 : 0;

      return {
        user: m,
        compromisosSemana,
        cumplidos,
        total: totalRelevantes,
        tasa,
      };
    })
  );

  return miembrosConCompromisos;
}

export async function estadisticasMes(
  userId: string,
  mes: number,
  anio: number
) {
  "use cache";
  cacheLife("minutes");
  cacheTag("compromisos", `compromisos-${userId}`);
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 0, 23, 59, 59);
  const compromisos = await prisma.compromiso.findMany({
    where: { userId, createdAt: { gte: inicio, lte: fin } },
    select: { estado: true, puntosOtorgados: true },
  });
  const cumplidos = compromisos.filter((c) => c.estado === "CUMPLIDO").length;
  const puntos = compromisos.reduce((s, c) => s + c.puntosOtorgados, 0);
  return {
    total: compromisos.length,
    cumplidos,
    puntos,
    tasaCumplimiento:
      compromisos.length > 0 ? (cumplidos / compromisos.length) * 100 : 0,
  };
}

export async function estadisticasSemana(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("compromisos", `compromisos-${userId}`);
  const { semana, anio } = getSemanaISO(new Date());
  const compromisos = await prisma.compromiso.findMany({
    where: { userId, semanaDelAnio: semana, anio },
    select: { estado: true },
  });
  const relevantes = compromisos.filter((c) => c.estado !== "PROPUESTO");
  const cumplidos = relevantes.filter((c) => c.estado === "CUMPLIDO").length;
  const enCurso = relevantes.filter(
    (c) => c.estado === "PENDIENTE" || c.estado === "CUMPLIDO_AUTO"
  ).length;
  const fallados = relevantes.filter(
    (c) => c.estado === "ATRASADO" || c.estado === "NO_CUMPLIDO"
  ).length;
  return {
    total: relevantes.length,
    cumplidos,
    enCurso,
    fallados,
    tasa: relevantes.length > 0 ? (cumplidos / relevantes.length) * 100 : 0,
  };
}
