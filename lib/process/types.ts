import type { TipoNodoBpmn, EstadoNodo, EstadoInstanciaProceso } from "@prisma/client"

export type { TipoNodoBpmn, EstadoNodo, EstadoInstanciaProceso }

export interface NodoParseado {
  bpmnElementId: string
  nombre: string
  tipo: TipoNodoBpmn
  carril: string
  fase: string
  puestoNombre?: string
  duracionEstimadaMin?: number
  posicion: { x: number; y: number }
  metadatos?: Record<string, unknown>
}

export interface FlujoParseado {
  id: string
  origen: string
  destino: string
  condicion?: string
  nombre?: string
}

export interface BpmnParseado {
  nodos: NodoParseado[]
  flujos: FlujoParseado[]
}

/** Nodo enriquecido con su estado vivo (para la vista del flujograma). */
export interface NodoConEstado extends NodoParseado {
  nodoProcesoId: string
  estado: EstadoNodo
  iniciadoEn: Date | null
  completadoEn: Date | null
  duracionRealMin: number | null
  tareaInstanciaId: string | null
}
