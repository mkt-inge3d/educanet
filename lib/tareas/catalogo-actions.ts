"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireAuth } from "@/lib/auth";
import { asignarTareasOnboarding } from "./onboarding";

export async function toggleEsOnboardingAction(
  id: string,
  esOnboarding: boolean,
): Promise<{ success: boolean; error?: string }> {
  await requireRole(["ADMIN", "RRHH"]);
  await prisma.catalogoTarea.update({ where: { id }, data: { esOnboarding } });
  revalidatePath("/admin/catalogo-tareas");
  return { success: true };
}

export async function dispararOnboardingUsuarioAction(
  userId: string,
): Promise<{ success: boolean; asignadas: number; error?: string }> {
  const caller = await requireAuth();
  const esAdmin = caller.rol === "ADMIN" || caller.rol === "RRHH";
  const esJefe = caller.puesto?.nombre?.startsWith("Jefe") ?? false;
  if (!esAdmin && !esJefe) {
    return { success: false, asignadas: 0, error: "Sin permiso" };
  }

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { puestoId: true },
  });

  if (!usuario?.puestoId) {
    return { success: false, asignadas: 0, error: "El usuario no tiene puesto asignado" };
  }

  const tareasAntes = await prisma.tareaInstancia.count({ where: { asignadoAId: userId } });
  await asignarTareasOnboarding(userId, usuario.puestoId);
  const tareasDespues = await prisma.tareaInstancia.count({ where: { asignadoAId: userId } });

  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true, asignadas: tareasDespues - tareasAntes };
}

/**
 * Permite a un usuario autenticado cargar las tareas por defecto
 * (workflow vigente del equipo) en su propia cuenta. Pensado para
 * cuentas nuevas que se crean vacias y quieren probar el flujo.
 * Solo funciona si el usuario aun no tiene tareas asignadas.
 */
export async function cargarTareasPorDefectoSelfAction(): Promise<{
  success: boolean;
  asignadas: number;
  error?: string;
}> {
  const caller = await requireAuth();

  if (!caller.puestoId) {
    return { success: false, asignadas: 0, error: "Tu cuenta no tiene puesto asignado" };
  }

  const tareasAntes = await prisma.tareaInstancia.count({
    where: { asignadoAId: caller.id },
  });

  if (tareasAntes > 0) {
    return {
      success: false,
      asignadas: 0,
      error: "Ya tienes tareas asignadas. Esta opcion solo aplica a cuentas vacias.",
    };
  }

  await asignarTareasOnboarding(caller.id, caller.puestoId);

  const tareasDespues = await prisma.tareaInstancia.count({
    where: { asignadoAId: caller.id },
  });

  revalidatePath("/tareas");
  revalidatePath("/proyectos");
  revalidatePath("/perfil");

  return { success: true, asignadas: tareasDespues - tareasAntes };
}
