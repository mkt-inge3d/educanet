import { addBusinessTime } from "./addBusinessTime"
import { businessMinutesBetween } from "./businessCalendar"
import type { CalendarioGantt } from "./types"

interface TaskNode {
  id: string
  inicio: Date
  fin: Date
  duracionMinutos: number
}

interface DepNode {
  predecesora: string
  sucesora: string
  tipo: string
  lagMinutos: number
}

// ── Helpers de calendario ─────────────────────────────────────────────────────

function biz(start: Date, minutes: number, cal: CalendarioGantt | null): Date {
  if (!cal) return new Date(start.getTime() + minutes * 60_000)
  return addBusinessTime(start, minutes, cal)
}

function bizMinutes(a: Date, b: Date, cal: CalendarioGantt | null): number {
  if (!cal) return Math.round((b.getTime() - a.getTime()) / 60_000)
  return businessMinutesBetween(a, b, cal)
}

// ── BFS Reprogramación ────────────────────────────────────────────────────────

/**
 * Dado que la tarea `rootId` cambió a [newInicio, newFin],
 * propaga las nuevas fechas hacia adelante por BFS siguiendo
 * las dependencias. Devuelve un mapa de taskId → {inicio, fin} para
 * todas las tareas afectadas (incluyendo la raíz).
 */
export function rescheduleSuccessors(
  rootId: string,
  newInicio: Date,
  newFin: Date,
  allTasks: TaskNode[],
  allDeps: DepNode[],
  cal: CalendarioGantt | null
): Map<string, { inicio: Date; fin: Date }> {
  const updates = new Map<string, { inicio: Date; fin: Date }>()
  updates.set(rootId, { inicio: newInicio, fin: newFin })

  const taskMap = new Map(allTasks.map((t) => [t.id, t]))
  const successorsOf = new Map<string, DepNode[]>()
  for (const dep of allDeps) {
    if (!successorsOf.has(dep.predecesora)) successorsOf.set(dep.predecesora, [])
    successorsOf.get(dep.predecesora)!.push(dep)
  }

  // Cola BFS
  const queue = [rootId]
  const visited = new Set<string>([rootId])

  while (queue.length > 0) {
    const predId = queue.shift()!
    const predDates = updates.get(predId) ?? taskMap.get(predId)
    if (!predDates) continue

    for (const dep of successorsOf.get(predId) ?? []) {
      const succId = dep.sucesora
      const succ = taskMap.get(succId)
      if (!succ) continue

      const dur = succ.duracionMinutos
      let candidateStart: Date

      switch (dep.tipo) {
        case "INICIO_A_INICIO":
          candidateStart = biz(predDates.inicio, dep.lagMinutos, cal)
          break
        case "FIN_A_FIN": {
          const candidateFin = biz(predDates.fin, dep.lagMinutos, cal)
          candidateStart = biz(candidateFin, -dur, cal)
          break
        }
        case "INICIO_A_FIN": {
          const candidateFin = biz(predDates.inicio, dep.lagMinutos, cal)
          candidateStart = biz(candidateFin, -dur, cal)
          break
        }
        default: // FIN_A_INICIO
          candidateStart = biz(predDates.fin, dep.lagMinutos, cal)
      }

      const prev = updates.get(succId)
      const prevStart = prev?.inicio ?? succ.inicio

      // Si el candidato es posterior al actual, actualizar (múltiples predecesores → máximo)
      if (candidateStart > prevStart) {
        updates.set(succId, {
          inicio: candidateStart,
          fin: biz(candidateStart, dur, cal),
        })
        if (!visited.has(succId)) {
          visited.add(succId)
          queue.push(succId)
        }
      }
    }
  }

  return updates
}

// ── CPM (Critical Path Method) ────────────────────────────────────────────────

/**
 * Calcula la ruta crítica sobre todos los tasks del workflow.
 * Devuelve el conjunto de IDs de tareas con holgura = 0.
 */
export function computeCriticalPath(
  allTasks: TaskNode[],
  allDeps: DepNode[],
  cal: CalendarioGantt | null
): Set<string> {
  if (!allTasks.length) return new Set()

  // Forward pass: earlyStart y earlyFinish
  const earlyStart = new Map<string, Date>()
  const earlyFinish = new Map<string, Date>()

  // Orden topológico (Kahn's algorithm)
  const inDegree = new Map<string, number>()
  const successorsOf = new Map<string, DepNode[]>()
  for (const t of allTasks) inDegree.set(t.id, 0)
  for (const d of allDeps) {
    inDegree.set(d.sucesora, (inDegree.get(d.sucesora) ?? 0) + 1)
    if (!successorsOf.has(d.predecesora)) successorsOf.set(d.predecesora, [])
    successorsOf.get(d.predecesora)!.push(d)
  }

  const topoQueue: string[] = allTasks
    .filter((t) => (inDegree.get(t.id) ?? 0) === 0)
    .map((t) => t.id)

  const taskMap = new Map(allTasks.map((t) => [t.id, t]))
  const projectStart = allTasks.reduce(
    (min, t) => (t.inicio < min ? t.inicio : min),
    allTasks[0].inicio
  )

  // Inicializar tasks sin predecesores
  for (const id of topoQueue) {
    const t = taskMap.get(id)!
    earlyStart.set(id, t.inicio)
    earlyFinish.set(id, t.fin)
  }

  const processed = new Set<string>()
  const queue = [...topoQueue]

  while (queue.length) {
    const predId = queue.shift()!
    if (processed.has(predId)) continue
    processed.add(predId)

    const predEF = earlyFinish.get(predId) ?? taskMap.get(predId)!.fin

    for (const dep of successorsOf.get(predId) ?? []) {
      const succId = dep.sucesora
      const succ = taskMap.get(succId)!

      let candStart: Date
      switch (dep.tipo) {
        case "INICIO_A_INICIO":
          candStart = biz(earlyStart.get(predId)!, dep.lagMinutos, cal)
          break
        case "FIN_A_FIN": {
          const cf = biz(predEF, dep.lagMinutos, cal)
          candStart = biz(cf, -succ.duracionMinutos, cal)
          break
        }
        case "INICIO_A_FIN": {
          const cf = biz(earlyStart.get(predId)!, dep.lagMinutos, cal)
          candStart = biz(cf, -succ.duracionMinutos, cal)
          break
        }
        default:
          candStart = biz(predEF, dep.lagMinutos, cal)
      }

      const prevES = earlyStart.get(succId) ?? succ.inicio
      if (!earlyStart.has(succId) || candStart > prevES) {
        earlyStart.set(succId, candStart)
        earlyFinish.set(succId, biz(candStart, succ.duracionMinutos, cal))
      }

      inDegree.set(succId, (inDegree.get(succId) ?? 1) - 1)
      if ((inDegree.get(succId) ?? 0) <= 0 && !processed.has(succId)) {
        queue.push(succId)
      }
    }
  }

  // Backward pass: lateFinish y lateStart
  const projectFinish = allTasks.reduce(
    (max, t) => {
      const ef = earlyFinish.get(t.id) ?? t.fin
      return ef > max ? ef : max
    },
    earlyFinish.get(allTasks[0].id) ?? allTasks[0].fin
  )

  const lateFinish = new Map<string, Date>()
  const lateStart = new Map<string, Date>()
  const predecessorsOf = new Map<string, DepNode[]>()
  for (const d of allDeps) {
    if (!predecessorsOf.has(d.sucesora)) predecessorsOf.set(d.sucesora, [])
    predecessorsOf.get(d.sucesora)!.push(d)
  }

  // Inicializar tareas sin sucesores con projectFinish
  const hasSuccessors = new Set(allDeps.map((d) => d.predecesora))
  for (const t of allTasks) {
    if (!hasSuccessors.has(t.id)) {
      lateFinish.set(t.id, projectFinish)
      lateStart.set(t.id, biz(projectFinish, -t.duracionMinutos, cal))
    }
  }

  // Orden topológico inverso
  const revQueue = [...allTasks]
    .filter((t) => !hasSuccessors.has(t.id))
    .map((t) => t.id)
  const revProcessed = new Set<string>()

  while (revQueue.length) {
    const succId = revQueue.shift()!
    if (revProcessed.has(succId)) continue
    revProcessed.add(succId)

    const succLF = lateFinish.get(succId) ?? taskMap.get(succId)!.fin
    const succLS = lateStart.get(succId) ?? taskMap.get(succId)!.inicio

    for (const dep of predecessorsOf.get(succId) ?? []) {
      const predId = dep.predecesora
      const pred = taskMap.get(predId)!

      let candPredLF: Date
      switch (dep.tipo) {
        case "INICIO_A_INICIO":
          candPredLF = pred.fin // LS_succ - lag → LF_pred no cambia
          candPredLF = biz(succLS, -dep.lagMinutos - pred.duracionMinutos + 1, cal)
          break
        case "FIN_A_FIN":
          candPredLF = biz(succLF, -dep.lagMinutos, cal)
          break
        case "INICIO_A_FIN":
          // LS_succ determinado por start_pred
          candPredLF = biz(biz(succLF, -dep.lagMinutos, cal), 0, cal)
          break
        default: // FIN_A_INICIO
          candPredLF = biz(succLS, -dep.lagMinutos, cal)
      }

      const prevLF = lateFinish.get(predId)
      if (!prevLF || candPredLF < prevLF) {
        lateFinish.set(predId, candPredLF)
        lateStart.set(predId, biz(candPredLF, -pred.duracionMinutos, cal))
      }

      if (!revProcessed.has(predId)) revQueue.push(predId)
    }
  }

  // Identificar tareas críticas (slack ≈ 0)
  const critical = new Set<string>()
  for (const t of allTasks) {
    const es = earlyStart.get(t.id) ?? t.inicio
    const ls = lateStart.get(t.id) ?? t.inicio
    const slack = bizMinutes(es, ls, cal)
    if (slack <= 0) critical.add(t.id)
  }

  return critical
}
