import { describe, it, expect } from "vitest";
import {
  TOPES_MENSUALES,
  UMBRAL_MULTIPLICADOR,
  FACTOR_REDUCCION,
} from "@/lib/gamificacion/multiplicadores";

describe("TOPES_MENSUALES", () => {
  it("KPIS = 1000", () => {
    expect(TOPES_MENSUALES.KPIS).toBe(1000);
  });
  it("APRENDIZAJE = 400", () => {
    expect(TOPES_MENSUALES.APRENDIZAJE).toBe(400);
  });
  it("TAREAS_OPERATIVAS = 400", () => {
    expect(TOPES_MENSUALES.TAREAS_OPERATIVAS).toBe(400);
  });
  it("COMPROMISOS = 100", () => {
    expect(TOPES_MENSUALES.COMPROMISOS).toBe(100);
  });
  it("RECONOCIMIENTOS = 200", () => {
    expect(TOPES_MENSUALES.RECONOCIMIENTOS).toBe(200);
  });
  it("MISIONES = 200", () => {
    expect(TOPES_MENSUALES.MISIONES).toBe(200);
  });
  it("EQUIPO = 300", () => {
    expect(TOPES_MENSUALES.EQUIPO).toBe(300);
  });
  it("SISTEMA = Infinity (sin tope)", () => {
    expect(TOPES_MENSUALES.SISTEMA).toBe(Number.POSITIVE_INFINITY);
  });

  it("suma de topes finitos = 2600", () => {
    const finitos = Object.values(TOPES_MENSUALES).filter(
      (v) => v !== Number.POSITIVE_INFINITY
    );
    const total = finitos.reduce((a, b) => a + b, 0);
    expect(total).toBe(2600);
  });

  it("todas las fuentes FuenteXP estan cubiertas", () => {
    const fuentes = [
      "APRENDIZAJE",
      "KPIS",
      "TAREAS_OPERATIVAS",
      "COMPROMISOS",
      "RECONOCIMIENTOS",
      "MISIONES",
      "EQUIPO",
      "SISTEMA",
    ];
    for (const f of fuentes) {
      expect(TOPES_MENSUALES).toHaveProperty(f);
    }
  });
});

describe("UMBRAL_MULTIPLICADOR", () => {
  it("es 0.7 (70%)", () => {
    expect(UMBRAL_MULTIPLICADOR).toBe(0.7);
  });
});

describe("FACTOR_REDUCCION", () => {
  it("es 0.5 (50%)", () => {
    expect(FACTOR_REDUCCION).toBe(0.5);
  });

  it("aplicar FACTOR_REDUCCION a 100 pts da 50", () => {
    expect(Math.floor(100 * FACTOR_REDUCCION)).toBe(50);
  });

  it("aplicar FACTOR_REDUCCION a 7 pts da 3 (floor)", () => {
    expect(Math.floor(7 * FACTOR_REDUCCION)).toBe(3);
  });
});
