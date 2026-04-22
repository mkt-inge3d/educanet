import { prisma } from "@/lib/prisma";
import { obtenerUrlFirmadaEvidencia } from "./evidencia-storage";
import { isoWeek } from "./instancias-generador";

export type HitoConInstancia = {
  asignacionMesId: string;
  definicionId: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  frecuencia: "SEMANAL" | "MENSUAL";
  puntos: number;
  puntosAjustados: number | null;
  puntosMaxMes: number;
  esCondicional: boolean;
  cantidadMaxMes: number | null;
  cantidadMes: number | null;
  noAplica: boolean;
  motivoNoAplica: string | null;
  instancias: {
    id: string;
    semanaDelAnio: number | null;
    numeroOcurrencia: number;
    estado: string;
    evidenciaPath: string | null;
    evidenciaTipo: string | null;
    comentarioEmpleado: string | null;
    comentarioRevisor: string | null;
    fechaReportado: Date | null;
    fechaValidado: Date | null;
    puntosOtorgados: number;
  }[];
};

export type ProgresoHitosUsuario = {
  periodo: { mes: number; anio: number; semana: number };
  puntosAcumulados: number;
  puntosTope: number;
  semanales: HitoConInstancia[];
  mensuales: HitoConInstancia[];
  cantidadPorEstado: {
    pendiente: number;
    enRevision: number;
    aprobado: number;
    rechazado: number;
    noAplica: number;
  };
};

export async function obtenerHitosUsuario(
  userId: string,
  periodoMes: number,
  periodoAnio: number
): Promise<ProgresoHitosUsuario> {
  const asignaciones = await prisma.kpiAsignacionMes.findMany({
    where: {
      userId,
      periodoMes,
      periodoAnio,
      definicion: { activa: true, frecuencia: { not: null } },
    },
    include: {
      definicion: true,
      instancias: {
        orderBy: [
          { semanaDelAnio: "asc" },
          { numeroOcurrencia: "asc" },
        ],
      },
    },
    orderBy: { definicion: { orden: "asc" } },
  });

  const ahora = new Date();
  const semana = isoWeek(ahora);

  const mapear = (a: (typeof asignaciones)[number]): HitoConInstancia => ({
    asignacionMesId: a.id,
    definicionId: a.definicion.id,
    codigo: a.definicion.codigo,
    nombre: a.definicion.nombre,
    descripcion: a.definicion.descripcion,
    frecuencia: a.definicion.frecuencia!,
    puntos: a.definicion.puntos ?? 0,
    puntosAjustados: a.puntosAjustados,
    puntosMaxMes: a.definicion.puntosMaxMes ?? 0,
    esCondicional: a.definicion.esCondicional,
    cantidadMaxMes: a.definicion.cantidadMaxMes,
    cantidadMes: a.cantidadMes,
    noAplica: a.noAplica,
    motivoNoAplica: a.motivoNoAplica,
    instancias: a.instancias.map((i) => ({
      id: i.id,
      semanaDelAnio: i.semanaDelAnio,
      numeroOcurrencia: i.numeroOcurrencia,
      estado: i.estado,
      evidenciaPath: i.evidenciaPath,
      evidenciaTipo: i.evidenciaTipo,
      comentarioEmpleado: i.comentarioEmpleado,
      comentarioRevisor: i.comentarioRevisor,
      fechaReportado: i.fechaReportado,
      fechaValidado: i.fechaValidado,
      puntosOtorgados: i.puntosOtorgados,
    })),
  });

  const semanales = asignaciones
    .filter((a) => a.definicion.frecuencia === "SEMANAL")
    .map(mapear);
  const mensuales = asignaciones
    .filter((a) => a.definicion.frecuencia === "MENSUAL")
    .map(mapear);

  // Puntos acumulados del mes vienen del rangoMensual (autoridad del motor).
  const rango = await prisma.rangoMensual.findUnique({
    where: {
      userId_periodoMes_periodoAnio: { userId, periodoMes, periodoAnio },
    },
    select: { puntosKpis: true },
  });

  const cantidadPorEstado = {
    pendiente: 0,
    enRevision: 0,
    aprobado: 0,
    rechazado: 0,
    noAplica: 0,
  };
  for (const a of asignaciones) {
    if (a.noAplica) {
      cantidadPorEstado.noAplica++;
      continue;
    }
    for (const i of a.instancias) {
      if (i.estado === "PENDIENTE") cantidadPorEstado.pendiente++;
      else if (i.estado === "EN_REVISION") cantidadPorEstado.enRevision++;
      else if (i.estado === "APROBADO") cantidadPorEstado.aprobado++;
      else if (i.estado === "RECHAZADO") cantidadPorEstado.rechazado++;
      else if (i.estado === "NO_APLICA") cantidadPorEstado.noAplica++;
    }
  }

  return {
    periodo: { mes: periodoMes, anio: periodoAnio, semana },
    puntosAcumulados: rango?.puntosKpis ?? 0,
    puntosTope: 1000,
    semanales,
    mensuales,
    cantidadPorEstado,
  };
}

// ───────────────────────────────────────────────────────────────────
// JEFE: cola de instancias por validar
// ───────────────────────────────────────────────────────────────────
export type ItemValidacion = {
  instanciaId: string;
  user: { id: string; nombre: string; apellido: string; avatarUrl: string | null };
  codigo: string;
  nombre: string;
  frecuencia: "SEMANAL" | "MENSUAL";
  semanaDelAnio: number | null;
  numeroOcurrencia: number;
  puntosOtorgados: number;
  evidenciaPath: string | null;
  evidenciaTipo: string | null;
  evidenciaUrl: string | null;
  comentarioEmpleado: string | null;
  fechaReportado: Date | null;
  fechaValidado: Date | null;
};

/**
 * Cola de revision para el jefe: instancias APROBADAS automaticamente por el
 * empleado (auto-marcadas) que el jefe debe revisar. Si encuentra una mal,
 * la regresa via revertirAprobado.
 */
export async function obtenerColaValidacionJefe(jefeAreaId: string | null) {
  if (!jefeAreaId) return { items: [] as ItemValidacion[], total: 0 };

  const instancias = await prisma.kpiInstancia.findMany({
    where: {
      estado: "APROBADO",
      asignacionMes: {
        user: { areaId: jefeAreaId, activo: true },
      },
    },
    include: {
      asignacionMes: {
        include: {
          definicion: true,
          user: {
            select: { id: true, nombre: true, apellido: true, avatarUrl: true },
          },
        },
      },
    },
    orderBy: { fechaValidado: "desc" },
  });

  const items: ItemValidacion[] = await Promise.all(
    instancias.map(async (i) => {
      const def = i.asignacionMes.definicion;
      let evidenciaUrl: string | null = null;
      if (i.evidenciaPath) {
        try {
          evidenciaUrl = await obtenerUrlFirmadaEvidencia(i.evidenciaPath, 600);
        } catch {
          evidenciaUrl = null;
        }
      }
      return {
        instanciaId: i.id,
        user: i.asignacionMes.user,
        codigo: def.codigo,
        nombre: def.nombre,
        frecuencia: def.frecuencia!,
        semanaDelAnio: i.semanaDelAnio,
        numeroOcurrencia: i.numeroOcurrencia,
        puntosOtorgados: i.puntosOtorgados,
        evidenciaPath: i.evidenciaPath,
        evidenciaTipo: i.evidenciaTipo,
        evidenciaUrl,
        comentarioEmpleado: i.comentarioEmpleado,
        fechaReportado: i.fechaReportado,
        fechaValidado: i.fechaValidado,
      };
    })
  );

  return { items, total: items.length };
}

// ───────────────────────────────────────────────────────────────────
// JEFE: configuracion del mes (KPIs condicionales y cantidad)
// ───────────────────────────────────────────────────────────────────
export type ItemConfiguracion = {
  asignacionMesId: string;
  user: { id: string; nombre: string; apellido: string };
  codigo: string;
  nombre: string;
  frecuencia: "SEMANAL" | "MENSUAL";
  esCondicional: boolean;
  cantidadMaxMes: number | null;
  cantidadMes: number | null;
  noAplica: boolean;
  motivoNoAplica: string | null;
  puntos: number;
};

export async function obtenerConfiguracionMesJefe(
  jefeAreaId: string | null,
  periodoMes: number,
  periodoAnio: number
) {
  if (!jefeAreaId) return { items: [] as ItemConfiguracion[] };

  const asignaciones = await prisma.kpiAsignacionMes.findMany({
    where: {
      periodoMes,
      periodoAnio,
      user: { areaId: jefeAreaId, activo: true },
      OR: [
        { definicion: { esCondicional: true } },
        { definicion: { cantidadMaxMes: { not: null } } },
      ],
    },
    include: {
      definicion: true,
      user: { select: { id: true, nombre: true, apellido: true } },
    },
    orderBy: [{ user: { nombre: "asc" } }, { definicion: { orden: "asc" } }],
  });

  return {
    items: asignaciones.map<ItemConfiguracion>((a) => ({
      asignacionMesId: a.id,
      user: a.user,
      codigo: a.definicion.codigo,
      nombre: a.definicion.nombre,
      frecuencia: a.definicion.frecuencia!,
      esCondicional: a.definicion.esCondicional,
      cantidadMaxMes: a.definicion.cantidadMaxMes,
      cantidadMes: a.cantidadMes,
      noAplica: a.noAplica,
      motivoNoAplica: a.motivoNoAplica,
      puntos: a.definicion.puntosMaxMes ?? 0,
    })),
  };
}
