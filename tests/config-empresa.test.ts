import { describe, it, expect } from "vitest";
import { CONFIG_EMPRESA } from "@/lib/config/empresa";

describe("CONFIG_EMPRESA", () => {
  it("tiene nombre de empresa", () => {
    expect(CONFIG_EMPRESA.nombre).toBeTruthy();
  });

  it("tiene mision y vision definidas", () => {
    expect(CONFIG_EMPRESA.mision.length).toBeGreaterThan(10);
    expect(CONFIG_EMPRESA.vision.length).toBeGreaterThan(10);
  });

  it("tiene exactamente 4 valores corporativos", () => {
    expect(CONFIG_EMPRESA.valores).toHaveLength(4);
  });

  it("cada valor tiene titulo y descripcion", () => {
    for (const v of CONFIG_EMPRESA.valores) {
      expect(v.titulo).toBeTruthy();
      expect(v.descripcion.length).toBeGreaterThan(5);
    }
  });

  it("titulos de valores son unicos", () => {
    const titulos = CONFIG_EMPRESA.valores.map((v) => v.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  it("contactoRRHH tiene nombre, email y horario", () => {
    const { contactoRRHH } = CONFIG_EMPRESA;
    expect(contactoRRHH.nombre).toBeTruthy();
    expect(contactoRRHH.email).toContain("@");
    expect(contactoRRHH.horario).toBeTruthy();
  });

  it("tiene al menos 4 FAQs", () => {
    expect(CONFIG_EMPRESA.faq.length).toBeGreaterThanOrEqual(4);
  });

  it("cada FAQ tiene pregunta y respuesta no vacias", () => {
    for (const item of CONFIG_EMPRESA.faq) {
      expect(item.pregunta.length).toBeGreaterThan(5);
      expect(item.respuesta.length).toBeGreaterThan(5);
      expect(item.pregunta.endsWith("?")).toBe(true);
    }
  });

  it("preguntas FAQ son unicas", () => {
    const preguntas = CONFIG_EMPRESA.faq.map((f) => f.pregunta);
    expect(new Set(preguntas).size).toBe(preguntas.length);
  });
});
