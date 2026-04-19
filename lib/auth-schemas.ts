import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo valido"),
  password: z
    .string()
    .min(1, "La contrasena es obligatoria"),
});

export const registerSchema = z
  .object({
    nombre: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre es demasiado largo"),
    apellido: z
      .string()
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(50, "El apellido es demasiado largo"),
    email: z
      .string()
      .min(1, "El correo es obligatorio")
      .email("Ingresa un correo valido"),
    password: z
      .string()
      .min(8, "La contrasena debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir al menos una mayuscula")
      .regex(/[a-z]/, "Debe incluir al menos una minuscula")
      .regex(/[0-9]/, "Debe incluir al menos un numero"),
    confirmPassword: z.string(),
    areaId: z.string().min(1, "Selecciona tu area"),
    puestoId: z.string().min(1, "Selecciona tu puesto"),
    acepteTerminos: z.literal(true, {
      message: "Debes aceptar los terminos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo valido"),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contrasena debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir al menos una mayuscula")
      .regex(/[a-z]/, "Debe incluir al menos una minuscula")
      .regex(/[0-9]/, "Debe incluir al menos un numero"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

/**
 * Calculate password strength (0-4).
 * 0=none, 1=weak, 2=fair, 3=strong, 4=excellent
 */
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
