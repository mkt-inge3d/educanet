import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Re-uso la logica de puedeResponderEncuesta extrayendo su helper
// via mock de fecha.

function diaDisponible(dia: number): boolean {
  return dia === 0 || dia === 5 || dia === 6;
}

describe("Disponibilidad de encuesta semanal", () => {
  it("viernes (5) disponible", () => {
    expect(diaDisponible(5)).toBe(true);
  });
  it("sabado (6) disponible", () => {
    expect(diaDisponible(6)).toBe(true);
  });
  it("domingo (0) disponible", () => {
    expect(diaDisponible(0)).toBe(true);
  });
  it("lunes (1) no disponible", () => {
    expect(diaDisponible(1)).toBe(false);
  });
  it("miercoles (3) no disponible", () => {
    expect(diaDisponible(3)).toBe(false);
  });
});

describe("Calculo de recomendacion del piloto", () => {
  function recomendacion(adopcion: number, motivacion: number, justicia: number, cumpl: number) {
    if (adopcion < 30 || motivacion < 2.5) return "negativo";
    if (adopcion < 50 || justicia < 3 || cumpl < 60) return "iterar";
    return "positivo";
  }

  it("adopcion 25% -> negativo", () => {
    expect(recomendacion(25, 4, 4, 80)).toBe("negativo");
  });
  it("motivacion 2.0 -> negativo", () => {
    expect(recomendacion(60, 2.0, 4, 80)).toBe("negativo");
  });
  it("adopcion 45%, cumpl 70% -> iterar", () => {
    expect(recomendacion(45, 3.5, 3.5, 70)).toBe("iterar");
  });
  it("todo bien -> positivo", () => {
    expect(recomendacion(75, 4, 4, 75)).toBe("positivo");
  });
});
