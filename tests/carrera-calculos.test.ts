import { describe, it, expect } from "vitest";
import { calcularProgresoRuta } from "@/lib/carrera/calculos";
import type { RutaCarreraCompleta } from "@/types/carrera";

function rutaVacia(): RutaCarreraCompleta {
  return { cursos: [], metricas: [] } as unknown as RutaCarreraCompleta;
}

function curso(estado: "completado" | "en-progreso" | "no-iniciado", porcentaje = 0) {
  return {
    requerido: true,
    estado,
    porcentaje,
    curso: { id: "c1", titulo: "Curso Test", slug: "curso-test" },
  };
}

function metrica(cumplida: boolean, valorActual: number | null = null, valorObjetivo = 100) {
  return {
    nombre: "KPI Test",
    cumplida,
    valorActual,
    valorObjetivo,
    unidad: "%",
  };
}

describe("calcularProgresoRuta", () => {
  describe("sin cursos ni metricas", () => {
    it("retorna 0%", () => {
      const r = calcularProgresoRuta(rutaVacia());
      expect(r.porcentajeTotal).toBe(0);
      expect(r.estaListo).toBe(false);
    });
  });

  describe("solo cursos (sin metricas)", () => {
    it("1 curso completado = 100%", () => {
      const ruta = { cursos: [curso("completado")], metricas: [] } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(100);
      expect(r.estaListo).toBe(true);
    });

    it("0 de 2 cursos completados = 0%", () => {
      const ruta = {
        cursos: [curso("no-iniciado"), curso("en-progreso", 50)],
        metricas: [],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(0);
    });

    it("1 de 2 cursos completados = 50%", () => {
      const ruta = {
        cursos: [curso("completado"), curso("no-iniciado")],
        metricas: [],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(50);
    });

    it("cursos no requeridos no cuentan", () => {
      const ruta = {
        cursos: [
          { ...curso("completado"), requerido: false },
          curso("completado"),
        ],
        metricas: [],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.cursosTotal).toBe(1);
      expect(r.cursosCompletados).toBe(1);
      expect(r.porcentajeTotal).toBe(100);
    });
  });

  describe("solo metricas (sin cursos)", () => {
    it("1 metrica cumplida = 100%", () => {
      const ruta = { cursos: [], metricas: [metrica(true)] } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(100);
    });

    it("0 de 2 metricas cumplidas = 0%", () => {
      const ruta = {
        cursos: [],
        metricas: [metrica(false), metrica(false)],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(0);
    });

    it("1 de 2 metricas cumplidas = 50%", () => {
      const ruta = {
        cursos: [],
        metricas: [metrica(true), metrica(false)],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(50);
    });
  });

  describe("formula ponderada 60% cursos + 40% metricas", () => {
    it("100% cursos + 0% metricas = 60%", () => {
      const ruta = {
        cursos: [curso("completado")],
        metricas: [metrica(false)],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(60);
    });

    it("0% cursos + 100% metricas = 40%", () => {
      const ruta = {
        cursos: [curso("no-iniciado")],
        metricas: [metrica(true)],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(40);
    });

    it("100% cursos + 100% metricas = 100%", () => {
      const ruta = {
        cursos: [curso("completado")],
        metricas: [metrica(true)],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(100);
      expect(r.estaListo).toBe(true);
    });

    it("50% cursos + 50% metricas = 50%", () => {
      const ruta = {
        cursos: [curso("completado"), curso("no-iniciado")],
        metricas: [metrica(true), metrica(false)],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.porcentajeTotal).toBe(50);
    });
  });

  describe("siguientesPasos", () => {
    it("muestra cursos pendientes primero (max 3)", () => {
      const ruta = {
        cursos: [
          { ...curso("en-progreso", 30), curso: { id: "c1", titulo: "A", slug: "a" } },
          { ...curso("no-iniciado"), curso: { id: "c2", titulo: "B", slug: "b" } },
          { ...curso("no-iniciado"), curso: { id: "c3", titulo: "C", slug: "c" } },
          { ...curso("no-iniciado"), curso: { id: "c4", titulo: "D", slug: "d" } },
        ],
        metricas: [],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.siguientesPasos.length).toBe(3);
      expect(r.siguientesPasos.every((p) => p.tipo === "CURSO")).toBe(true);
    });

    it("muestra metricas cuando no hay suficientes cursos pendientes", () => {
      const ruta = {
        cursos: [curso("completado")],
        metricas: [metrica(false, 40, 100), metrica(false, null, 50)],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.siguientesPasos.some((p) => p.tipo === "METRICA")).toBe(true);
    });

    it("curso en-progreso muestra porcentaje en descripcion", () => {
      const ruta = {
        cursos: [{ ...curso("en-progreso", 45), curso: { id: "c1", titulo: "T", slug: "t" } }],
        metricas: [],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.siguientesPasos[0].descripcion).toContain("45%");
    });

    it("no incluye cursos ya completados en siguientesPasos", () => {
      const ruta = {
        cursos: [curso("completado"), { ...curso("no-iniciado"), curso: { id: "p", titulo: "P", slug: "p" } }],
        metricas: [],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.siguientesPasos.length).toBe(1);
    });
  });

  describe("contadores", () => {
    it("reporta cursosCompletados y cursosTotal correctamente", () => {
      const ruta = {
        cursos: [curso("completado"), curso("no-iniciado"), curso("en-progreso", 10)],
        metricas: [],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.cursosCompletados).toBe(1);
      expect(r.cursosTotal).toBe(3);
    });

    it("reporta metricasCumplidas y metricasTotal correctamente", () => {
      const ruta = {
        cursos: [],
        metricas: [metrica(true), metrica(true), metrica(false)],
      } as unknown as RutaCarreraCompleta;
      const r = calcularProgresoRuta(ruta);
      expect(r.metricasCumplidas).toBe(2);
      expect(r.metricasTotal).toBe(3);
    });
  });
});
