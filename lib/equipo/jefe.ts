import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { UserConRelaciones } from "@/types/database";

export function esJefe(user: Pick<UserConRelaciones, "puesto" | "rol">): boolean {
  const porPuesto = user.puesto?.nombre?.startsWith("Jefe") ?? false;
  const porRol = user.rol === "ADMIN" || user.rol === "RRHH";
  return porPuesto || porRol;
}

export async function requireJefe(): Promise<UserConRelaciones> {
  const user = await requireAuth();
  if (!esJefe(user)) redirect("/unauthorized");
  if (!user.areaId) redirect("/mi-progreso");
  return user;
}

export const obtenerMiEquipoIds = cache(async function obtenerMiEquipoIds(
  areaId: string,
  jefeId: string,
): Promise<string[]> {
  const miembros = await prisma.user.findMany({
    where: { areaId, activo: true, id: { not: jefeId } },
    select: { id: true },
  });
  return miembros.map((m) => m.id);
});
