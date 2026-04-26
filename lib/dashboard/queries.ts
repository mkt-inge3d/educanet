import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { calcularProgresoCurso } from "./calculos";

export async function obtenerDatosHome(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("home-dashboard", `home-usuario-${userId}`);
  const [
    usuario,
    cursos,
    progresosRaw,
    rutaCarrera,
    logrosRecientes,
    badgesCount,
    certificadosCount,
    metricasActuales,
    notificacionesNoLeidas,
    actividadEquipo,
  ] = await Promise.all([
    // User with stats
    prisma.user.findUnique({
      where: { id: userId },
      include: { puesto: true, area: true },
    }),

    // All published courses with modules and lesson IDs
    prisma.curso.findMany({
      where: { publicado: true },
      include: {
        area: true,
        modulos: {
          orderBy: { orden: "asc" },
          include: {
            lecciones: { select: { id: true }, orderBy: { orden: "asc" } },
          },
        },
      },
      orderBy: { orden: "asc" },
    }),

    // User's progress records
    prisma.progresoLeccion.findMany({
      where: { userId },
      select: {
        leccionId: true,
        completada: true,
        porcentajeVisto: true,
        leccion: {
          select: {
            id: true,
            titulo: true,
            slug: true,
            moduloId: true,
            modulo: {
              select: {
                cursoId: true,
                curso: { select: { slug: true, titulo: true } },
              },
            },
          },
        },
      },
    }),

    // Career path from current position
    prisma.rutaCarrera.findFirst({
      where: {
        puestoOrigenId: (
          await prisma.user.findUnique({
            where: { id: userId },
            select: { puestoId: true },
          })
        )?.puestoId ?? "",
        activa: true,
      },
      include: {
        puestoOrigen: true,
        puestoDestino: true,
        cursos: { orderBy: { orden: "asc" }, include: { curso: true } },
        metricas: true,
      },
    }),

    // Recent badges
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { fechaObtencion: "desc" },
      take: 5,
    }),

    // Counts
    prisma.userBadge.count({ where: { userId } }),
    prisma.certificado.count({ where: { userId } }),

    // Current period metrics
    prisma.metricaDesempeno.findMany({
      where: { userId, periodo: "TRIMESTRAL" },
      orderBy: { fechaFin: "desc" },
      take: 3,
    }),

    // Unread notification count
    prisma.notificacion.count({ where: { userId, leida: false } }),

    // Team activity (same area)
    prisma.transaccionPuntos.findMany({
      where: {
        user: {
          areaId: (
            await prisma.user.findUnique({
              where: { id: userId },
              select: { areaId: true },
            })
          )?.areaId ?? undefined,
          id: { not: userId },
        },
        fecha: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      include: { user: { select: { nombre: true, apellido: true } } },
      orderBy: { fecha: "desc" },
      take: 8,
    }),
  ]);

  if (!usuario) return null;

  // Calculate progress per course
  const leccionesCompletadasIds = new Set(
    progresosRaw.filter((p) => p.completada).map((p) => p.leccionId)
  );

  const cursosConProgreso = cursos.map((curso) => {
    const porcentaje = calcularProgresoCurso(curso.modulos, leccionesCompletadasIds);
    const totalLecciones = curso.modulos.reduce(
      (acc, m) => acc + m.lecciones.length,
      0
    );
    return { ...curso, porcentaje, totalLecciones };
  });

  const cursosEnProgreso = cursosConProgreso
    .filter((c) => c.porcentaje > 0 && c.porcentaje < 100)
    .slice(0, 5);

  const cursosCompletados = cursosConProgreso.filter(
    (c) => c.porcentaje === 100
  );

  const cursosRecomendados = cursosConProgreso
    .filter(
      (c) =>
        c.porcentaje === 0 &&
        (c.areaId === usuario.areaId || c.areaId === null)
    )
    .slice(0, 3);

  // Find last active lesson for CTA
  const ultimaLeccionActiva = progresosRaw
    .filter((p) => !p.completada && p.porcentajeVisto > 0)
    .sort((a, b) => b.porcentajeVisto - a.porcentajeVisto)[0];

  return {
    usuario,
    cursosEnProgreso,
    cursosCompletados,
    cursosRecomendados,
    cursosTotales: cursos.length,
    rutaCarrera,
    logrosRecientes,
    badgesCount,
    certificadosCount,
    metricasActuales,
    notificacionesNoLeidas,
    actividadEquipo,
    ultimaLeccionActiva,
    leccionesCompletadasIds,
  };
}
