import { describe, it, expect } from "vitest";
import {
  calcularCumplimiento,
  clasificarDesempeno,
} from "@/lib/desempeno/calculos";

describe("calcularCumplimiento", () => {
  it("100% cuando valor == objetivo", () => {
    expect(calcularCumplimiento(100, 100)).toBe(100);
  });
  it("50% cuando valor es la mitad del objetivo", () => {
    expect(calcularCumplimiento(50, 100)).toBe(50);
  });
  it("puede superar 100% si valor > objetivo", () => {
    expect(calcularCumplimiento(120, 100)).toBe(120);
  });
  it("0% cuando objetivo es 0 (evita div/0)", () => {
    expect(calcularCumplimiento(5, 0)).toBe(0);
  });
  it("0% cuando valor es 0", () => {
    expect(calcularCumplimiento(0, 100)).toBe(0);
  });
  it("redondea al entero mas cercano", () => {
    expect(calcularCumplimiento(1, 3)).toBe(33);
  });
});

describe("clasificarDesempeno", () => {
  it(">=100 = Destacado", () => {
    expect(clasificarDesempeno(100).etiqueta).toBe("Destacado");
    expect(clasificarDesempeno(120).etiqueta).toBe("Destacado");
  });

  it(">=90 y <100 = Cumpliendo", () => {
    expect(clasificarDesempeno(90).etiqueta).toBe("Cumpliendo");
    expect(clasificarDesempeno(99).etiqueta).toBe("Cumpliendo");
  });

  it(">=75 y <90 = En camino", () => {
    expect(clasificarDesempeno(75).etiqueta).toBe("En camino");
    expect(clasificarDesempeno(89).etiqueta).toBe("En camino");
  });

  it(">=50 y <75 = Por mejorar", () => {
    expect(clasificarDesempeno(50).etiqueta).toBe("Por mejorar");
    expect(clasificarDesempeno(74).etiqueta).toBe("Por mejorar");
  });

  it("<50 = En desarrollo", () => {
    expect(clasificarDesempeno(0).etiqueta).toBe("En desarrollo");
    expect(clasificarDesempeno(49).etiqueta).toBe("En desarrollo");
  });

  it("cada nivel retorna color y mensaje no vacios", () => {
    for (const pct of [0, 50, 75, 90, 100]) {
      const r = clasificarDesempeno(pct);
      expect(r.color).toBeTruthy();
      expect(r.mensaje.length).toBeGreaterThan(0);
    }
  });

  it("lenguaje positivo: ningun mensaje contiene palabras negativas", () => {
    const palabrasNegativas = ["malo", "falla", "fracas", "pésimo", "deficiente"];
    for (const pct of [0, 25, 49, 74, 89, 99, 100]) {
      const { mensaje, etiqueta } = clasificarDesempeno(pct);
      for (const palabra of palabrasNegativas) {
        expect(mensaje.toLowerCase()).not.toContain(palabra);
        expect(etiqueta.toLowerCase()).not.toContain(palabra);
      }
    }
  });

  it("cubre exactamente 5 niveles distintos de etiqueta", () => {
    const etiquetas = new Set(
      [0, 50, 75, 90, 100].map((p) => clasificarDesempeno(p).etiqueta)
    );
    expect(etiquetas.size).toBe(5);
  });
});
