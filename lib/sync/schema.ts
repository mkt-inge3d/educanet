import { z } from "zod";

/**
 * Schema del payload que Estratega envía a Educanet.
 *
 * Endpoint: POST /api/sync/from-estratega
 * Headers:
 *   - X-Org-Slug: <slug de la org destino>
 *   - X-Estratega-Signature: sha256=<hex>
 *   - Content-Type: application/json
 */

export const issueSyncSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  ownerEmail: z.string().email().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimateMinutes: z.number().int().positive().optional().nullable(),
  isMilestone: z.boolean().optional().default(false),
});

export const proyectoSyncSchema = z.object({
  sourceApp: z.literal("estratega"),
  sourceProjectId: z.string().min(1),
  nombre: z.string().min(1).max(500),
  descripcion: z.string().max(10000).optional().nullable(),
  categoria: z.enum([
    "WEBINAR",
    "CAMPANA_MARKETING",
    "LANZAMIENTO_CURSO",
    "EVENTO_PRESENCIAL",
  ]),
  fechaHito: z.string().datetime(),
  negocio: z
    .enum([
      "ANSYS",
      "AUTODESK_MFG",
      "AUTODESK_AEC",
      "ORACLE",
      "INGE3D",
      "LYRACODE",
      "CURSOS",
    ])
    .optional()
    .nullable(),
  ownerEmail: z.string().email(),
  issues: z.array(issueSyncSchema).default([]),
});

export type ProyectoSyncPayload = z.infer<typeof proyectoSyncSchema>;
export type IssueSyncPayload = z.infer<typeof issueSyncSchema>;
