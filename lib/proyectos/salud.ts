import type { EstadoTareaInstancia, EstadoWorkflow } from "@prisma/client";

export type SaludProyecto = "VERDE" | "AMARILLO" | "ROJO" | "SIN_DATOS";

export type CargaMiembro = {
  userId: string;
  nombre: string;
  apellido: string;
  avatarUrl: string | null;
  activas: number;
  vencidas: number;
  completadas: number;
};

export type ProyectoConSalud = {
  id: string;
  nombre: string;
  contextoMarca: string | null;
  fechaHito: Date;
  fechaInicio: Date | null;
  estadoGeneral: EstadoWorkflow;
  categoria: string;
  plantillaNombre: string;
  responsable: { id: string; nombre: string; apellido: string };
  total: number;
  completadas: number;
  enProgreso: number;
  enRevision: number;
  pendientes: number;
  bloqueadas: number;
  vencidas: number;
  omitidas: number;
  porcentajeAvance: number;
  porcentajeTiempo: number;
  diasRestantes: number;
  diasTotales: number;
  salud: SaludProyecto;
  cargaPorMiembro: CargaMiembro[];
};

export type TareaResumen = {
  id: string;
  estado: EstadoTareaInstancia;
  fechaEstimadaInicio: Date;
  fechaEstimadaFin: Date;
  completadaEn: Date | null;
  asignadoA: {
    id: string;
    nombre: string;
    apellido: string;
    avatarUrl: string | null;
  };
};

export type WorkflowParaSalud = {
  id: string;
  nombre: string;
  contextoMarca: string | null;
  fechaHito: Date;
  estadoGeneral: EstadoWorkflow;
  responsableGeneral: { id: string; nombre: string; apellido: string };
  plantilla: { nombre: string; categoria: string };
  tareas: TareaResumen[];
};

const ESTADOS_ABIERTOS: EstadoTareaInstancia[] = [
  "PENDIENTE",
  "BLOQUEADA",
  "EN_PROGRESO",
  "EN_REVISION",
  "VENCIDA",
];

export function calcularSaludProyecto(
  workflow: WorkflowParaSalud,
  ahora: Date = new Date(),
): ProyectoConSalud {
  const tareas = workflow.tareas;
  const total = tareas.length;

  let completadas = 0;
  let enProgreso = 0;
  let enRevision = 0;
  let pendientes = 0;
  let bloqueadas = 0;
  let vencidas = 0;
  let omitidas = 0;
  let fechaInicio: Date | null = null;

  const cargaMap = new Map<string, CargaMiembro>();

  for (const t of tareas) {
    if (!fechaInicio || t.fechaEstimadaInicio < fechaInicio) {
      fechaInicio = t.fechaEstimadaInicio;
    }
    switch (t.estado) {
      case "COMPLETADA":
        completadas++;
        break;
      case "EN_PROGRESO":
        enProgreso++;
        break;
      case "EN_REVISION":
        enRevision++;
        break;
      case "PENDIENTE":
        pendientes++;
        break;
      case "BLOQUEADA":
        bloqueadas++;
        break;
      case "VENCIDA":
        vencidas++;
        break;
      case "OMITIDA":
        omitidas++;
        break;
    }

    const a = t.asignadoA;
    const existente = cargaMap.get(a.id) ?? {
      userId: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      avatarUrl: a.avatarUrl,
      activas: 0,
      vencidas: 0,
      completadas: 0,
    };
    if (t.estado === "COMPLETADA") existente.completadas++;
    else if (t.estado === "VENCIDA") existente.vencidas++;
    else if (ESTADOS_ABIERTOS.includes(t.estado)) existente.activas++;
    cargaMap.set(a.id, existente);
  }

  const totalNoOmitidas = Math.max(0, total - omitidas);
  const porcentajeAvance =
    totalNoOmitidas > 0 ? Math.round((completadas / totalNoOmitidas) * 100) : 0;

  const inicio = fechaInicio ?? workflow.fechaHito;
  const fin = workflow.fechaHito;
  const msTotales = fin.getTime() - inicio.getTime();
  const msTranscurridos = ahora.getTime() - inicio.getTime();
  const porcentajeTiempo =
    msTotales > 0
      ? Math.min(100, Math.max(0, Math.round((msTranscurridos / msTotales) * 100)))
      : 100;
  const diasTotales = Math.max(1, Math.ceil(msTotales / (1000 * 60 * 60 * 24)));
  const diasRestantes = Math.ceil(
    (fin.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24),
  );

  const pctVencidas = total > 0 ? (vencidas / total) * 100 : 0;
  const gap = porcentajeTiempo - porcentajeAvance;

  let salud: SaludProyecto;
  if (total === 0) {
    salud = "SIN_DATOS";
  } else if (workflow.estadoGeneral === "COMPLETADO" || porcentajeAvance === 100) {
    salud = "VERDE";
  } else if (pctVencidas > 20 || gap > 20 || (diasRestantes < 0 && porcentajeAvance < 100)) {
    salud = "ROJO";
  } else if (pctVencidas > 0 || gap > 10 || bloqueadas > 0) {
    salud = "AMARILLO";
  } else {
    salud = "VERDE";
  }

  const cargaPorMiembro = Array.from(cargaMap.values()).sort(
    (a, b) =>
      b.vencidas - a.vencidas ||
      b.activas - a.activas ||
      a.nombre.localeCompare(b.nombre),
  );

  return {
    id: workflow.id,
    nombre: workflow.nombre,
    contextoMarca: workflow.contextoMarca,
    fechaHito: workflow.fechaHito,
    fechaInicio,
    estadoGeneral: workflow.estadoGeneral,
    categoria: workflow.plantilla.categoria,
    plantillaNombre: workflow.plantilla.nombre,
    responsable: workflow.responsableGeneral,
    total,
    completadas,
    enProgreso,
    enRevision,
    pendientes,
    bloqueadas,
    vencidas,
    omitidas,
    porcentajeAvance,
    porcentajeTiempo,
    diasRestantes,
    diasTotales,
    salud,
    cargaPorMiembro,
  };
}

export function agregarResumenProyectos(proyectos: ProyectoConSalud[]) {
  return {
    total: proyectos.length,
    saludables: proyectos.filter((p) => p.salud === "VERDE").length,
    enRiesgo: proyectos.filter((p) => p.salud === "AMARILLO").length,
    criticos: proyectos.filter((p) => p.salud === "ROJO").length,
    totalTareasVencidas: proyectos.reduce((s, p) => s + p.vencidas, 0),
    totalTareasBloqueadas: proyectos.reduce((s, p) => s + p.bloqueadas, 0),
  };
}
