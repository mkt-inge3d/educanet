import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import type { RutaCarreraCompleta, PuestoEnCamino } from "@/types/carrera";

export async function obtenerRutaActualUsuario(
  userId: string
): Promise<RutaCarreraCompleta | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("carrera", `carrera-${userId}`);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { puestoId: true },
  });

  if (!user?.puestoId) return null;

  const ruta = await prisma.rutaCarrera.findFirst({
    where: { puestoOrigenId: user.puestoId, activa: true },
    orderBy: { puestoDestino: { nivel: "asc" } },
    include: {
      puestoOrigen: { select: { id: true, nombre: true, nivel: true } },
      puestoDestino: { select: { id: true, nombre: true, nivel: true } },
      cursos: {
        orderBy: { orden: "asc" },
        include: {
          curso: {
            select: {
              id: true,
              slug: true,
              titulo: true,
              nivel: true,
              duracionMinutos: true,
              instructorNombre: true,
              thumbnailUrl: true,
              modulos: {
                include: {
                  lecciones: {
                    select: {
                      id: true,
                      progresos: {
                        where: { userId },
                        select: { completada: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      metricas: true,
    },
  });

  if (!ruta) return null;

  // Get current metric values for this user
  const metricasActuales = await prisma.metricaDesempeno.findMany({
    where: { userId },
    orderBy: { fechaFin: "desc" },
  });

  return {
    id: ruta.id,
    titulo: ruta.titulo,
    descripcion: ruta.descripcion,
    puestoOrigen: ruta.puestoOrigen,
    puestoDestino: ruta.puestoDestino,
    cursos: ruta.cursos.map((rc) => {
      const totalLecciones = rc.curso.modulos.reduce(
        (acc, m) => acc + m.lecciones.length,
        0
      );
      const completadas = rc.curso.modulos.reduce(
        (acc, m) =>
          acc + m.lecciones.filter((l) => l.progresos[0]?.completada).length,
        0
      );
      const porcentaje =
        totalLecciones > 0
          ? Math.round((completadas / totalLecciones) * 100)
          : 0;

      return {
        cursoId: rc.cursoId,
        requerido: rc.requerido,
        orden: rc.orden,
        curso: {
          id: rc.curso.id,
          slug: rc.curso.slug,
          titulo: rc.curso.titulo,
          nivel: rc.curso.nivel,
          duracionMinutos: rc.curso.duracionMinutos,
          instructorNombre: rc.curso.instructorNombre,
          thumbnailUrl: rc.curso.thumbnailUrl,
        },
        porcentaje,
        estado:
          porcentaje === 100
            ? ("completado" as const)
            : porcentaje > 0
              ? ("en-progreso" as const)
              : ("no-iniciado" as const),
      };
    }),
    metricas: ruta.metricas.map((m) => {
      const actual = metricasActuales.find(
        (ma) => ma.nombre === m.nombre
      );
      return {
        id: m.id,
        nombre: m.nombre,
        descripcion: m.descripcion,
        valorObjetivo: m.valorObjetivo,
        unidad: m.unidad,
        periodo: m.periodo,
        valorActual: actual?.valor ?? null,
        cumplida: actual ? actual.valor >= m.valorObjetivo : false,
      };
    }),
  };
}

export async function obtenerPuestosSuperiores(
  puestoActualId: string
): Promise<PuestoEnCamino[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("carrera-puestos", `carrera-puestos-${puestoActualId}`);
  const actual = await prisma.puesto.findUnique({
    where: { id: puestoActualId },
    select: { id: true, nombre: true, nivel: true, areaId: true },
  });

  if (!actual) return [];

  const puestos = await prisma.puesto.findMany({
    where: { areaId: actual.areaId },
    orderBy: { nivel: "asc" },
    select: { id: true, nombre: true, nivel: true },
  });

  // Find the next one via route
  const ruta = await prisma.rutaCarrera.findFirst({
    where: { puestoOrigenId: actual.id, activa: true },
    select: { puestoDestinoId: true },
  });

  return puestos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    nivel: p.nivel,
    esActual: p.id === actual.id,
    esDestino: p.id === ruta?.puestoDestinoId,
    esFuturo: p.nivel > actual.nivel && p.id !== ruta?.puestoDestinoId,
  }));
}
