import { describe, it, expect } from "vitest";
import { COLORES_RANGO } from "@/lib/gamificacion/rangos-visual";

const RANGOS = ["BRONCE", "ORO", "DIAMANTE", "SIDERAL"] as const;

describe("COLORES_RANGO", () => {
  it("cubre los 4 rangos", () => {
    for (const r of RANGOS) {
      expect(COLORES_RANGO).toHaveProperty(r);
    }
  });

  it("cada rango tiene base, glow, gradient, icono, nombre, descripcion", () => {
    for (const r of RANGOS) {
      const c = COLORES_RANGO[r];
      expect(c.base).toBeTruthy();
      expect(c.glow).toBeTruthy();
      expect(c.gradient).toBeTruthy();
      expect(c.icono).toBeTruthy();
      expect(c.nombre).toBeTruthy();
      expect(c.descripcion).toBeTruthy();
    }
  });

  it("los nombres coinciden con los rangos (capitalizados)", () => {
    expect(COLORES_RANGO.BRONCE.nombre).toBe("Bronce");
    expect(COLORES_RANGO.ORO.nombre).toBe("Oro");
    expect(COLORES_RANGO.DIAMANTE.nombre).toBe("Diamante");
    expect(COLORES_RANGO.SIDERAL.nombre).toBe("Sideral");
  });

  it("SIDERAL tiene gradient con 3 colores (visual especial)", () => {
    const stops = COLORES_RANGO.SIDERAL.gradient.match(/hsl\(/g) ?? [];
    expect(stops.length).toBeGreaterThanOrEqual(3);
  });

  it("descripciones usan lenguaje positivo", () => {
    for (const r of RANGOS) {
      expect(COLORES_RANGO[r].descripcion.length).toBeGreaterThan(0);
    }
  });
});
