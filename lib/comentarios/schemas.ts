import { z } from "zod";

export const comentarioSchema = z.object({
  contenido: z
    .string()
    .min(1, "El comentario no puede estar vacio")
    .max(2000, "Maximo 2000 caracteres")
    .refine((c) => c.trim().length >= 1, "No puede ser solo espacios"),
  leccionId: z.string().cuid(),
  comentarioPadreId: z.string().cuid().optional(),
});

export const actualizarComentarioSchema = z.object({
  id: z.string().cuid(),
  contenido: z
    .string()
    .min(1)
    .max(2000)
    .refine((c) => c.trim().length >= 1, "No puede ser solo espacios"),
});

export const reporteSchema = z.object({
  comentarioId: z.string().cuid(),
  razon: z
    .string()
    .min(10, "Describe brevemente el motivo")
    .max(500, "Maximo 500 caracteres"),
});

export function sanitizarTextoPlano(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/\u0000/g, "")
    .trim();
}
