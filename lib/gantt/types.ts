export type SlotHorario = {
  inicio: string // "HH:mm"
  fin: string    // "HH:mm"
}

export type DiaSemana = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom"

export type HorarioSemanal = Record<DiaSemana, SlotHorario[]>

export type FeriadoGantt = {
  fecha: Date    // UTC — se compara en la timezone del calendario
  nombre: string
  recurrente: boolean
}

export type CalendarioGantt = {
  id: string
  nombre: string
  timezone: string // IANA, ej: "America/Lima"
  horario: HorarioSemanal
  feriados: FeriadoGantt[]
}
