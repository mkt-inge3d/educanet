import { TZDate } from "@date-fns/tz"
import type { CalendarioGantt, DiaSemana, SlotHorario } from "./types"

const DAY_A_DIA: Record<number, DiaSemana> = {
  0: "dom", 1: "lun", 2: "mar", 3: "mie", 4: "jue", 5: "vie", 6: "sab",
}

function tzDate(utcDate: Date, timezone: string): TZDate {
  return new TZDate(utcDate, timezone)
}

export function getHHMMInTz(utcDate: Date, timezone: string): string {
  const d = tzDate(utcDate, timezone)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function getDateStringInTz(utcDate: Date, timezone: string): string {
  const d = tzDate(utcDate, timezone)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function getMonthDayInTz(utcDate: Date, timezone: string): string {
  const d = tzDate(utcDate, timezone)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${m}-${day}`
}

// Devuelve una Date UTC con la HH:mm especificada en la timezone del día de baseUtcDate
export function withTimeInTz(baseUtcDate: Date, timeStr: string, timezone: string): Date {
  const d = tzDate(baseUtcDate, timezone)
  const [h, m] = timeStr.split(":").map(Number)
  d.setHours(h, m, 0, 0)
  return new Date(d.getTime())
}

// Avanza o retrocede un día calendario respetando DST (ancla al mediodía)
export function advanceDayInTz(utcDate: Date, dir: 1 | -1, timezone: string): Date {
  const d = tzDate(utcDate, timezone)
  d.setHours(12, 0, 0, 0)
  const next = new Date(d.getTime() + dir * 24 * 60 * 60 * 1_000)
  const nextD = tzDate(next, timezone)
  nextD.setHours(0, 0, 0, 0)
  return new Date(nextD.getTime())
}

export function slotsDia(utcDate: Date, calendario: CalendarioGantt): SlotHorario[] {
  const d = tzDate(utcDate, calendario.timezone)
  return calendario.horario[DAY_A_DIA[d.getDay()]] ?? []
}

export function esDiaFeriado(utcDate: Date, calendario: CalendarioGantt): boolean {
  const tz = calendario.timezone
  // Fecha actual en la timezone del calendario (para comparar con el feriado)
  const mmdd = getMonthDayInTz(utcDate, tz)
  const yyyymmdd = getDateStringInTz(utcDate, tz)

  return calendario.feriados.some((f) => {
    // Los feriados se almacenan como @db.Date → Prisma los devuelve como
    // midnight UTC. Leemos la fecha en UTC (año/mes/día), no en la timezone
    // del calendario, para evitar el shift de -5h que desplazaría al día anterior.
    const fd = new Date(f.fecha)
    const fMm = String(fd.getUTCMonth() + 1).padStart(2, "0")
    const fDd = String(fd.getUTCDate()).padStart(2, "0")
    const fMmdd = `${fMm}-${fDd}`
    const fYyyymmdd = `${fd.getUTCFullYear()}-${fMm}-${fDd}`

    if (f.recurrente) return fMmdd === mmdd
    return fYyyymmdd === yyyymmdd
  })
}

// true si utcDate cae dentro de un slot laboral (fin exclusivo, para viaje hacia adelante)
export function esHoraLaboral(utcDate: Date, calendario: CalendarioGantt): boolean {
  if (esDiaFeriado(utcDate, calendario)) return false
  const slots = slotsDia(utcDate, calendario)
  if (slots.length === 0) return false
  const hhmm = getHHMMInTz(utcDate, calendario.timezone)
  return slots.some((s) => hhmm >= s.inicio && hhmm < s.fin)
}

// ── Navegación interna ────────────────────────────────────────────────────────

// Inicio del siguiente slot estrictamente después de utcDate (para viaje hacia adelante)
export function siguienteInicioSlot(utcDate: Date, calendario: CalendarioGantt): Date {
  const tz = calendario.timezone
  const hhmm = getHHMMInTz(utcDate, tz)
  if (!esDiaFeriado(utcDate, calendario)) {
    const next = slotsDia(utcDate, calendario).find((s) => s.inicio > hhmm)
    if (next) return withTimeInTz(utcDate, next.inicio, tz)
  }
  let probe = utcDate
  for (let i = 0; i < 366; i++) {
    probe = advanceDayInTz(probe, 1, tz)
    if (!esDiaFeriado(probe, calendario)) {
      const slots = slotsDia(probe, calendario)
      if (slots.length > 0) return withTimeInTz(probe, slots[0].inicio, tz)
    }
  }
  throw new Error("No se encontró siguiente slot laboral en 366 días")
}

// Fin del slot inmediatamente anterior (s.fin < hhmm, estrictamente menor).
// Se llama solo desde el interior del loop de addBusinessTime cuando ya agotamos
// el inicio del slot actual y necesitamos saltar al slot previo.
export function anteriorFinSlot(utcDate: Date, calendario: CalendarioGantt): Date {
  const tz = calendario.timezone
  const hhmm = getHHMMInTz(utcDate, tz)
  if (!esDiaFeriado(utcDate, calendario)) {
    const prev = [...slotsDia(utcDate, calendario)].reverse().find((s) => s.fin < hhmm)
    if (prev) return withTimeInTz(utcDate, prev.fin, tz)
  }
  let probe = utcDate
  for (let i = 0; i < 366; i++) {
    probe = advanceDayInTz(probe, -1, tz)
    if (!esDiaFeriado(probe, calendario)) {
      const slots = slotsDia(probe, calendario)
      if (slots.length > 0)
        return withTimeInTz(probe, slots[slots.length - 1].fin, tz)
    }
  }
  throw new Error("No se encontró slot laboral previo en 366 días")
}

// Corrección inicial para viaje hacia atrás: busca el fin de slot más cercano
// que sea ≤ hhmm del día actual (incluye el límite para capturar e.g. las 18:00).
// Si no encuentra en el mismo día, va al día hábil anterior.
export function snapBackward(utcDate: Date, calendario: CalendarioGantt): Date {
  const tz = calendario.timezone
  const hhmm = getHHMMInTz(utcDate, tz)
  if (!esDiaFeriado(utcDate, calendario)) {
    const prev = [...slotsDia(utcDate, calendario)].reverse().find((s) => s.fin <= hhmm)
    if (prev) return withTimeInTz(utcDate, prev.fin, tz)
  }
  let probe = utcDate
  for (let i = 0; i < 366; i++) {
    probe = advanceDayInTz(probe, -1, tz)
    if (!esDiaFeriado(probe, calendario)) {
      const slots = slotsDia(probe, calendario)
      if (slots.length > 0)
        return withTimeInTz(probe, slots[slots.length - 1].fin, tz)
    }
  }
  throw new Error("No se encontró slot laboral previo en 366 días")
}

// ── Función pública: minutos laborables entre dos fechas ──────────────────────

export function businessMinutesBetween(
  start: Date,
  end: Date,
  calendario: CalendarioGantt
): number {
  if (start >= end) return 0
  let total = 0
  let current = new Date(start)
  if (!esHoraLaboral(current, calendario)) {
    current = siguienteInicioSlot(current, calendario)
  }
  while (current < end) {
    const tz = calendario.timezone
    const hhmm = getHHMMInTz(current, tz)
    const slots = slotsDia(current, calendario)
    const slot = slots.find((s) => hhmm >= s.inicio && hhmm < s.fin)
    if (!slot) {
      current = siguienteInicioSlot(current, calendario)
      continue
    }
    const finSlot = withTimeInTz(current, slot.fin, tz)
    const limite = finSlot < end ? finSlot : end
    total += Math.round((limite.getTime() - current.getTime()) / 60_000)
    current = siguienteInicioSlot(finSlot, calendario)
  }
  return total
}
