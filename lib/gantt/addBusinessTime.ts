import type { CalendarioGantt } from "./types"
import {
  anteriorFinSlot,
  esHoraLaboral,
  getHHMMInTz,
  siguienteInicioSlot,
  slotsDia,
  snapBackward,
  withTimeInTz,
} from "./businessCalendar"

/**
 * Suma (o resta) durationMinutes de minutos laborables a start,
 * respetando horario semanal, pausas de almuerzo, feriados y timezone.
 *
 * - duration == 0  → devuelve start sin modificar (hito)
 * - duration > 0   → avanza en el tiempo
 * - duration < 0   → retrocede (backward pass de ruta crítica)
 *
 * Semántica de slots:
 * - Hacia adelante: un slot [inicio, fin) — fin es exclusivo.
 * - Hacia atrás:   un slot (inicio, fin] — inicio es exclusivo, fin es inclusivo.
 */
export function addBusinessTime(
  start: Date,
  durationMinutes: number,
  calendario: CalendarioGantt
): Date {
  if (durationMinutes === 0) return new Date(start)

  const dir = durationMinutes > 0 ? 1 : -1
  let remaining = Math.abs(durationMinutes)
  let current = new Date(start)

  // Corrección inicial: si no estamos en horario laboral, saltar al slot más cercano
  if (!esHoraLaboral(current, calendario)) {
    current =
      dir === 1
        ? siguienteInicioSlot(current, calendario)
        : snapBackward(current, calendario)
  }

  while (remaining > 0) {
    const tz = calendario.timezone
    const hhmm = getHHMMInTz(current, tz)
    const slots = slotsDia(current, calendario)

    // Búsqueda de slot con semántica según dirección:
    //   adelante: [inicio, fin)  → hhmm >= inicio && hhmm < fin
    //   atrás:    (inicio, fin]  → hhmm > inicio  && hhmm <= fin
    const slot =
      dir === 1
        ? slots.find((s) => hhmm >= s.inicio && hhmm < s.fin)
        : slots.find((s) => hhmm > s.inicio && hhmm <= s.fin)

    if (!slot) {
      // Fuera de slot — navegar al más cercano
      current =
        dir === 1
          ? siguienteInicioSlot(current, calendario)
          : anteriorFinSlot(current, calendario)
      continue
    }

    if (dir === 1) {
      const finSlotUTC = withTimeInTz(current, slot.fin, tz)
      const disponibles = Math.round(
        (finSlotUTC.getTime() - current.getTime()) / 60_000
      )
      if (remaining <= disponibles) {
        current = new Date(current.getTime() + remaining * 60_000)
        remaining = 0
      } else {
        remaining -= disponibles
        current = siguienteInicioSlot(finSlotUTC, calendario)
      }
    } else {
      const inicioSlotUTC = withTimeInTz(current, slot.inicio, tz)
      const disponibles = Math.round(
        (current.getTime() - inicioSlotUTC.getTime()) / 60_000
      )
      if (remaining <= disponibles) {
        current = new Date(current.getTime() - remaining * 60_000)
        remaining = 0
      } else {
        remaining -= disponibles
        // anteriorFinSlot usa s.fin < hhmm (estrictamente menor) para no
        // volver al mismo slot que acabamos de agotar
        current = anteriorFinSlot(inicioSlotUTC, calendario)
      }
    }
  }

  return current
}
