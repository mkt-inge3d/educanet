"use server";

import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { procesarEvento } from "@/lib/gamificacion/motor";
import { getSemanaISO } from "@/lib/gamificacion/periodo";

import {
  crearWorkflowDesdeTemplate,
  desbloquearTareasDependientes,
  type CrearWorkflowInput,
} from "./workflow-generator";
import {
  calcularPuntosProrrateados,
  datosTarea,
  esJefeDelArea,
} from "./helpers";

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const PUNTOS_RECONOCIMIENTO_AYUDA_CRUZADA = 15;

/**
 * Carga una tarea y verifica permisos. Permitidos: el asignado, el
 * ejecutor por ayuda cruzada, admin/RRHH, y el jefe del área del asignado.
 *
 * @param opts.onlyOwner - si true, restringe a propietario/ejecutor (para
 *                        acciones destructivas como `completar` o `iniciar`).
 */
async function cargarTareaConPermiso(
  tareaId: string,
  userId: string,
  opts: { onlyOwner?: boolean } = {},
) {
  const tarea = await prisma.tareaInstancia.findUnique({
    where: { id: tareaId },
    include: {
      catalogoTarea: true,
      workflowInstancia: { select: { nombre: true, responsableGeneralId: true } },
    },
  });
  if (!tarea) throw new Error("Tarea no encontrada");

  // Propietario (asignado) o ejecutor por ayuda cruzada
  if (
    tarea.asignadoAId === userId ||
    tarea.ejecutadaRealmenteId === userId
  ) {
    return tarea;
  }

  if (opts.onlyOwner) {
    throw new Error("No tienes permiso sobre esta tarea");
  }

  // Admin / RRHH / jefe del área
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      rol: true,
      areaId: true,
      puesto: { select: { nombre: true } },
    },
  });

  if (user?.rol === "ADMIN" || user?.rol === "RRHH") return tarea;

  if (user?.puesto?.nombre?.startsWith("Jefe") && user.areaId) {
    const asignado = await prisma.user.findUnique({
      where: { id: tarea.asignadoAId },
      select: { areaId: true },
    });
    if (asignado?.areaId === user.areaId) return tarea;
  }

  throw new Error("No tienes permiso sobre esta tarea");
}


export async function iniciarTarea(tareaId: string): Promise<Result> {
  try {
    const user = await requireAuth();
    const tarea = await cargarTareaConPermiso(tareaId, user.id, { onlyOwner: true });

    if (tarea.estado !== "PENDIENTE") {
      return { success: false, error: "La tarea no está pendiente" };
    }

    await prisma.tareaInstancia.update({
      where: { id: tareaId },
      data: { estado: "EN_PROGRESO", fechaInicioReal: new Date() },
    });
    revalidatePath("/tareas");
    revalidatePath(`/tareas/${tareaId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function marcarChecklistItem(input: {
  tareaId: string;
  itemPlantillaId: string;
  marcado: boolean;
  notaRapida?: string;
}): Promise<Result> {
  try {
    const user = await requireAuth();
    await cargarTareaConPermiso(input.tareaId, user.id);

    await prisma.checklistItemMarcado.upsert({
      where: {
        tareaInstanciaId_plantillaItemId: {
          tareaInstanciaId: input.tareaId,
          plantillaItemId: input.itemPlantillaId,
        },
      },
      create: {
        tareaInstanciaId: input.tareaId,
        plantillaItemId: input.itemPlantillaId,
        marcado: input.marcado,
        marcadoEn: input.marcado ? new Date() : null,
        notaRapida: input.notaRapida,
      },
      update: {
        marcado: input.marcado,
        marcadoEn: input.marcado ? new Date() : null,
        notaRapida: input.notaRapida,
      },
    });

    revalidatePath(`/tareas/${input.tareaId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Editar el texto de un paso del checklist — override local en la instancia.
 * No muta la plantilla del catálogo. String vacío quita el override.
 */
export async function editarChecklistItemTexto(input: {
  tareaId: string;
  itemPlantillaId: string;
  descripcion: string;
}): Promise<Result> {
  try {
    const user = await requireAuth();
    const tarea = await cargarTareaConPermiso(input.tareaId, user.id);
    if (tarea.estado === "COMPLETADA" || tarea.estado === "OMITIDA") {
      return { success: false, error: "No se puede editar una tarea cerrada" };
    }

    const texto = input.descripcion.trim();
    const override = texto.length > 0 ? texto : null;

    await prisma.checklistItemMarcado.upsert({
      where: {
        tareaInstanciaId_plantillaItemId: {
          tareaInstanciaId: input.tareaId,
          plantillaItemId: input.itemPlantillaId,
        },
      },
      create: {
        tareaInstanciaId: input.tareaId,
        plantillaItemId: input.itemPlantillaId,
        marcado: false,
        descripcionOverride: override,
      },
      update: { descripcionOverride: override },
    });

    revalidatePath("/tareas");
    revalidatePath(`/tareas/${input.tareaId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function reportarBloqueoExterno(input: {
  tareaId: string;
  responsable: string;
  motivo: string;
  fechaInicioBloqueo?: Date;
}): Promise<Result> {
  try {
    const user = await requireAuth();
    const tarea = await cargarTareaConPermiso(input.tareaId, user.id, { onlyOwner: true });
    const datos = datosTarea(tarea);

    if (tarea.estado === "COMPLETADA" || tarea.estado === "OMITIDA") {
      return { success: false, error: "No se puede bloquear una tarea cerrada" };
    }

    await prisma.tareaInstancia.update({
      where: { id: input.tareaId },
      data: {
        estado: "BLOQUEADA",
        bloqueoExternoDesde: input.fechaInicioBloqueo ?? new Date(),
        bloqueoExternoResponsable: input.responsable,
        bloqueoExternoMotivo: input.motivo,
      },
    });

    if (tarea.workflowInstancia?.responsableGeneralId) {
      await prisma.notificacion.create({
        data: {
          userId: tarea.workflowInstancia.responsableGeneralId,
          tipo: "SISTEMA",
          titulo: "Tarea bloqueada por tercero",
          mensaje: `${user.nombre} reportó bloqueo en "${datos.nombre}": ${input.motivo} (esperando a ${input.responsable})`,
          url: `/mi-equipo?bloqueo=${input.tareaId}`,
        },
      });
    }

    revalidatePath("/tareas");
    revalidatePath(`/tareas/${input.tareaId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function desbloquearTarea(tareaId: string): Promise<Result> {
  try {
    const user = await requireAuth();
    const tarea = await cargarTareaConPermiso(tareaId, user.id, { onlyOwner: true });

    if (tarea.estado !== "BLOQUEADA") {
      return { success: false, error: "La tarea no está bloqueada" };
    }

    await prisma.tareaInstancia.update({
      where: { id: tareaId },
      data: {
        estado: tarea.fechaInicioReal ? "EN_PROGRESO" : "PENDIENTE",
        bloqueoExternoHasta: new Date(),
      },
    });

    revalidatePath("/tareas");
    revalidatePath(`/tareas/${tareaId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function completarTarea(input: {
  tareaId: string;
  tiempoInvertidoMin: number;
  calidadAutoeval?: number;
  notasEjecutor?: string;
  ayudaCruzada?: {
    ejecutadaRealmenteId: string;
    motivoAyuda: string;
  };
}): Promise<
  Result<{
    puntosOtorgados: number;
    puntosBrutos: number;
    factorProrrateo: number;
    puntosATiempo: boolean;
    requiereValidacion: boolean;
  }>
> {
  try {
    const user = await requireAuth();
    const tarea = await cargarTareaConPermiso(input.tareaId, user.id, { onlyOwner: true });
    const datos = datosTarea(tarea);

    if (tarea.estado === "COMPLETADA") {
      return { success: false, error: "La tarea ya está completada" };
    }

    // Verificar checklist obligatorio completo (sólo si tiene catálogo)
    if (tarea.catalogoTareaId) {
      const itemsObligatorios = await prisma.checklistItemPlantilla.findMany({
        where: { catalogoTareaId: tarea.catalogoTareaId, obligatorio: true },
        select: { id: true },
      });
      if (itemsObligatorios.length > 0) {
        const marcados = await prisma.checklistItemMarcado.findMany({
          where: {
            tareaInstanciaId: input.tareaId,
            marcado: true,
            plantillaItemId: { in: itemsObligatorios.map((i) => i.id) },
          },
          select: { plantillaItemId: true },
        });
        if (marcados.length < itemsObligatorios.length) {
          return {
            success: false,
            error: `Faltan ${itemsObligatorios.length - marcados.length} pasos obligatorios del checklist`,
          };
        }
      }
    }

    // Calcular puntos brutos (base + bonus)
    let puntosBrutos = datos.puntosBase;
    const puntosATiempo =
      input.tiempoInvertidoMin >= datos.tiempoMinimoMin &&
      input.tiempoInvertidoMin <= datos.tiempoMaximoMin;
    if (puntosATiempo) puntosBrutos += datos.bonusATiempo;

    // Bonus desbloqueo: solo aplica a tareas del catálogo con dependientes
    let bonusDesbloqueo = false;
    if (tarea.catalogoTareaId) {
      const tieneDependientes = await prisma.dependenciaTarea.count({
        where: {
          tareaOrigenId: tarea.catalogoTareaId,
          tipoDependencia: "FIN_A_INICIO",
        },
      });
      bonusDesbloqueo = tieneDependientes > 0;
      if (bonusDesbloqueo) puntosBrutos += datos.bonusDesbloqueo;
    }

    // Receptor de puntos (ayuda cruzada)
    const receptorPuntos =
      input.ayudaCruzada?.ejecutadaRealmenteId ?? tarea.asignadoAId;
    const ayudaCruzadaEsValida =
      !!input.ayudaCruzada &&
      input.ayudaCruzada.ejecutadaRealmenteId !== tarea.asignadoAId;

    // ¿Requiere validación del jefe? (tareas ad-hoc del empleado)
    const requiereValidacion =
      tarea.requiereValidacionJefe && !tarea.validadaEn;

    if (requiereValidacion) {
      // Guardar datos pero NO otorgar puntos al motor todavía
      await prisma.tareaInstancia.update({
        where: { id: input.tareaId },
        data: {
          estado: "EN_REVISION",
          completadaEn: new Date(),
          fechaFinReal: new Date(),
          tiempoInvertidoMin: input.tiempoInvertidoMin,
          calidadAutoeval: input.calidadAutoeval,
          notasEjecutor: input.notasEjecutor,
          ejecutadaPorOtro: ayudaCruzadaEsValida,
          ejecutadaRealmenteId: ayudaCruzadaEsValida
            ? input.ayudaCruzada!.ejecutadaRealmenteId
            : null,
          motivoAyuda: ayudaCruzadaEsValida
            ? input.ayudaCruzada!.motivoAyuda
            : null,
          puntosBrutos,
          puntosATiempo,
          puntosDesbloqueo: bonusDesbloqueo,
        },
      });

      // Notificar al jefe (responsable general del workflow o jefe del área)
      const jefeDelArea = await prisma.user.findFirst({
        where: {
          areaId: user.areaId,
          puesto: { nombre: { startsWith: "Jefe" } },
        },
        select: { id: true },
      });
      if (jefeDelArea) {
        await prisma.notificacion.create({
          data: {
            userId: jefeDelArea.id,
            tipo: "SISTEMA",
            titulo: "Tarea ad-hoc por validar",
            mensaje: `${user.nombre} completó "${datos.nombre}" (${puntosBrutos} pts brutos). Revisá y validá.`,
            url: `/mi-equipo/${user.id}`,
          },
        });
      }

      revalidatePath("/tareas");
      revalidatePath(`/tareas/${input.tareaId}`);
      revalidatePath("/mi-equipo");

      return {
        success: true,
        data: {
          puntosOtorgados: 0,
          puntosBrutos,
          factorProrrateo: 1,
          puntosATiempo,
          requiereValidacion: true,
        },
      };
    }

    // Flujo normal: calcular prorrateo y otorgar puntos
    const { puntosProrrateados, factorProrrateo } = await calcularPuntosProrrateados(
      receptorPuntos,
      puntosBrutos,
      { excluirTareaId: input.tareaId },
    );

    await prisma.tareaInstancia.update({
      where: { id: input.tareaId },
      data: {
        estado: "COMPLETADA",
        completadaEn: new Date(),
        fechaFinReal: new Date(),
        tiempoInvertidoMin: input.tiempoInvertidoMin,
        calidadAutoeval: input.calidadAutoeval,
        notasEjecutor: input.notasEjecutor,
        ejecutadaPorOtro: ayudaCruzadaEsValida,
        ejecutadaRealmenteId: ayudaCruzadaEsValida
          ? input.ayudaCruzada!.ejecutadaRealmenteId
          : null,
        motivoAyuda: ayudaCruzadaEsValida
          ? input.ayudaCruzada!.motivoAyuda
          : null,
        puntosBrutos,
        puntosOtorgados: puntosProrrateados,
        factorProrrateo,
        puntosATiempo,
        puntosDesbloqueo: bonusDesbloqueo,
      },
    });

    // Motor central
    await procesarEvento({
      userId: receptorPuntos,
      tipo: "COMPROMISO_CUMPLIDO",
      fuente: "COMPROMISOS",
      puntosBrutos: puntosProrrateados,
      metadatos: {
        origen: "tarea_operativa",
        tareaCodigo: tarea.catalogoTarea?.codigo ?? "ADHOC",
        tareaNombre: datos.nombre,
        categoria: datos.categoria,
        workflow: tarea.workflowInstancia?.nombre ?? null,
        esAdHoc: datos.esAdHoc,
        tiempoInvertidoMin: input.tiempoInvertidoMin,
        tiempoEstimadoMin: `${datos.tiempoMinimoMin}-${datos.tiempoMaximoMin}`,
        aTiempo: puntosATiempo,
        bonusDesbloqueo,
        ayudaCruzada: ayudaCruzadaEsValida,
        puntosBrutos,
        puntosProrrateados,
        factorProrrateo,
      },
      referenciaId: input.tareaId,
      descripcion: `Tarea completada: ${datos.nombre}`,
    });

    // Reconocimiento automático por ayuda cruzada
    if (ayudaCruzadaEsValida && input.ayudaCruzada) {
      try {
        const catColaboracion = await prisma.categoriaReconocimiento.findUnique({
          where: { codigo: "COLABORACION" },
        });
        if (catColaboracion) {
          const { semana, anio } = getSemanaISO(new Date());
          await prisma.reconocimiento.create({
            data: {
              nominadorId: tarea.asignadoAId,
              reconocidoId: input.ayudaCruzada.ejecutadaRealmenteId,
              categoriaId: catColaboracion.id,
              mensaje: `Ayuda operativa: ${input.ayudaCruzada.motivoAyuda}. Ejecutó "${datos.nombre}"${tarea.workflowInstancia ? ` en "${tarea.workflowInstancia.nombre}"` : ""}.`,
              semanaDelAnio: semana,
              anio,
              puntosOtorgados: PUNTOS_RECONOCIMIENTO_AYUDA_CRUZADA,
              visibilidad: "PUBLICO",
            },
          });

          await procesarEvento({
            userId: input.ayudaCruzada.ejecutadaRealmenteId,
            tipo: "RECONOCIMIENTO_RECIBIDO",
            fuente: "RECONOCIMIENTOS",
            puntosBrutos: PUNTOS_RECONOCIMIENTO_AYUDA_CRUZADA,
            metadatos: { origen: "ayuda_cruzada_automatica" },
            referenciaId: input.tareaId,
            descripcion: "Reconocimiento por ayuda cruzada",
          });
        }
      } catch (e) {
        console.error("No se pudo crear reconocimiento automático:", e);
      }
    }

    await desbloquearTareasDependientes(input.tareaId);

    revalidatePath("/tareas");
    revalidatePath("/mi-progreso");
    revalidatePath(`/tareas/${input.tareaId}`);
    revalidatePath("/mi-equipo");

    return {
      success: true,
      data: {
        puntosOtorgados: puntosProrrateados,
        puntosBrutos,
        factorProrrateo,
        puntosATiempo,
        requiereValidacion: false,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ============================================================================
// Nueva API para jefe: asignar tarea directamente (con o sin catálogo)
// ============================================================================
export async function asignarTareaDirecta(input: {
  asignadoAId: string;
  catalogoTareaId?: string;
  // Si no hay catalogoTareaId, son required:
  nombreAdHoc?: string;
  descripcionAdHoc?: string;
  puntosBaseAdHoc?: number;
  tiempoEstimadoMinAdHoc?: number;
  tiempoEstimadoMaxAdHoc?: number;
  negocio?: import("@prisma/client").Negocio | null;
  fechaEstimadaInicio: Date;
  fechaEstimadaFin?: Date;
}): Promise<Result<{ tareaId: string }>> {
  try {
    const jefe = await requireAuth();
    const esJefe = await esJefeDelArea(jefe.id, input.asignadoAId);
    const esAdmin = jefe.rol === "ADMIN" || jefe.rol === "RRHH";
    if (!esJefe && !esAdmin) {
      return { success: false, error: "Solo el jefe del área puede asignar tareas" };
    }

    let nombreFinal = input.nombreAdHoc;
    let tiempoMax = input.tiempoEstimadoMaxAdHoc ?? 60;

    if (input.catalogoTareaId) {
      const cat = await prisma.catalogoTarea.findUnique({
        where: { id: input.catalogoTareaId },
      });
      if (!cat) return { success: false, error: "Catálogo de tarea inválido" };
      nombreFinal = cat.nombre;
      tiempoMax = cat.tiempoMaximoMin;
    } else {
      if (!input.nombreAdHoc || !input.puntosBaseAdHoc) {
        return {
          success: false,
          error: "Si no hay catálogo, nombre y puntos son obligatorios",
        };
      }
      if (input.puntosBaseAdHoc < 1 || input.puntosBaseAdHoc > 50) {
        return { success: false, error: "Puntos base entre 1 y 50" };
      }
    }

    const fin =
      input.fechaEstimadaFin ?? addMinutes(input.fechaEstimadaInicio, tiempoMax);

    const nueva = await prisma.tareaInstancia.create({
      data: {
        asignadoAId: input.asignadoAId,
        origen: "ASIGNADA_JEFE",
        catalogoTareaId: input.catalogoTareaId ?? null,
        workflowInstanciaId: null,
        nombreAdHoc: input.catalogoTareaId ? null : input.nombreAdHoc!,
        descripcionAdHoc: input.catalogoTareaId ? null : input.descripcionAdHoc,
        puntosBaseAdHoc: input.catalogoTareaId ? null : input.puntosBaseAdHoc!,
        tiempoEstimadoMinAdHoc: input.catalogoTareaId
          ? null
          : input.tiempoEstimadoMinAdHoc ?? 30,
        tiempoEstimadoMaxAdHoc: input.catalogoTareaId ? null : tiempoMax,
        negocio: input.negocio ?? null,
        fechaEstimadaInicio: input.fechaEstimadaInicio,
        fechaEstimadaFin: fin,
        estado: "PENDIENTE",
        requiereValidacionJefe: false,
      },
    });

    await prisma.notificacion.create({
      data: {
        userId: input.asignadoAId,
        tipo: "RECORDATORIO",
        titulo: "Nueva tarea asignada",
        mensaje: `${jefe.nombre} te asignó "${nombreFinal}". Revisá /tareas.`,
        url: `/tareas/${nueva.id}`,
      },
    });

    revalidatePath("/mi-equipo");
    revalidatePath(`/mi-equipo/${input.asignadoAId}`);
    return { success: true, data: { tareaId: nueva.id } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ============================================================================
// Nueva API para empleado: crear tarea ad-hoc propia (requiere validación)
// ============================================================================
export async function crearTareaAdHoc(input: {
  nombre: string;
  descripcion?: string;
  puntosBaseAdHoc: number;
  tiempoEstimadoMinAdHoc: number;
  tiempoEstimadoMaxAdHoc: number;
  negocio?: import("@prisma/client").Negocio | null;
  fechaEstimadaInicio?: Date;
}): Promise<Result<{ tareaId: string }>> {
  try {
    const user = await requireAuth();

    if (!input.nombre.trim()) {
      return { success: false, error: "El nombre es obligatorio" };
    }
    if (input.puntosBaseAdHoc < 1 || input.puntosBaseAdHoc > 20) {
      return {
        success: false,
        error: "Puntos base entre 1 y 20 (las ad-hoc tienen tope menor)",
      };
    }
    if (
      input.tiempoEstimadoMinAdHoc < 1 ||
      input.tiempoEstimadoMaxAdHoc < input.tiempoEstimadoMinAdHoc
    ) {
      return { success: false, error: "Tiempo estimado inválido" };
    }

    const inicio = input.fechaEstimadaInicio ?? new Date();
    const fin = addMinutes(inicio, input.tiempoEstimadoMaxAdHoc);

    const nueva = await prisma.tareaInstancia.create({
      data: {
        asignadoAId: user.id,
        origen: "AUTO_ASIGNADA",
        catalogoTareaId: null,
        workflowInstanciaId: null,
        nombreAdHoc: input.nombre.trim(),
        descripcionAdHoc: input.descripcion?.trim() || null,
        puntosBaseAdHoc: input.puntosBaseAdHoc,
        tiempoEstimadoMinAdHoc: input.tiempoEstimadoMinAdHoc,
        tiempoEstimadoMaxAdHoc: input.tiempoEstimadoMaxAdHoc,
        negocio: input.negocio ?? null,
        fechaEstimadaInicio: inicio,
        fechaEstimadaFin: fin,
        estado: "PENDIENTE",
        requiereValidacionJefe: true,
      },
    });

    // Notificar al jefe del área
    if (user.areaId) {
      const jefe = await prisma.user.findFirst({
        where: {
          areaId: user.areaId,
          puesto: { nombre: { startsWith: "Jefe" } },
        },
        select: { id: true },
      });
      if (jefe) {
        await prisma.notificacion.create({
          data: {
            userId: jefe.id,
            tipo: "SISTEMA",
            titulo: "Nueva tarea auto-asignada",
            mensaje: `${user.nombre} creó la tarea "${input.nombre.trim()}" (${input.puntosBaseAdHoc} pts). Revisá cuando se complete.`,
            url: `/mi-equipo/${user.id}`,
          },
        });
      }
    }

    revalidatePath("/tareas");
    revalidatePath("/mi-equipo");
    return { success: true, data: { tareaId: nueva.id } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ============================================================================
// Nueva API para jefe: validar tarea ad-hoc completada
// ============================================================================
export async function validarTareaAdHoc(input: {
  tareaId: string;
  aprobar: boolean;
  comentario?: string;
  ajustePuntos?: number;
}): Promise<Result<{ puntosOtorgados: number }>> {
  try {
    const jefe = await requireAuth();

    const tarea = await prisma.tareaInstancia.findUnique({
      where: { id: input.tareaId },
      include: { catalogoTarea: true },
    });
    if (!tarea) return { success: false, error: "Tarea no encontrada" };
    if (!tarea.requiereValidacionJefe) {
      return { success: false, error: "Esta tarea no requiere validación" };
    }
    if (tarea.validadaEn) {
      return { success: false, error: "La tarea ya fue validada" };
    }

    const esJefe = await esJefeDelArea(jefe.id, tarea.asignadoAId);
    const esAdmin = jefe.rol === "ADMIN" || jefe.rol === "RRHH";
    if (!esJefe && !esAdmin) {
      return { success: false, error: "Solo el jefe del área puede validar" };
    }

    const datos = datosTarea(tarea);
    let puntosOtorgados = 0;

    if (input.aprobar) {
      const puntosFinales =
        input.ajustePuntos !== undefined && input.ajustePuntos >= 0
          ? input.ajustePuntos
          : tarea.puntosBrutos;

      const { puntosProrrateados, factorProrrateo } =
        await calcularPuntosProrrateados(tarea.asignadoAId, puntosFinales, {
          excluirTareaId: input.tareaId,
        });

      await prisma.tareaInstancia.update({
        where: { id: input.tareaId },
        data: {
          estado: "COMPLETADA",
          validadaPorJefeId: jefe.id,
          validadaEn: new Date(),
          comentarioValidacion: input.comentario,
          puntosBrutos: puntosFinales,
          puntosOtorgados: puntosProrrateados,
          factorProrrateo,
        },
      });

      await procesarEvento({
        userId: tarea.asignadoAId,
        tipo: "COMPROMISO_CUMPLIDO",
        fuente: "COMPROMISOS",
        puntosBrutos: puntosProrrateados,
        metadatos: {
          origen: "tarea_ad_hoc_validada",
          tareaNombre: datos.nombre,
          puntosBrutos: puntosFinales,
          factorProrrateo,
          validadaPor: jefe.id,
        },
        referenciaId: input.tareaId,
        descripcion: `Tarea ad-hoc validada: ${datos.nombre}`,
      });

      puntosOtorgados = puntosProrrateados;

      await prisma.notificacion.create({
        data: {
          userId: tarea.asignadoAId,
          tipo: "OBJETIVO_CUMPLIDO",
          titulo: "Tarea validada",
          mensaje: `${jefe.nombre} validó "${datos.nombre}". +${puntosOtorgados} pts`,
          url: `/tareas/${input.tareaId}`,
        },
      });
    } else {
      // Rechazada
      await prisma.tareaInstancia.update({
        where: { id: input.tareaId },
        data: {
          estado: "OMITIDA",
          validadaPorJefeId: jefe.id,
          validadaEn: new Date(),
          comentarioValidacion: input.comentario ?? "Rechazada por el jefe",
          puntosOtorgados: 0,
        },
      });

      await prisma.notificacion.create({
        data: {
          userId: tarea.asignadoAId,
          tipo: "SISTEMA",
          titulo: "Tarea rechazada",
          mensaje: `"${datos.nombre}" fue rechazada: ${input.comentario ?? "sin comentario"}`,
          url: `/tareas/${input.tareaId}`,
        },
      });
    }

    revalidatePath("/tareas");
    revalidatePath("/mi-equipo");
    revalidatePath(`/mi-equipo/${tarea.asignadoAId}`);
    revalidatePath(`/tareas/${input.tareaId}`);

    return { success: true, data: { puntosOtorgados } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ============================================================================
// Workflows
// ============================================================================
export async function crearWorkflow(
  input: CrearWorkflowInput,
): Promise<
  Result<{
    workflowInstanciaId: string;
    tareasCreadas: number;
    tareasOmitidas: Array<{ codigo: string; motivo: string }>;
  }>
> {
  try {
    const user = await requireAuth();
    const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
    const esJefe = user.puesto?.nombre?.startsWith("Jefe") ?? false;
    if (!esAdmin && !esJefe) {
      return { success: false, error: "Solo admin o jefe pueden crear workflows" };
    }

    const result = await crearWorkflowDesdeTemplate(input);
    revalidatePath("/mi-equipo");
    revalidatePath("/admin/workflows");
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ============================================================================
// Editar tarea (empleado o jefe): notas, fechas, negocio; + nombre/puntos para ad-hoc
// ============================================================================
export async function editarTareaInstancia(input: {
  tareaId: string;
  negocio?: import("@prisma/client").Negocio | null;
  nombreAdHoc?: string;
  descripcionAdHoc?: string;
  puntosBaseAdHoc?: number;
  tiempoEstimadoMinAdHoc?: number;
  tiempoEstimadoMaxAdHoc?: number;
  fechaEstimadaInicio?: Date;
  fechaEstimadaFin?: Date;
  notasEjecutor?: string;
}): Promise<Result> {
  try {
    const user = await requireAuth();
    const tarea = await prisma.tareaInstancia.findUnique({
      where: { id: input.tareaId },
      include: { catalogoTarea: true },
    });
    if (!tarea) return { success: false, error: "Tarea no encontrada" };

    const esPropia =
      tarea.asignadoAId === user.id || tarea.ejecutadaRealmenteId === user.id;
    const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
    const esJefe =
      user.puesto?.nombre?.startsWith("Jefe") &&
      (await prisma.user.findUnique({ where: { id: tarea.asignadoAId } }))
        ?.areaId === user.areaId;
    if (!esPropia && !esAdmin && !esJefe) {
      return { success: false, error: "Sin permisos para editar" };
    }
    if (tarea.estado === "COMPLETADA" || tarea.estado === "OMITIDA") {
      return { success: false, error: "No se puede editar una tarea cerrada" };
    }

    const esAdHocPuro = !tarea.catalogoTareaId;
    const data: Record<string, unknown> = {};

    if (input.negocio !== undefined) data.negocio = input.negocio;
    if (input.notasEjecutor !== undefined) data.notasEjecutor = input.notasEjecutor;
    if (input.fechaEstimadaInicio) data.fechaEstimadaInicio = input.fechaEstimadaInicio;
    if (input.fechaEstimadaFin) data.fechaEstimadaFin = input.fechaEstimadaFin;

    // Nombre: editable siempre. Si tiene catálogo, string vacío revierte al
    // catálogo (null). Si es ad-hoc puro, no puede quedar vacío.
    if (input.nombreAdHoc !== undefined) {
      const trimmed = input.nombreAdHoc.trim();
      if (!trimmed) {
        if (esAdHocPuro) {
          return { success: false, error: "El nombre no puede estar vacío" };
        }
        data.nombreAdHoc = null;
      } else {
        data.nombreAdHoc = trimmed;
      }
    }

    // Descripción: editable siempre. Vacío siempre limpia el override.
    if (input.descripcionAdHoc !== undefined) {
      data.descripcionAdHoc = input.descripcionAdHoc.trim() || null;
    }

    // Puntos y tiempos: solo editables en ad-hoc puro (afectan gamificación;
    // los del catálogo son parte de la calibración del sistema).
    if (esAdHocPuro) {
      if (input.puntosBaseAdHoc !== undefined) {
        const max = esJefe || esAdmin ? 50 : 20;
        if (input.puntosBaseAdHoc < 1 || input.puntosBaseAdHoc > max) {
          return { success: false, error: `Puntos entre 1 y ${max}` };
        }
        data.puntosBaseAdHoc = input.puntosBaseAdHoc;
      }
      if (input.tiempoEstimadoMinAdHoc !== undefined) {
        data.tiempoEstimadoMinAdHoc = input.tiempoEstimadoMinAdHoc;
      }
      if (input.tiempoEstimadoMaxAdHoc !== undefined) {
        data.tiempoEstimadoMaxAdHoc = input.tiempoEstimadoMaxAdHoc;
      }
    }

    await prisma.tareaInstancia.update({
      where: { id: input.tareaId },
      data,
    });

    revalidatePath("/tareas");
    revalidatePath(`/tareas/${input.tareaId}`);
    revalidatePath("/mi-equipo");
    revalidatePath(`/mi-equipo/${tarea.asignadoAId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function cancelarWorkflow(workflowId: string): Promise<Result> {
  try {
    await requireRole(["ADMIN", "RRHH"]);
    await prisma.workflowInstancia.update({
      where: { id: workflowId },
      data: { estadoGeneral: "CANCELADO" },
    });
    revalidatePath("/mi-equipo");
    revalidatePath("/admin/workflows");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
