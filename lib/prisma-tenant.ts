import { prisma } from "./prisma";

/**
 * Cliente Prisma con scope automático por organización.
 *
 * Auto-inyecta `where: { organizationId }` en lecturas y mutations masivas de
 * las tablas tenant. Para `findUnique` (que no acepta organizationId arbitrario
 * en el where), valida post-fetch y retorna null si el recurso pertenece a otra
 * org.
 *
 * Uso:
 *   const orgId = await requireCurrentOrgId();
 *   const db = prismaForOrg(orgId);
 *   const proyectos = await db.workflowInstancia.findMany();
 *
 * NOTA MVP: aún hay queries en la app que usan el cliente `prisma` sin scope
 * de org. Mientras solo exista 1 org en la DB (Semco), el aislamiento es
 * de facto correcto. Cuando se registre la org #2, migrar las queries listadas
 * en `TODO_MULTITENANT.md` a `prismaForOrg(orgId)`.
 */
export function prismaForOrg(organizationId: string) {
  const scopeWhere = (args: { where?: Record<string, unknown> }) => {
    args.where = { ...(args.where ?? {}), organizationId };
  };

  const tenantOps = {
    findMany: async ({ args, query }: { args: { where?: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) => {
      scopeWhere(args);
      return query(args);
    },
    findFirst: async ({ args, query }: { args: { where?: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) => {
      scopeWhere(args);
      return query(args);
    },
    findFirstOrThrow: async ({ args, query }: { args: { where?: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) => {
      scopeWhere(args);
      return query(args);
    },
    count: async ({ args, query }: { args: { where?: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) => {
      scopeWhere(args);
      return query(args);
    },
    aggregate: async ({ args, query }: { args: { where?: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) => {
      scopeWhere(args);
      return query(args);
    },
    groupBy: async ({ args, query }: { args: { where?: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) => {
      scopeWhere(args);
      return query(args);
    },
    updateMany: async ({ args, query }: { args: { where?: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) => {
      scopeWhere(args);
      return query(args);
    },
    deleteMany: async ({ args, query }: { args: { where?: Record<string, unknown> }; query: (a: unknown) => Promise<unknown> }) => {
      scopeWhere(args);
      return query(args);
    },
    findUnique: async ({ args, query }: { args: unknown; query: (a: unknown) => Promise<unknown> }) => {
      const result = (await query(args)) as { organizationId?: string } | null;
      if (result && result.organizationId !== organizationId) return null;
      return result;
    },
    findUniqueOrThrow: async ({ args, query }: { args: unknown; query: (a: unknown) => Promise<unknown> }) => {
      const result = (await query(args)) as { organizationId?: string };
      if (result.organizationId !== organizationId) {
        throw new Error("Recurso no pertenece a la organización actual");
      }
      return result;
    },
  };

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      workflowInstancia: tenantOps,
      tareaInstancia: tenantOps,
      workflowPlantilla: tenantOps,
      catalogoTarea: tenantOps,
      origenExterno: tenantOps,
    },
  });
}

export type PrismaForOrg = ReturnType<typeof prismaForOrg>;
