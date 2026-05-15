"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { esJefeDelArea } from "@/lib/tareas/helpers";

type ActionResult = { success: boolean; error?: string };

async function puedeGestionar(callerId: string, targetId: string): Promise<{
  ok: boolean;
  motivo?: string;
}> {
  if (callerId === targetId) {
    return { ok: false, motivo: "No podés modificar tu propia cuenta desde acá." };
  }
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { rol: true, puesto: { select: { nombre: true } } },
  });
  if (!caller) return { ok: false, motivo: "Sesión inválida." };

  const esAdmin = caller.rol === "ADMIN" || caller.rol === "RRHH";
  if (esAdmin) return { ok: true };

  const esJefe = caller.puesto?.nombre?.startsWith("Jefe") ?? false;
  if (!esJefe) return { ok: false, motivo: "Solo administradores y jefes pueden hacerlo." };

  const enMiEquipo = await esJefeDelArea(callerId, targetId);
  if (!enMiEquipo) {
    return { ok: false, motivo: "Solo podés gestionar usuarios de tu propia área." };
  }
  return { ok: true };
}

export async function desactivarMiembroAction(userId: string): Promise<ActionResult> {
  const caller = await requireAuth();
  const check = await puedeGestionar(caller.id, userId);
  if (!check.ok) return { success: false, error: check.motivo };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { activo: true, rol: true },
  });
  if (!target) return { success: false, error: "Usuario no encontrado." };
  if (!target.activo) return { success: false, error: "La cuenta ya está inactiva." };

  // Un jefe no puede desactivar a un admin
  const callerEsAdmin = caller.rol === "ADMIN" || caller.rol === "RRHH";
  if (!callerEsAdmin && target.rol === "ADMIN") {
    return { success: false, error: "No tenés permiso para desactivar a un administrador." };
  }

  await prisma.user.update({ where: { id: userId }, data: { activo: false } });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  revalidatePath("/mi-equipo");
  revalidatePath(`/mi-equipo/${userId}`);
  revalidateTag("admin-usuarios", "max");
  revalidateTag("panel-equipo", "max");

  return { success: true };
}

export async function reactivarMiembroAction(userId: string): Promise<ActionResult> {
  const caller = await requireAuth();
  const check = await puedeGestionar(caller.id, userId);
  if (!check.ok) return { success: false, error: check.motivo };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { activo: true },
  });
  if (!target) return { success: false, error: "Usuario no encontrado." };
  if (target.activo) return { success: false, error: "La cuenta ya está activa." };

  await prisma.user.update({ where: { id: userId }, data: { activo: true } });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  revalidatePath("/mi-equipo");
  revalidatePath(`/mi-equipo/${userId}`);
  revalidateTag("admin-usuarios", "max");
  revalidateTag("panel-equipo", "max");

  return { success: true };
}
