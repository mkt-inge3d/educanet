import { describe, it, expect } from "vitest";
import { NEGOCIOS, LISTA_NEGOCIOS, infoNegocio } from "@/lib/tareas/negocios";

const CODIGOS_ESPERADOS = [
  "ANSYS",
  "AUTODESK_MFG",
  "AUTODESK_AEC",
  "ORACLE",
  "INGE3D",
  "LYRACODE",
  "CURSOS",
] as const;

describe("NEGOCIOS catalog", () => {
  it("contiene los 7 negocios del piloto", () => {
    for (const codigo of CODIGOS_ESPERADOS) {
      expect(NEGOCIOS).toHaveProperty(codigo);
    }
  });

  it("cada negocio tiene label, labelCorto, color, badgeClass, borderClass, dotClass", () => {
    for (const codigo of CODIGOS_ESPERADOS) {
      const n = NEGOCIOS[codigo];
      expect(n.label).toBeTruthy();
      expect(n.labelCorto).toBeTruthy();
      expect(n.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(n.badgeClass).toBeTruthy();
      expect(n.borderClass).toBeTruthy();
      expect(n.dotClass).toBeTruthy();
    }
  });

  it("el campo codigo coincide con la clave del mapa", () => {
    for (const codigo of CODIGOS_ESPERADOS) {
      expect(NEGOCIOS[codigo].codigo).toBe(codigo);
    }
  });

  it("todos los colores hex son distintos entre si", () => {
    const colores = CODIGOS_ESPERADOS.map((c) => NEGOCIOS[c].color);
    const unicos = new Set(colores);
    expect(unicos.size).toBe(colores.length);
  });
});

describe("LISTA_NEGOCIOS", () => {
  it("tiene 7 entradas", () => {
    expect(LISTA_NEGOCIOS.length).toBe(7);
  });

  it("todos los codigos de LISTA_NEGOCIOS estan en NEGOCIOS", () => {
    for (const n of LISTA_NEGOCIOS) {
      expect(NEGOCIOS).toHaveProperty(n.codigo);
    }
  });

  it("no hay duplicados de codigo en la lista", () => {
    const codigos = LISTA_NEGOCIOS.map((n) => n.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});

describe("infoNegocio", () => {
  it("retorna null para null", () => {
    expect(infoNegocio(null)).toBeNull();
  });

  it("retorna null para undefined", () => {
    expect(infoNegocio(undefined)).toBeNull();
  });

  it("retorna el negocio correcto por codigo", () => {
    const info = infoNegocio("ANSYS");
    expect(info).not.toBeNull();
    expect(info!.codigo).toBe("ANSYS");
    expect(info!.label).toBe("Ansys");
  });

  it("retorna datos completos para cada codigo valido", () => {
    for (const codigo of CODIGOS_ESPERADOS) {
      const info = infoNegocio(codigo);
      expect(info).not.toBeNull();
      expect(info!.color).toMatch(/^#/);
    }
  });
});
