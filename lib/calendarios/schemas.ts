import { z } from "zod"

export const slotSchema = z.object({
  inicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
  fin: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
}).refine((s) => s.inicio < s.fin, { message: "El inicio debe ser anterior al fin" })

export const horarioSchema = z.object({
  lun: z.array(slotSchema),
  mar: z.array(slotSchema),
  mie: z.array(slotSchema),
  jue: z.array(slotSchema),
  vie: z.array(slotSchema),
  sab: z.array(slotSchema),
  dom: z.array(slotSchema),
})

export const crearCalendarioSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(80),
  timezone: z.string().min(1, "Selecciona una zona horaria"),
  horario: horarioSchema,
  esDefault: z.boolean().optional(),
})

export const actualizarCalendarioSchema = crearCalendarioSchema.partial()

export const feriadoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD requerido"),
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  recurrente: z.boolean().default(false),
  tipo: z.enum(["NACIONAL", "EMPRESA", "EQUIPO"]).default("NACIONAL"),
})

export type CrearCalendarioInput = z.infer<typeof crearCalendarioSchema>
export type FeriadoInput = z.infer<typeof feriadoSchema>
export type HorarioSemanal = z.infer<typeof horarioSchema>

export const HORARIO_ESTANDAR: HorarioSemanal = {
  lun: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
  mar: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
  mie: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
  jue: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
  vie: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
  sab: [],
  dom: [],
}

export const HORARIO_CONTINUO: HorarioSemanal = {
  lun: [{ inicio: "09:00", fin: "18:00" }],
  mar: [{ inicio: "09:00", fin: "18:00" }],
  mie: [{ inicio: "09:00", fin: "18:00" }],
  jue: [{ inicio: "09:00", fin: "18:00" }],
  vie: [{ inicio: "09:00", fin: "18:00" }],
  sab: [],
  dom: [],
}

// Zonas horarias más usadas en LATAM + algunas globales
export const TIMEZONES_COMUNES = [
  { label: "Lima / Bogotá / Quito (UTC-5)", value: "America/Lima" },
  { label: "Santiago de Chile (UTC-3/-4)", value: "America/Santiago" },
  { label: "Buenos Aires (UTC-3)", value: "America/Argentina/Buenos_Aires" },
  { label: "São Paulo (UTC-3)", value: "America/Sao_Paulo" },
  { label: "Ciudad de México (UTC-6)", value: "America/Mexico_City" },
  { label: "Nueva York (UTC-5/-4)", value: "America/New_York" },
  { label: "Los Ángeles (UTC-8/-7)", value: "America/Los_Angeles" },
  { label: "Madrid (UTC+1/+2)", value: "Europe/Madrid" },
  { label: "UTC", value: "UTC" },
]
