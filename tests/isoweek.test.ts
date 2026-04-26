import { describe, it, expect } from "vitest";
import { isoWeek } from "@/lib/kpis/instancias-generador";

describe("isoWeek", () => {
  it("2024-01-01 (lunes) = semana 1", () => {
    expect(isoWeek(new Date(2024, 0, 1))).toBe(1);
  });

  it("2024-01-07 (domingo de la semana 1) = semana 1", () => {
    expect(isoWeek(new Date(2024, 0, 7))).toBe(1);
  });

  it("2024-01-08 (lunes) = semana 2", () => {
    expect(isoWeek(new Date(2024, 0, 8))).toBe(2);
  });

  it("2024-12-30 = semana 1 (ISO pertenece a 2025)", () => {
    expect(isoWeek(new Date(2024, 11, 30))).toBe(1);
  });

  it("2023-01-01 = semana 52 (ISO del año anterior)", () => {
    // 2023-01-01 es domingo, pertenece a la semana 52 de 2022
    expect(isoWeek(new Date(2023, 0, 1))).toBe(52);
  });

  it("semanas validas estan entre 1 y 53", () => {
    // Verificar un año completo
    const date = new Date(2024, 0, 1);
    for (let i = 0; i < 365; i++) {
      const w = isoWeek(new Date(date.getTime() + i * 86400000));
      expect(w).toBeGreaterThanOrEqual(1);
      expect(w).toBeLessThanOrEqual(53);
    }
  });

  it("dias consecutivos incrementan o reinician la semana correctamente", () => {
    const lunes = new Date(2024, 0, 8); // semana 2
    const martes = new Date(2024, 0, 9);
    const domingo = new Date(2024, 0, 14);
    const lunesSig = new Date(2024, 0, 15); // semana 3

    expect(isoWeek(lunes)).toBe(2);
    expect(isoWeek(martes)).toBe(2);
    expect(isoWeek(domingo)).toBe(2);
    expect(isoWeek(lunesSig)).toBe(3);
  });
});
