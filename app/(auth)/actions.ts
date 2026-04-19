"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { loginSchema, registerSchema, resetPasswordSchema, updatePasswordSchema } from "@/lib/auth-schemas";
import { checkRateLimit, loginLimiter, registerLimiter, resetPasswordLimiter, getClientIp } from "@/lib/rate-limit";

type ActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  const rl = checkRateLimit(ip, loginLimiter);
  if (!rl.success) {
    return { error: "Demasiados intentos. Espera un momento antes de intentar de nuevo." };
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Correo o contrasena incorrectos" };
  }

  const redirectTo = formData.get("redirectTo") as string | null;
  redirect(redirectTo || "/cursos");
}

export async function registerAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  const rl = checkRateLimit(ip, registerLimiter);
  if (!rl.success) {
    return { error: "Demasiados intentos. Espera un momento." };
  }

  const raw = {
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    areaId: formData.get("areaId"),
    puestoId: formData.get("puestoId"),
    acepteTerminos: formData.get("acepteTerminos") === "on" ? true : undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        nombre: parsed.data.nombre,
        apellido: parsed.data.apellido,
        rol: "TRABAJADOR",
        areaId: parsed.data.areaId,
        puestoId: parsed.data.puestoId,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Este correo ya esta registrado" };
    }
    return { error: "Error al crear la cuenta. Intenta de nuevo." };
  }

  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (signInError) {
      return {
        error:
          "Cuenta creada. Revisa tu correo para confirmar tu direccion antes de iniciar sesion.",
      };
    }
  }

  redirect("/cursos");
}

export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const email = formData.get("email") as string;

  const rl = checkRateLimit(`${ip}:${email}`, resetPasswordLimiter);
  if (!rl.success) {
    return { error: "Demasiados intentos. Espera antes de intentar de nuevo." };
  }

  const parsed = resetPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
  });

  if (error) {
    return { error: "Error al enviar el correo. Intenta de nuevo." };
  }

  return { success: true, message: "Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena." };
}

export async function updatePasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = updatePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Error al actualizar la contrasena." };
  }

  return { success: true, message: "Contrasena actualizada correctamente." };
}
