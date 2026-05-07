/**
 * Sprint 1: formato interno JSON almacenado en el campo bpmnXml.
 * Sprint 2+: parser de XML BPMN 2.0 real.
 */
import type { BpmnParseado, NodoParseado, FlujoParseado } from "./types"
import { TipoNodoBpmn } from "@prisma/client"

export function parseBpmn(bpmnXml: string): BpmnParseado {
  let parsed: unknown
  try {
    parsed = JSON.parse(bpmnXml)
  } catch {
    throw new Error("El campo bpmnXml no contiene JSON válido en este sprint")
  }

  const raw = parsed as Record<string, unknown>
  if (!Array.isArray(raw.nodos) || !Array.isArray(raw.flujos)) {
    throw new Error("Formato inválido: se esperan campos 'nodos' y 'flujos'")
  }

  return {
    nodos: raw.nodos as NodoParseado[],
    flujos: raw.flujos as FlujoParseado[],
  }
}

export function serializeBpmn(bpmn: BpmnParseado): string {
  return JSON.stringify(bpmn, null, 2)
}

/** Devuelve un BpmnParseado vacío con solo los nodos del tipo dado. */
export function filtrarPorTipo(
  bpmn: BpmnParseado,
  tipo: TipoNodoBpmn
): NodoParseado[] {
  return bpmn.nodos.filter((n) => n.tipo === tipo)
}

/** Devuelve los sucesores directos de un nodo. */
export function sucesoresDeNodo(
  bpmn: BpmnParseado,
  bpmnElementId: string
): NodoParseado[] {
  const ids = bpmn.flujos
    .filter((f) => f.origen === bpmnElementId)
    .map((f) => f.destino)
  return bpmn.nodos.filter((n) => ids.includes(n.bpmnElementId))
}
