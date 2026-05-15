"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireAuth } from "@/lib/auth";
import { asignarTareasOnboarding, type ResultadoOnboarding } from "./onboarding";

export async function toggleEsOnboardingAction(
  id: string,
  esOnboarding: boolean,
): Promise<{ success: boolean; error?: string }> {
  await requireRole(["ADMIN", "RRHH"]);
  await prisma.catalogoTarea.update({ where: { id }, data: { esOnboarding } });
  revalidatePath("/admin/catalogo-tareas");
  return { success: true };
}

function describirError(motivo: Extract<ResultadoOnboarding, { ok: false }>["motivo"]): string {
  switch (motivo) {
    case "SIN_ORG":
      return "Tu cuenta no esta vinculada a una organizacion. Contacta a tu administrador.";
    case "CATALOGO_VACIO":
      return "No hay tareas plantilla activas para tu puesto. Pedile a tu administrador que las cargue en el catalogo.";
    case "SIN_REFERENCIA_NI_CATALOGO":
      return "No encontramos un companero del mismo puesto ni tareas plantilla para copiar.";
  }
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

  const resultado = await asignarTareasOnboarding(userId, usuario.puestoId);

  revalidatePath(`/admin/usuarios/${userId}`);

  if (!resultado.ok) {
    return { success: false, asignadas: 0, error: describirError(resultado.motivo) };
  }
  return { success: true, asignadas: resultado.asignadas };
}

/**
 * Permite a un usuario autenticado cargar las tareas por defecto en su
 * propia cuenta. Estrategia: copiar de un companero del mismo puesto, o
 * si no hay, instanciar desde el catalogo del puesto. Solo aplica a
 * cuentas vacias.
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

  const resultado = await asignarTareasOnboarding(caller.id, caller.puestoId);

  revalidatePath("/tareas");
  revalidatePath("/proyectos");
  revalidatePath("/perfil");

  if (!resultado.ok) {
    return { success: false, asignadas: 0, error: describirError(resultado.motivo) };
  }
  return { success: true, asignadas: resultado.asignadas };
}
