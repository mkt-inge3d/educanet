"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { obtenerJefeUser } from "@/lib/compromisos/jerarquia";
import { procesarEvento } from "@/lib/gamificacion/motor";
import { recalcularRangoMensual } from "@/lib/gamificacion/rangos";
import {
  subirEvidenciaKpi,
  TIPOS_PERMITIDOS,
  TAMANO_MAX_BYTES,
} from "./evidencia-storage";

type Result = { success: boolean; error?: string; puntos?: number };

// ───────────────────────────────────────────────────────────────────
// EMPLEADO: marcar instancia como Terminado (drip directo, evidencia opcional)
// ───────────────────────────────────────────────────────────────────
export async function marcarTerminado(input: {
  instanciaId: string;
  comentario?: string;
  archivo?: { tipo: string; data: string };
}): Promise<Result> {
  const usuario = await requireAuth();

  const instancia = await prisma.kpiInstancia.findUnique({
    where: { id: input.instanciaId },
    include: {
      asignacionMes: {
        include: { definicion: true, user: true },
      },
    },
  });
  if (!instancia) return { success: false, error: "Instancia no encontrada" };
  if (instancia.asignacionMes.userId !== usuario.id) {
    return { success: false, error: "Esta instancia no es tuya" };
  }
  if (instancia.estado === "APROBADO") {
    return { success: false, error: "Ya esta marcado como terminado" };
  }
  if (instancia.estado === "NO_APLICA") {
    return { success: false, error: "Este KPI esta marcado como No aplica" };
  }
  if (instancia.asignacionMes.noAplica) {
    return { success: false, error: "Este KPI esta marcado como No aplica" };
  }

  let evidenciaPath: string | null = instancia.evidenciaPath;
  let evidenciaTipo: string | null = instancia.evidenciaTipo;

  if (input.archivo) {
    if (!TIPOS_PERMITIDOS.includes(input.archivo.tipo)) {
      return { success: false, error: "Tipo de archivo no permitido" };
    }
    const buffer = Buffer.from(input.archivo.data, "base64");
    if (buffer.byteLength > TAMANO_MAX_BYTES) {
      return { success: false, error: "El archivo supera 5MB" };
    }
    const subida = await subirEvidenciaKpi({
      userId: usuario.id,
      instanciaId: instancia.id,
      buffer,
      tipo: input.archivo.tipo,
    });
    evidenciaPath = subida.path;
    evidenciaTipo = subida.tipo;
  }

  const def = instancia.asignacionMes.definicion;
  const puntos = instancia.asignacionMes.puntosAjustados ?? def.puntos ?? 0;
  if (puntos <= 0) {
    return { success: false, error: "Definicion sin puntos asignados" };
  }

  const resultado = await procesarEvento({
    userId: instancia.asignacionMes.userId,
    tipo: "KPI_HITO_APROBADO",
    fuente: "KPIS",
    puntosBrutos: puntos,
    referenciaId: instancia.id,
    descripcion: `${def.codigo} ${def.nombre}`,
    metadatos: {
      codigo: def.codigo,
      frecuencia: def.frecuencia,
      semanaDelAnio: instancia.semanaDelAnio,
      autoMarcado: true,
    },
  });

  await prisma.kpiInstancia.update({
    where: { id: instancia.id },
    data: {
      estado: "APROBADO",
      evidenciaPath,
      evidenciaTipo,
      comentarioEmpleado: input.comentario ?? null,
      comentarioRevisor: null,
      fechaReportado: new Date(),
      fechaValidado: new Date(),
      puntosOtorgados: resultado.puntosFinales,
      eventoGamificacionId: resultado.eventoId,
    },
  });

  // Notificar al jefe — para revision semanal
  const jefe = await obtenerJefeUser(usuario.id);
  if (jefe) {
    await prisma.notificacion.create({
      data: {
        userId: jefe.id,
        tipo: "SISTEMA",
        titulo: "Hito KPI marcado como terminado",
        mensaje: `${usuario.nombre} marco "${def.nombre}" (${def.codigo})`,
        url: "/mi-equipo/validacion-kpis",
      },
    });
  }

  revalidatePath("/compromisos");
  revalidatePath("/mi-progreso");
  revalidatePath("/mi-equipo/validacion-kpis");
  return { success: true, puntos: resultado.puntosFinales };
}

// ───────────────────────────────────────────────────────────────────
// JEFE: revertir un hito aprobado (lo marca como tarea incompleta)
// Resta los puntos otorgados y borra el evento de gamificacion.
// ───────────────────────────────────────────────────────────────────
export async function revertirAprobado(input: {
  instanciaId: string;
  comentario: string;
}): Promise<Result> {
  const validador = await requireAuth();

  if (!input.comentario || input.comentario.trim().length === 0) {
    return { success: false, error: "Necesitas un comentario para revertir" };
  }

  const instancia = await prisma.kpiInstancia.findUnique({
    where: { id: input.instanciaId },
    include: {
      asignacionMes: {
        include: { definicion: true, user: true },
      },
    },
  });
  if (!instancia) return { success: false, error: "Instancia no encontrada" };
  if (instancia.estado !== "APROBADO") {
    return {
      success: false,
      error: "Solo se pueden revertir hitos aprobados",
    };
  }

  const esAdmin =
    validador.rol === "ADMIN" || validador.rol === "RRHH";
  if (!esAdmin) {
    const jefe = await obtenerJefeUser(instancia.asignacionMes.userId);
    if (!jefe || jefe.id !== validador.id) {
      return { success: false, error: "Solo el jefe puede revertir" };
    }
  }

  const puntosARestar = instancia.puntosOtorgados;
  const eventoId = instancia.eventoGamificacionId;

  await prisma.$transaction(async (tx) => {
    if (eventoId) {
      await tx.eventoGamificacion.deleteMany({ where: { id: eventoId } });
    }
    await tx.transaccionPuntos.deleteMany({
      where: { referenciaId: instancia.id },
    });
    if (puntosARestar > 0) {
      await tx.user.update({
        where: { id: instancia.asignacionMes.userId },
        data: { puntosTotales: { decrement: puntosARestar } },
      });
    }
    await tx.kpiInstancia.update({
      where: { id: instancia.id },
      data: {
        estado: "RECHAZADO",
        validadoPorId: validador.id,
        fechaValidado: new Date(),
        comentarioRevisor: input.comentario.trim(),
        puntosOtorgados: 0,
        eventoGamificacionId: null,
      },
    });
  });

  // Recalcular rango mensual del empleado
  const fecha = instancia.fechaValidado ?? new Date();
  await recalcularRangoMensual(
    instancia.asignacionMes.userId,
    fecha.getMonth() + 1,
    fecha.getFullYear()
  );

  await prisma.notificacion.create({
    data: {
      userId: instancia.asignacionMes.userId,
      tipo: "SISTEMA",
      titulo: "Hito devuelto como tarea incompleta",
      mensaje: `${instancia.asignacionMes.definicion.codigo}: ${input.comentario.trim()}`,
      url: "/compromisos",
    },
  });

  revalidatePath("/compromisos");
  revalidatePath("/mi-progreso");
  revalidatePath("/mi-equipo/validacion-kpis");
  return { success: true };
}

// ───────────────────────────────────────────────────────────────────
// EMPLEADO: reportar instancia (con o sin evidencia)
// ───────────────────────────────────────────────────────────────────
export async function reportarInstancia(input: {
  instanciaId: string;
  comentario?: string;
  archivo?: { tipo: string; data: string }; // base64
}): Promise<Result> {
  const usuario = await requireAuth();

  const instancia = await prisma.kpiInstancia.findUnique({
    where: { id: input.instanciaId },
    include: {
      asignacionMes: {
        include: { definicion: true, user: true },
      },
    },
  });
  if (!instancia) return { success: false, error: "Instancia no encontrada" };
  if (instancia.asignacionMes.userId !== usuario.id) {
    return { success: false, error: "Esta instancia no es tuya" };
  }
  if (instancia.estado !== "PENDIENTE" && instancia.estado !== "RECHAZADO") {
    return {
      success: false,
      error: "Solo puedes reportar hitos pendientes o rechazados",
    };
  }
  if (instancia.asignacionMes.noAplica) {
    return { success: false, error: "Este KPI esta marcado como No aplica" };
  }

  let evidenciaPath: string | null = instancia.evidenciaPath;
  let evidenciaTipo: string | null = instancia.evidenciaTipo;

  if (input.archivo) {
    if (!TIPOS_PERMITIDOS.includes(input.archivo.tipo)) {
      return { success: false, error: "Tipo de archivo no permitido" };
    }
    const buffer = Buffer.from(input.archivo.data, "base64");
    if (buffer.byteLength > TAMANO_MAX_BYTES) {
      return { success: false, error: "El archivo supera 5MB" };
    }
    const subida = await subirEvidenciaKpi({
      userId: usuario.id,
      instanciaId: instancia.id,
      buffer,
      tipo: input.archivo.tipo,
    });
    evidenciaPath = subida.path;
    evidenciaTipo = subida.tipo;
  }

  if (
    instancia.asignacionMes.definicion.requiereEvidencia &&
    !evidenciaPath
  ) {
    return {
      success: false,
      error: "Este hito requiere evidencia para ser reportado",
    };
  }

  await prisma.kpiInstancia.update({
    where: { id: instancia.id },
    data: {
      estado: "EN_REVISION",
      evidenciaPath,
      evidenciaTipo,
      comentarioEmpleado: input.comentario ?? null,
      fechaReportado: new Date(),
      // Limpiar comentario previo del revisor en caso de reenvio
      comentarioRevisor: null,
    },
  });

  // Notificar al jefe
  const jefe = await obtenerJefeUser(usuario.id);
  if (jefe) {
    await prisma.notificacion.create({
      data: {
        userId: jefe.id,
        tipo: "SISTEMA",
        titulo: "KPI pendiente de revision",
        mensaje: `${usuario.nombre} reporto "${instancia.asignacionMes.definicion.nombre}"`,
        url: "/mi-equipo/validacion-kpis",
      },
    });
  }

  revalidatePath("/mi-progreso/kpis");
  revalidatePath("/mi-equipo/validacion-kpis");
  return { success: true };
}

// ───────────────────────────────────────────────────────────────────
// JEFE: validar instancia (aprobar/rechazar)
// ───────────────────────────────────────────────────────────────────
export async function validarInstancia(input: {
  instanciaId: string;
  aprobar: boolean;
  comentario?: string;
}): Promise<Result> {
  const validador = await requireAuth();

  const instancia = await prisma.kpiInstancia.findUnique({
    where: { id: input.instanciaId },
    include: {
      asignacionMes: {
        include: { definicion: true, user: true },
      },
    },
  });
  if (!instancia) return { success: false, error: "Instancia no encontrada" };
  if (instancia.estado !== "EN_REVISION") {
    return { success: false, error: "No hay nada que validar en este estado" };
  }

  const esAdmin =
    validador.rol === "ADMIN" || validador.rol === "RRHH";
  if (!esAdmin) {
    const jefe = await obtenerJefeUser(instancia.asignacionMes.userId);
    if (!jefe || jefe.id !== validador.id) {
      return { success: false, error: "Solo el jefe puede validar" };
    }
  }

  if (input.aprobar) {
    const def = instancia.asignacionMes.definicion;
    const puntos =
      instancia.asignacionMes.puntosAjustados ?? def.puntos ?? 0;

    if (puntos <= 0) {
      return { success: false, error: "Definicion sin puntos asignados" };
    }

    const resultado = await procesarEvento({
      userId: instancia.asignacionMes.userId,
      tipo: "KPI_HITO_APROBADO",
      fuente: "KPIS",
      puntosBrutos: puntos,
      referenciaId: instancia.id,
      descripcion: `${def.codigo} ${def.nombre}`,
      metadatos: {
        codigo: def.codigo,
        frecuencia: def.frecuencia,
        semanaDelAnio: instancia.semanaDelAnio,
      },
    });

    await prisma.kpiInstancia.update({
      where: { id: instancia.id },
      data: {
        estado: "APROBADO",
        validadoPorId: validador.id,
        fechaValidado: new Date(),
        comentarioRevisor: input.comentario ?? null,
        puntosOtorgados: resultado.puntosFinales,
        eventoGamificacionId: resultado.eventoId,
      },
    });

    await prisma.notificacion.create({
      data: {
        userId: instancia.asignacionMes.userId,
        tipo: "LOGRO",
        titulo: `+${resultado.puntosFinales} pts`,
        mensaje: `${def.codigo} validado: ${def.nombre}`,
        url: "/mi-progreso/kpis",
      },
    });

    revalidatePath("/mi-progreso/kpis");
    revalidatePath("/mi-equipo/validacion-kpis");
    return { success: true, puntos: resultado.puntosFinales };
  } else {
    if (!input.comentario || input.comentario.trim().length === 0) {
      return {
        success: false,
        error: "Necesitas un comentario para rechazar",
      };
    }
    await prisma.kpiInstancia.update({
      where: { id: instancia.id },
      data: {
        estado: "RECHAZADO",
        validadoPorId: validador.id,
        fechaValidado: new Date(),
        comentarioRevisor: input.comentario,
      },
    });

    await prisma.notificacion.create({
      data: {
        userId: instancia.asignacionMes.userId,
        tipo: "SISTEMA",
        titulo: "KPI no validado",
        mensaje: `${instancia.asignacionMes.definicion.codigo}: ${input.comentario}`,
        url: "/mi-progreso/kpis",
      },
    });

    revalidatePath("/mi-progreso/kpis");
    revalidatePath("/mi-equipo/validacion-kpis");
    return { success: true };
  }
}

// ───────────────────────────────────────────────────────────────────
// JEFE: marcar "No aplica" + redistribuir
// ───────────────────────────────────────────────────────────────────
export async function marcarNoAplica(input: {
  asignacionMesId: string;
  motivo: string;
}): Promise<Result> {
  const validador = await requireAuth();

  const asig = await prisma.kpiAsignacionMes.findUnique({
    where: { id: input.asignacionMesId },
    include: { definicion: true, user: true },
  });
  if (!asig) return { success: false, error: "Asignacion no encontrada" };
  if (asig.noAplica)
    return { success: false, error: "Ya esta marcada como No aplica" };
  if (!asig.definicion.esCondicional) {
    return {
      success: false,
      error: "Solo los KPIs condicionales pueden marcarse No aplica",
    };
  }

  const esAdmin =
    validador.rol === "ADMIN" || validador.rol === "RRHH";
  if (!esAdmin) {
    const jefe = await obtenerJefeUser(asig.userId);
    if (!jefe || jefe.id !== validador.id) {
      return { success: false, error: "Solo el jefe puede configurar" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.kpiAsignacionMes.update({
      where: { id: asig.id },
      data: {
        noAplica: true,
        motivoNoAplica: input.motivo,
        configuradoPorId: validador.id,
        configuradoEn: new Date(),
      },
    });
    await tx.kpiInstancia.updateMany({
      where: {
        asignacionMesId: asig.id,
        estado: { in: ["PENDIENTE", "EN_REVISION", "RECHAZADO"] },
      },
      data: { estado: "NO_APLICA" },
    });
  });

  await recalcularRedistribucion({
    userId: asig.userId,
    periodoMes: asig.periodoMes,
    periodoAnio: asig.periodoAnio,
    frecuencia: asig.definicion.frecuencia!,
  });

  revalidatePath("/mi-progreso/kpis");
  revalidatePath("/mi-equipo/validacion-kpis");
  return { success: true };
}

// Recalcula puntosAjustados desde cero para todos los KPIs de un usuario
// en un mes y frecuencia dada. Idempotente.
async function recalcularRedistribucion(input: {
  userId: string;
  periodoMes: number;
  periodoAnio: number;
  frecuencia: "SEMANAL" | "MENSUAL";
}): Promise<void> {
  const todas = await prisma.kpiAsignacionMes.findMany({
    where: {
      userId: input.userId,
      periodoMes: input.periodoMes,
      periodoAnio: input.periodoAnio,
      definicion: { frecuencia: input.frecuencia, activa: true },
    },
    include: { definicion: true },
  });

  const inactivas = todas.filter((a) => a.noAplica);
  const activas = todas.filter((a) => !a.noAplica);

  const puntosARedistribuir = inactivas.reduce(
    (acc, a) => acc + (a.definicion.puntosMaxMes ?? 0),
    0
  );
  const sumaPesos = activas.reduce(
    (acc, a) => acc + (a.definicion.puntosMaxMes ?? 0),
    0
  );

  for (const a of activas) {
    const puntosBase = a.definicion.puntos ?? 0;
    if (puntosARedistribuir === 0 || sumaPesos === 0) {
      // Sin redistribucion → limpiar ajuste
      await prisma.kpiAsignacionMes.update({
        where: { id: a.id },
        data: { puntosAjustados: null },
      });
      continue;
    }
    const peso = a.definicion.puntosMaxMes ?? 0;
    const bonusMes = Math.round((puntosARedistribuir * peso) / sumaPesos);
    const bonusPorAprobacion =
      a.definicion.frecuencia === "SEMANAL"
        ? Math.round(bonusMes / 4)
        : bonusMes;
    await prisma.kpiAsignacionMes.update({
      where: { id: a.id },
      data: { puntosAjustados: puntosBase + bonusPorAprobacion },
    });
  }
}

// ───────────────────────────────────────────────────────────────────
// JEFE: revertir "No aplica"
// ───────────────────────────────────────────────────────────────────
export async function revertirNoAplica(input: {
  asignacionMesId: string;
}): Promise<Result> {
  const validador = await requireAuth();
  const asig = await prisma.kpiAsignacionMes.findUnique({
    where: { id: input.asignacionMesId },
    include: { definicion: true },
  });
  if (!asig) return { success: false, error: "Asignacion no encontrada" };
  if (!asig.noAplica)
    return { success: false, error: "No esta marcada como No aplica" };

  const esAdmin =
    validador.rol === "ADMIN" || validador.rol === "RRHH";
  if (!esAdmin) {
    const jefe = await obtenerJefeUser(asig.userId);
    if (!jefe || jefe.id !== validador.id) {
      return { success: false, error: "Solo el jefe puede configurar" };
    }
  }

  await prisma.kpiAsignacionMes.update({
    where: { id: asig.id },
    data: {
      noAplica: false,
      motivoNoAplica: null,
      configuradoPorId: validador.id,
      configuradoEn: new Date(),
    },
  });

  await recalcularRedistribucion({
    userId: asig.userId,
    periodoMes: asig.periodoMes,
    periodoAnio: asig.periodoAnio,
    frecuencia: asig.definicion.frecuencia!,
  });

  revalidatePath("/mi-progreso/kpis");
  revalidatePath("/mi-equipo/validacion-kpis");
  return { success: true };
}

// ───────────────────────────────────────────────────────────────────
// JEFE: configurar cantidadMes para condicionales (P-04 webinars)
// ───────────────────────────────────────────────────────────────────
export async function configurarCantidadMes(input: {
  asignacionMesId: string;
  cantidad: number;
}): Promise<Result> {
  const validador = await requireAuth();
  const asig = await prisma.kpiAsignacionMes.findUnique({
    where: { id: input.asignacionMesId },
    include: { definicion: true },
  });
  if (!asig) return { success: false, error: "Asignacion no encontrada" };
  if (!asig.definicion.cantidadMaxMes) {
    return {
      success: false,
      error: "Este KPI no soporta configurar cantidad",
    };
  }
  if (input.cantidad < 0 || input.cantidad > asig.definicion.cantidadMaxMes) {
    return {
      success: false,
      error: `Cantidad debe estar entre 0 y ${asig.definicion.cantidadMaxMes}`,
    };
  }

  const esAdmin =
    validador.rol === "ADMIN" || validador.rol === "RRHH";
  if (!esAdmin) {
    const jefe = await obtenerJefeUser(asig.userId);
    if (!jefe || jefe.id !== validador.id) {
      return { success: false, error: "Solo el jefe puede configurar" };
    }
  }

  await prisma.kpiAsignacionMes.update({
    where: { id: asig.id },
    data: {
      cantidadMes: input.cantidad,
      configuradoPorId: validador.id,
      configuradoEn: new Date(),
    },
  });

  revalidatePath("/mi-equipo/validacion-kpis");
  return { success: true };
}
