import { describe, it, expect } from "vitest"
import { addBusinessTime } from "@/lib/gantt/addBusinessTime"
import { businessMinutesBetween, esHoraLaboral } from "@/lib/gantt/businessCalendar"
import type { CalendarioGantt } from "@/lib/gantt/types"

// ── Fábrica de calendarios de prueba ──────────────────────────────────────────

function calLima(extras?: Partial<CalendarioGantt>): CalendarioGantt {
  return {
    id: "test-lima",
    nombre: "Estándar Lima",
    timezone: "America/Lima", // UTC-5, sin DST
    horario: {
      lun: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
      mar: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
      mie: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
      jue: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
      vie: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
      sab: [],
      dom: [],
    },
    feriados: [],
    ...extras,
  }
}

// Construye una fecha UTC que equivale a las HH:mm en Lima (UTC-5)
function limaUTC(iso: string): Date {
  // iso = "2026-05-04T09:00" → Lima local, convierte a UTC añadiendo 5h
  return new Date(iso + ":00-05:00")
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mins(n: number) { return n }
function horas(n: number) { return n * 60 }

// ── Tests ────────────────────────────────────────────────────────────────────

describe("addBusinessTime", () => {
  const cal = calLima()

  // 1. Día normal sin saltos
  describe("1. día normal sin saltos", () => {
    it("avanza 2h dentro del mismo turno", () => {
      const start = limaUTC("2026-05-04T09:00") // lunes 09:00
      const result = addBusinessTime(start, horas(2), cal)
      expect(result).toEqual(limaUTC("2026-05-04T11:00"))
    })

    it("avanza exactamente hasta el fin del turno (09:00 + 4h = 13:00)", () => {
      const start = limaUTC("2026-05-04T09:00")
      const result = addBusinessTime(start, horas(4), cal)
      expect(result).toEqual(limaUTC("2026-05-04T13:00"))
    })
  })

  // 2. Saltando hora de almuerzo
  describe("2. salto de almuerzo", () => {
    it("cruza la pausa de 13:00 a 14:00", () => {
      const start = limaUTC("2026-05-04T12:00") // lunes 12:00
      // 1h restante hasta las 13:00, luego 1h más desde las 14:00 → 15:00
      const result = addBusinessTime(start, horas(2), cal)
      expect(result).toEqual(limaUTC("2026-05-04T15:00"))
    })

    it("8 horas laborables = de 09:00 a 18:00 (todo el día)", () => {
      const start = limaUTC("2026-05-04T09:00") // lunes
      const result = addBusinessTime(start, horas(8), cal)
      expect(result).toEqual(limaUTC("2026-05-04T18:00"))
    })
  })

  // 3. Cruzando fin de semana
  describe("3. cruce de fin de semana", () => {
    it("desde el viernes 17:00 + 1h → lunes 09:00 (fin viernes) + 0h = lunes 10:00", () => {
      // Viernes 17:00 → 1h disponible en viernes (hasta 18:00) = 60 min, exacto en 18:00
      // Luego necesita 0 min más → resultado es viernes 18:00
      const start = limaUTC("2026-05-01T17:00") // viernes
      const result = addBusinessTime(start, horas(1), cal)
      expect(result).toEqual(limaUTC("2026-05-01T18:00"))
    })

    it("desde viernes 17:00 + 2h cruza el fin de semana al lunes", () => {
      // Viernes 17:00 → 1h disponible (hasta 18:00), luego 1h más
      // Sábado y domingo: sin slots → lunes 09:00 + 1h = 10:00
      const start = limaUTC("2026-05-01T17:00") // viernes
      const result = addBusinessTime(start, horas(2), cal)
      expect(result).toEqual(limaUTC("2026-05-04T10:00")) // lunes 10:00
    })

    it("desde viernes 18:00 (fuera de jornada) + 8h → martes 09:00 + 0h... lunes completo", () => {
      const start = limaUTC("2026-05-01T18:00") // fin de viernes
      const result = addBusinessTime(start, horas(8), cal)
      // Próximo slot: lunes 09:00, + 8h → lunes 18:00
      expect(result).toEqual(limaUTC("2026-05-04T18:00"))
    })
  })

  // 4. Cruzando feriado puntual
  describe("4. feriado puntual", () => {
    const calConFeriado = calLima({
      feriados: [
        {
          fecha: new Date("2026-05-05T00:00:00Z"),
          nombre: "Día del Trabajo (fecha única)",
          recurrente: false,
        },
      ],
    })

    it("desde lunes 17:00 con martes feriado → salta al miércoles", () => {
      // start: lunes 05-04 17:00 → 1h disponible (hasta 18:00)
      // Martes 05-05: feriado → saltado
      // Miércoles 05-06: slot 09:00 + (2-1)h = 10:00
      const start = limaUTC("2026-05-04T17:00")
      const result = addBusinessTime(start, horas(2), calConFeriado)
      expect(result).toEqual(limaUTC("2026-05-06T10:00"))
    })
  })

  // 5. Cruzando feriado recurrente
  describe("5. feriado recurrente", () => {
    const calConRecurrente = calLima({
      feriados: [
        {
          fecha: new Date("2026-07-28T00:00:00Z"), // 28 de julio (Fiestas Patrias Perú)
          nombre: "Fiestas Patrias",
          recurrente: true, // aplica cada año en 07-28
        },
      ],
    })

    it("el 28 de julio de cualquier año es feriado", () => {
      const lunes28jul2025 = limaUTC("2025-07-28T10:00")
      expect(esHoraLaboral(lunes28jul2025, calConRecurrente)).toBe(false)
    })

    it("avanza saltando el feriado recurrente", () => {
      // Lunes 28-jul-2025: feriado → salta a martes 29-jul-2025 09:00
      const start = limaUTC("2025-07-27T17:00") // domingo (sin slots), ajusta al lunes 28
      // start (domingo 17:00) → siguiente slot laboral: martes 29 09:00 (28 es feriado)
      // + 1h → martes 10:00
      const result = addBusinessTime(start, horas(1), calConRecurrente)
      expect(result).toEqual(limaUTC("2025-07-29T10:00"))
    })
  })

  // 6. Duration cero (hito)
  describe("6. duration = 0 (hito)", () => {
    it("devuelve exactamente start sin modificar", () => {
      const start = limaUTC("2026-05-04T10:00")
      const result = addBusinessTime(start, 0, cal)
      expect(result).toEqual(start)
      expect(result).not.toBe(start) // nueva instancia
    })

    it("funciona incluso si start está fuera de horario laboral", () => {
      const finde = limaUTC("2026-05-02T15:00") // sábado
      const result = addBusinessTime(finde, 0, cal)
      expect(result).toEqual(finde)
    })
  })

  // 7. Duration negativo (backward pass para ruta crítica)
  describe("7. duration negativo", () => {
    it("retrocede 2h desde las 11:00 → 09:00", () => {
      const start = limaUTC("2026-05-04T11:00")
      const result = addBusinessTime(start, horas(-2), cal)
      expect(result).toEqual(limaUTC("2026-05-04T09:00"))
    })

    it("retrocede cruzando la pausa de almuerzo (de 15:00 retroceder 3h → 11:00)", () => {
      // 15:00 → 1h atrás = 14:00 (inicio turno tarde)
      // Luego salto a fin del turno mañana = 13:00
      // 13:00 → 2h atrás = 11:00
      const start = limaUTC("2026-05-04T15:00")
      const result = addBusinessTime(start, horas(-3), cal)
      expect(result).toEqual(limaUTC("2026-05-04T11:00"))
    })

    it("retrocede cruzando el fin de semana (lunes 09:00 − 1h → viernes 17:00... wait no)", () => {
      // Lunes 10:00 − 2h:
      //   1h dentro del turno mañana → 09:00 (inicio)
      //   salto al slot anterior: viernes turno tarde → 13:00 a 18:00 → fin = 18:00
      //   1h atrás desde 18:00 → 17:00
      const start = limaUTC("2026-05-04T10:00") // lunes
      const result = addBusinessTime(start, horas(-2), cal)
      expect(result).toEqual(limaUTC("2026-05-01T17:00")) // viernes
    })
  })

  // 8. Start fuera del horario laboral (ajuste automático)
  describe("8. start fuera de horario laboral", () => {
    it("start en sábado: avanza al lunes + duration", () => {
      const start = limaUTC("2026-05-02T10:00") // sábado
      const result = addBusinessTime(start, horas(1), cal)
      expect(result).toEqual(limaUTC("2026-05-04T10:00")) // lunes 09:00 + 1h
    })

    it("start en hora de almuerzo: avanza al próximo slot + duration", () => {
      const start = limaUTC("2026-05-04T13:30") // lunes, hora de almuerzo
      const result = addBusinessTime(start, horas(1), cal)
      expect(result).toEqual(limaUTC("2026-05-04T15:00")) // 14:00 + 1h
    })

    it("start antes del horario: avanza a las 09:00 + duration", () => {
      const start = limaUTC("2026-05-04T07:00") // lunes 07:00, antes de jornada
      const result = addBusinessTime(start, horas(2), cal)
      expect(result).toEqual(limaUTC("2026-05-04T11:00"))
    })
  })
})

// ── Tests de businessMinutesBetween ─────────────────────────────────────────

describe("businessMinutesBetween", () => {
  const cal = calLima()

  it("mismo día, mismo slot", () => {
    const start = limaUTC("2026-05-04T10:00")
    const end = limaUTC("2026-05-04T12:00")
    expect(businessMinutesBetween(start, end, cal)).toBe(120)
  })

  it("cruzando almuerzo: 2h en turno mañana + 2h en tarde = 4h", () => {
    const start = limaUTC("2026-05-04T11:00")
    const end = limaUTC("2026-05-04T16:00")
    expect(businessMinutesBetween(start, end, cal)).toBe(240)
  })

  it("cruzando fin de semana: viernes 17:00 a lunes 10:00 = 1h + 1h = 2h", () => {
    const start = limaUTC("2026-05-01T17:00") // viernes
    const end = limaUTC("2026-05-04T10:00")   // lunes
    expect(businessMinutesBetween(start, end, cal)).toBe(120)
  })

  it("start === end → 0", () => {
    const d = limaUTC("2026-05-04T10:00")
    expect(businessMinutesBetween(d, d, cal)).toBe(0)
  })

  it("start > end → 0", () => {
    const start = limaUTC("2026-05-04T12:00")
    const end = limaUTC("2026-05-04T10:00")
    expect(businessMinutesBetween(start, end, cal)).toBe(0)
  })
})

// ── Tests de esHoraLaboral ────────────────────────────────────────────────────

describe("esHoraLaboral", () => {
  const cal = calLima()

  it("dentro del turno mañana", () => {
    expect(esHoraLaboral(limaUTC("2026-05-04T10:00"), cal)).toBe(true)
  })

  it("durante almuerzo", () => {
    expect(esHoraLaboral(limaUTC("2026-05-04T13:30"), cal)).toBe(false)
  })

  it("sábado", () => {
    expect(esHoraLaboral(limaUTC("2026-05-02T10:00"), cal)).toBe(false)
  })

  it("exactamente a las 09:00 (inicio inclusivo)", () => {
    expect(esHoraLaboral(limaUTC("2026-05-04T09:00"), cal)).toBe(true)
  })

  it("exactamente a las 13:00 (fin exclusivo)", () => {
    expect(esHoraLaboral(limaUTC("2026-05-04T13:00"), cal)).toBe(false)
  })

  it("feriado dentro de horario laboral", () => {
    const calFeriado = calLima({
      feriados: [{ fecha: new Date("2026-05-04T00:00:00Z"), nombre: "Prueba", recurrente: false }],
    })
    expect(esHoraLaboral(limaUTC("2026-05-04T10:00"), calFeriado)).toBe(false)
  })
})
