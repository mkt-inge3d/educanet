import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  passwordStrength,
} from "@/lib/auth-schemas";

const CUID = "cld0000000000000000000000";

// ─── loginSchema ──────────────────────────────────────────────────

describe("loginSchema", () => {
  it("acepta credenciales validas", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "pass" }).success
    ).toBe(true);
  });

  it("rechaza email invalido", () => {
    expect(
      loginSchema.safeParse({ email: "no-es-email", password: "pass" }).success
    ).toBe(false);
  });

  it("rechaza email vacio", () => {
    expect(
      loginSchema.safeParse({ email: "", password: "pass" }).success
    ).toBe(false);
  });

  it("rechaza password vacia", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "" }).success
    ).toBe(false);
  });
});

// ─── registerSchema ───────────────────────────────────────────────

const baseRegister = {
  nombre: "Ana",
  apellido: "Lopez",
  email: "ana@example.com",
  password: "Segura123",
  confirmPassword: "Segura123",
  areaId: CUID,
  puestoId: CUID,
  acepteTerminos: true as const,
};

describe("registerSchema", () => {
  it("acepta datos validos", () => {
    expect(registerSchema.safeParse(baseRegister).success).toBe(true);
  });

  it("rechaza nombre menor a 2 caracteres", () => {
    expect(
      registerSchema.safeParse({ ...baseRegister, nombre: "A" }).success
    ).toBe(false);
  });

  it("rechaza apellido menor a 2 caracteres", () => {
    expect(
      registerSchema.safeParse({ ...baseRegister, apellido: "L" }).success
    ).toBe(false);
  });

  it("rechaza nombre mayor a 50 caracteres", () => {
    expect(
      registerSchema.safeParse({ ...baseRegister, nombre: "A".repeat(51) }).success
    ).toBe(false);
  });

  it("rechaza email invalido", () => {
    expect(
      registerSchema.safeParse({ ...baseRegister, email: "no-email" }).success
    ).toBe(false);
  });

  it("rechaza password sin mayuscula", () => {
    expect(
      registerSchema.safeParse({
        ...baseRegister,
        password: "sinmayuscula1",
        confirmPassword: "sinmayuscula1",
      }).success
    ).toBe(false);
  });

  it("rechaza password sin minuscula", () => {
    expect(
      registerSchema.safeParse({
        ...baseRegister,
        password: "SINMINUSCULA1",
        confirmPassword: "SINMINUSCULA1",
      }).success
    ).toBe(false);
  });

  it("rechaza password sin numero", () => {
    expect(
      registerSchema.safeParse({
        ...baseRegister,
        password: "SinNumeroAqui",
        confirmPassword: "SinNumeroAqui",
      }).success
    ).toBe(false);
  });

  it("rechaza password menor a 8 caracteres", () => {
    expect(
      registerSchema.safeParse({
        ...baseRegister,
        password: "Ab1",
        confirmPassword: "Ab1",
      }).success
    ).toBe(false);
  });

  it("rechaza cuando confirmPassword no coincide", () => {
    expect(
      registerSchema.safeParse({
        ...baseRegister,
        confirmPassword: "Diferente123",
      }).success
    ).toBe(false);
  });

  it("error de confirmPassword apunta al campo confirmPassword", () => {
    const r = registerSchema.safeParse({
      ...baseRegister,
      confirmPassword: "Diferente123",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((e) => e.path[0]);
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rechaza sin aceptar terminos", () => {
    expect(
      registerSchema.safeParse({
        ...baseRegister,
        acepteTerminos: false as unknown as true,
      }).success
    ).toBe(false);
  });

  it("rechaza areaId vacio", () => {
    expect(
      registerSchema.safeParse({ ...baseRegister, areaId: "" }).success
    ).toBe(false);
  });

  it("rechaza puestoId vacio", () => {
    expect(
      registerSchema.safeParse({ ...baseRegister, puestoId: "" }).success
    ).toBe(false);
  });
});

// ─── resetPasswordSchema ──────────────────────────────────────────

describe("resetPasswordSchema", () => {
  it("acepta email valido", () => {
    expect(
      resetPasswordSchema.safeParse({ email: "user@example.com" }).success
    ).toBe(true);
  });

  it("rechaza email invalido", () => {
    expect(
      resetPasswordSchema.safeParse({ email: "no-email" }).success
    ).toBe(false);
  });

  it("rechaza email vacio", () => {
    expect(
      resetPasswordSchema.safeParse({ email: "" }).success
    ).toBe(false);
  });
});

// ─── updatePasswordSchema ─────────────────────────────────────────

describe("updatePasswordSchema", () => {
  it("acepta contrasenas que coinciden y cumplen reglas", () => {
    expect(
      updatePasswordSchema.safeParse({
        password: "NuevaPass1",
        confirmPassword: "NuevaPass1",
      }).success
    ).toBe(true);
  });

  it("rechaza cuando no coinciden", () => {
    expect(
      updatePasswordSchema.safeParse({
        password: "NuevaPass1",
        confirmPassword: "Diferente1",
      }).success
    ).toBe(false);
  });

  it("rechaza password debil (sin numero)", () => {
    expect(
      updatePasswordSchema.safeParse({
        password: "SoloLetras",
        confirmPassword: "SoloLetras",
      }).success
    ).toBe(false);
  });
});

// ─── passwordStrength ─────────────────────────────────────────────

describe("passwordStrength", () => {
  it("cadena vacia = 0", () => {
    expect(passwordStrength("")).toBe(0);
  });

  it("solo 8 chars = 1 (cumple longitud minima)", () => {
    expect(passwordStrength("aaaaaaaa")).toBe(1);
  });

  it("12+ chars = 2", () => {
    expect(passwordStrength("aaaaaaaaaaaa")).toBe(2);
  });

  it("12+ chars + mayus+minus = 3", () => {
    expect(passwordStrength("AaBbCcDdEeFf")).toBe(3);
  });

  it("12+ chars + mayus+minus + numeros+especiales = 4 (maximo)", () => {
    expect(passwordStrength("AaBbCcDd1234!")).toBe(4);
  });

  it("retorna siempre entre 0 y 4", () => {
    const casos = ["", "a", "Abcde123", "AaBbCcDdEeFf1!", "x".repeat(100)];
    for (const c of casos) {
      const s = passwordStrength(c);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(4);
    }
  });
});
