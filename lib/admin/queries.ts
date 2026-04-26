import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function obtenerKpisDashboard() {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-kpis");
  const ahora = new Date();
  const hace30Dias = new Date(ahora.getTime() - 30 * 86400000);
  const hace7Dias = new Date(ahora.getTime() - 7 * 86400000);

  const [
    totalUsuarios,
    usuariosActivos7d,
    cursosPublicados,
    leccionesCompletadasMes,
    certificadosMes,
    puntosOtorgadosMes,
  ] = await Promise.all([
    prisma.user.count({ where: { activo: true } }),
    prisma.user.count({
      where: { activo: true, ultimaActividad: { gte: hace7Dias } },
    }),
    prisma.curso.count({ where: { publicado: true } }),
    prisma.progresoLeccion.count({
      where: { completada: true, fechaCompletada: { gte: hace30Dias } },
    }),
    prisma.certificado.count({ where: { fechaEmision: { gte: hace30Dias } } }),
    prisma.transaccionPuntos.aggregate({
      where: { fecha: { gte: hace30Dias } },
      _sum: { cantidad: true },
    }),
  ]);

  return {
    totalUsuarios,
    usuariosActivos7d,
    cursosPublicados,
    leccionesCompletadasMes,
    certificadosMes,
    puntosOtorgadosMes: puntosOtorgadosMes._sum.cantidad ?? 0,
  };
}

export async function obtenerTopCursos(limite = 5) {
  "use cache";
  cacheLife("hours");
  cacheTag("admin-top-cursos", "cursos");
  const cursos = await prisma.curso.findMany({
    where: { publicado: true },
    include: {
      _count: { select: { certificados: true } },
      area: { select: { nombre: true } },
    },
    orderBy: { certificados: { _count: "desc" } },
    take: limite,
  });

  return cursos.map((c) => ({
    id: c.id,
    slug: c.slug,
    titulo: c.titulo,
    areaNombre: c.area?.nombre ?? "General",
    certificados: c._count.certificados,
  }));
}

export async function obtenerUsuariosRecientes(limite = 5) {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-usuarios");
  return prisma.user.findMany({
    where: { activo: true },
    orderBy: { createdAt: "desc" },
    take: limite,
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      createdAt: true,
      puesto: { select: { nombre: true } },
    },
  });
}
