import { describe, it, expect } from "vitest";
import { PUNTOS_COMPROMISO } from "@/lib/compromisos/constantes";

describe("PUNTOS_COMPROMISO", () => {
  it("A_TIEMPO_VALIDADO = 25 (mayor puntaje)", () => {
    expect(PUNTOS_COMPROMISO.A_TIEMPO_VALIDADO).toBe(25);
  });

  it("A_TIEMPO_AUTO = 20", () => {
    expect(PUNTOS_COMPROMISO.A_TIEMPO_AUTO).toBe(20);
  });

  it("CON_RETRASO = 10 (penalizado pero positivo)", () => {
    expect(PUNTOS_COMPROMISO.CON_RETRASO).toBe(10);
  });

  it("NO_CUMPLIDO = 0 (sin puntos)", () => {
    expect(PUNTOS_COMPROMISO.NO_CUMPLIDO).toBe(0);
  });

  it("jerarquia: validado > auto > retraso > no cumplido", () => {
    expect(PUNTOS_COMPROMISO.A_TIEMPO_VALIDADO).toBeGreaterThan(PUNTOS_COMPROMISO.A_TIEMPO_AUTO);
    expect(PUNTOS_COMPROMISO.A_TIEMPO_AUTO).toBeGreaterThan(PUNTOS_COMPROMISO.CON_RETRASO);
    expect(PUNTOS_COMPROMISO.CON_RETRASO).toBeGreaterThan(PUNTOS_COMPROMISO.NO_CUMPLIDO);
  });

  it("todos los valores son no negativos", () => {
    for (const v of Object.values(PUNTOS_COMPROMISO)) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});
