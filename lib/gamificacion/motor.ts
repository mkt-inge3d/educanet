import { prisma } from "@/lib/prisma";
import type {
  TipoEventoGamificacion,
  FuenteXP,
  RazonPuntos,
  Prisma,
} from "@prisma/client";
import { getMes, getAnio } from "./periodo";
import { ajustarPuntos } from "./multiplicadores";
import { recalcularRangoMensual } from "./rangos";

export type EventoInput = {
  userId: string;
  tipo: TipoEventoGamificacion;
  fuente: FuenteXP;
  puntosBrutos: number;
  metadatos?: Prisma.InputJsonValue;
  referenciaId?: string;
  fecha?: Date;
  descripcion?: string;
};

export type ResultadoEvento = {
  eventoId: string;
  puntosBrutos: number;
  puntosFinales: number;
  fueModificado: boolean;
  razonModificacion?: string;
  nuevoTotalMes: number;
  rangoActual: string;
  subioDeRango: boolean;
  nuevoRango?: string;
};

const MAPA_TIPO_RAZON: Partial<Record<TipoEventoGamificacion, RazonPuntos>> = {
  LECCION_COMPLETADA: "COMPLETAR_LECCION",
  CURSO_COMPLETADO: "COMPLETAR_CURSO",
  QUIZ_APROBADO: "APROBAR_QUIZ",
  QUIZ_PERFECTO: "APROBAR_QUIZ",
  RACHA_INCREMENTADA: "RACHA_DIAS",
  BADGE_OBTENIDO: "LOGRO_OBJETIVO",
  SUBIDA_NIVEL: "SUBIDA_NIVEL",
  LIKE_RECIBIDO: "LIKE_RECIBIDO",
  KPI_MES_CUMPLIDO: "LOGRO_OBJETIVO",
  KPIS_MES_TOTAL: "LOGRO_OBJETIVO",
  KPI_HITO_APROBADO: "LOGRO_OBJETIVO",
  COMPROMISO_CUMPLIDO: "LOGRO_OBJETIVO",
  RECONOCIMIENTO_RECIBIDO: "LOGRO_OBJETIVO",
  MISION_COMPLETADA: "LOGRO_OBJETIVO",
  BONUS_EQUIPO: "LOGRO_OBJETIVO",
  AJUSTE_ADMIN: "AJUSTE_ADMIN",
};

function descripcionDefault(ev: EventoInput): string {
  if (ev.descripcion) return ev.descripcion;
  const mapa: Record<TipoEventoGamificacion, string> = {
    LECCION_COMPLETADA: "Leccion completada",
    CURSO_COMPLETADO: "Curso completado",
    QUIZ_APROBADO: "Quiz aprobado",
    QUIZ_PERFECTO: "Quiz perfecto",
    RACHA_INCREMENTADA: "Racha diaria incrementada",
    BADGE_OBTENIDO: "Badge obtenido",
    SUBIDA_NIVEL: "Subida de nivel",
    LIKE_RECIBIDO: "Like recibido en tu comentario",
    KPI_MES_CUMPLIDO: "KPI del mes cumplido",
    KPIS_MES_TOTAL: "Cierre de KPIs del mes",
    KPI_HITO_APROBADO: "Hito KPI validado por tu jefe",
    COMPROMISO_CUMPLIDO: "Compromiso cumplido",
    RECONOCIMIENTO_RECIBIDO: "Reconocimiento recibido",
    MISION_COMPLETADA: "Mision completada",
    BONUS_EQUIPO: "Bonus de equipo",
    AJUSTE_ADMIN: "Ajuste administrativo",
  };
  return mapa[ev.tipo];
}

async function crearNotificacionSubidaRango(userId: string, rango: string) {
  await prisma.notificacion.create({
    data: {
      userId,
      tipo: "LOGRO",
      titulo: `Subiste a rango ${rango}!`,
      mensaje: "Tu desempeno del mes te llevo a un nuevo rango. Sigue asi.",
      url: "/mi-progreso",
    },
  });
}

/**
 * Funcion central. Todo punto que se otorgue debe pasar por aqui.
 * Aplica topes mensuales y multiplicador, registra el evento,
 * actualiza total historico y recalcula el rango del mes.
 */
export async function procesarEvento(
  evento: EventoInput
): Promise<ResultadoEvento> {
  const fecha = evento.fecha ?? new Date();
  const mes = getMes(fecha);
  const anio = getAnio(fecha);

  const ajuste = await ajustarPuntos({
    userId: evento.userId,
    fuente: evento.fuente,
    puntosBrutos: evento.puntosBrutos,
    mes,
    anio,
  });

  const eventoRegistrado = await prisma.eventoGamificacion.create({
    data: {
      userId: evento.userId,
      tipo: evento.tipo,
      fuente: evento.fuente,
      cantidad: ajuste.puntosFinales,
      cantidadBruta: evento.puntosBrutos,
      metadatos: evento.metadatos,
      referenciaId: evento.referenciaId,
      mesPeriodo: mes,
      anioPeriodo: anio,
      createdAt: fecha,
    },
  });

  if (ajuste.puntosFinales > 0) {
    await prisma.$transaction([
      prisma.transaccionPuntos.create({
        data: {
          userId: evento.userId,
          cantidad: ajuste.puntosFinales,
          razon: MAPA_TIPO_RAZON[evento.tipo] ?? "AJUSTE_ADMIN",
          descripcion: descripcionDefault(evento),
          referenciaId: evento.referenciaId,
          fecha,
        },
      }),
      prisma.user.update({
        where: { id: evento.userId },
        data: { puntosTotales: { increment: ajuste.puntosFinales } },
      }),
    ]);
  }

  const rangoActualizado = await recalcularRangoMensual(
    evento.userId,
    mes,
    anio
  );

  if (rangoActualizado.subioDeRango && rangoActualizado.nuevoRango) {
    await crearNotificacionSubidaRango(
      evento.userId,
      rangoActualizado.nuevoRango
    );
  }

  // Hook de misiones: actualiza progreso segun el evento recien registrado.
  // No bloquea el flujo si falla.
  try {
    const { verificarMisionesTrasEvento } = await import(
      "@/lib/misiones/hooks"
    );
    await verificarMisionesTrasEvento({
      userId: evento.userId,
      tipoEvento: evento.tipo,
      referenciaId: evento.referenciaId,
    });
  } catch {
    // silencioso
  }

  return {
    eventoId: eventoRegistrado.id,
    puntosBrutos: evento.puntosBrutos,
    puntosFinales: ajuste.puntosFinales,
    fueModificado: ajuste.fueModificado,
    razonModificacion: ajuste.razon,
    nuevoTotalMes: rangoActualizado.puntosTotales,
    rangoActual: rangoActualizado.rango,
    subioDeRango: rangoActualizado.subioDeRango,
    nuevoRango: rangoActualizado.nuevoRango,
  };
}
