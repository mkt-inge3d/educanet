import type { EstadoTareaInstancia } from "@prisma/client";

export type SemaforoCarga = "VACIO" | "VERDE" | "AMARILLO" | "ROJO";

export type TareaPlanificada = {
  id: string;
  titulo: string;
  estado: EstadoTareaInstancia;
  workflowId: string | null;
  workflowNombre: string | null;
  fechaInicio: Date;
  fechaFin: Date;
  esHito: boolean;
  requiereValidacionJefe: boolean;
};

export type FilaMiembroAgenda = {
  userId: string;
  nombre: string;
  apellido: string;
  avatarUrl: string | null;
  puestoNombre: string;
  tareas: TareaPlanificada[];
  carga: SemaforoCarga;
};

export type ResumenAgenda = {
  totalTareas: number;
  totalMiembros: number;
  miembrosActivos: number;
  miembrosSinTareas: number;
  miembrosSobrecargados: number;
};

const UMBRAL_AMARILLO = 4;
const UMBRAL_ROJO = 6;

export function clasificarCarga(cantidadTareas: number): SemaforoCarga {
  if (cantidadTareas === 0) return "VACIO";
  if (cantidadTareas >= UMBRAL_ROJO) return "ROJO";
  if (cantidadTareas >= UMBRAL_AMARILLO) return "AMARILLO";
  return "VERDE";
}

export function tareaEnElDia(
  tarea: { fechaEstimadaInicio: Date; fechaEstimadaFin: Date },
  inicioDia: Date,
  finDia: Date,
): boolean {
  return (
    tarea.fechaEstimadaInicio <= finDia && tarea.fechaEstimadaFin >= inicioDia
  );
}

export function resumirAgenda(filas: FilaMiembroAgenda[]): ResumenAgenda {
  let totalTareas = 0;
  let miembrosActivos = 0;
  let miembrosSinTareas = 0;
  let miembrosSobrecargados = 0;
  for (const f of filas) {
    totalTareas += f.tareas.length;
    if (f.tareas.length === 0) miembrosSinTareas++;
    else miembrosActivos++;
    if (f.carga === "ROJO") miembrosSobrecargados++;
  }
  return {
    totalTareas,
    totalMiembros: filas.length,
    miembrosActivos,
    miembrosSinTareas,
    miembrosSobrecargados,
  };
}
