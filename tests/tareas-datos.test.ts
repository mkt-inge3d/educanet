import { describe, it, expect } from "vitest";
import { datosTarea, TOPE_MENSUAL_TAREAS_OPERATIVAS } from "@/lib/tareas/tarea-datos";

const catalogoBase = {
  nombre: "Revisar propuesta",
  descripcion: "Revisar propuesta comercial",
  tiempoMinimoMin: 30,
  tiempoMaximoMin: 60,
  puntosBase: 20,
  bonusATiempo: 5,
  bonusDesbloqueo: 3,
  categoria: "VENTAS",
};

describe("datosTarea — con catálogo", () => {
  it("usa datos del catalogo cuando no hay overrides", () => {
    const r = datosTarea({
      catalogoTareaId: "cat-1",
      catalogoTarea: catalogoBase,
      nombreAdHoc: null,
      descripcionAdHoc: null,
      puntosBaseAdHoc: null,
      tiempoEstimadoMinAdHoc: null,
      tiempoEstimadoMaxAdHoc: null,
    });
    expect(r.nombre).toBe("Revisar propuesta");
    expect(r.descripcion).toBe("Revisar propuesta comercial");
    expect(r.puntosBase).toBe(20);
    expect(r.bonusATiempo).toBe(5);
    expect(r.bonusDesbloqueo).toBe(3);
    expect(r.esAdHoc).toBe(false);
    expect(r.tieneOverrideNombre).toBe(false);
    expect(r.tieneOverrideDescripcion).toBe(false);
  });

  it("override de nombre funciona", () => {
    const r = datosTarea({
      catalogoTareaId: "cat-1",
      catalogoTarea: catalogoBase,
      nombreAdHoc: "Mi titulo personalizado",
      descripcionAdHoc: null,
      puntosBaseAdHoc: null,
      tiempoEstimadoMinAdHoc: null,
      tiempoEstimadoMaxAdHoc: null,
    });
    expect(r.nombre).toBe("Mi titulo personalizado");
    expect(r.tieneOverrideNombre).toBe(true);
    expect(r.puntosBase).toBe(20); // puntos NO se sobreescriben
  });

  it("override de descripcion funciona", () => {
    const r = datosTarea({
      catalogoTareaId: "cat-1",
      catalogoTarea: catalogoBase,
      nombreAdHoc: null,
      descripcionAdHoc: "Descripcion personalizada",
      puntosBaseAdHoc: null,
      tiempoEstimadoMinAdHoc: null,
      tiempoEstimadoMaxAdHoc: null,
    });
    expect(r.descripcion).toBe("Descripcion personalizada");
    expect(r.tieneOverrideDescripcion).toBe(true);
    expect(r.nombre).toBe("Revisar propuesta"); // nombre sin cambio
  });

  it("nombre override con solo espacios no aplica (trim)", () => {
    const r = datosTarea({
      catalogoTareaId: "cat-1",
      catalogoTarea: catalogoBase,
      nombreAdHoc: "   ",
      descripcionAdHoc: null,
      puntosBaseAdHoc: null,
      tiempoEstimadoMinAdHoc: null,
      tiempoEstimadoMaxAdHoc: null,
    });
    expect(r.nombre).toBe("Revisar propuesta");
    expect(r.tieneOverrideNombre).toBe(false);
  });

  it("puntos y tiempos del catalogo no son sobreescribibles por campos AdHoc", () => {
    const r = datosTarea({
      catalogoTareaId: "cat-1",
      catalogoTarea: catalogoBase,
      nombreAdHoc: null,
      descripcionAdHoc: null,
      puntosBaseAdHoc: 999,
      tiempoEstimadoMinAdHoc: 1,
      tiempoEstimadoMaxAdHoc: 2,
    });
    expect(r.puntosBase).toBe(20);
    expect(r.tiempoMinimoMin).toBe(30);
    expect(r.tiempoMaximoMin).toBe(60);
  });
});

describe("datosTarea — ad-hoc puro (sin catálogo)", () => {
  it("usa datos adHoc cuando no hay catalogo", () => {
    const r = datosTarea({
      catalogoTareaId: null,
      catalogoTarea: null,
      nombreAdHoc: "Tarea especial",
      descripcionAdHoc: "Hacer algo urgente",
      puntosBaseAdHoc: 15,
      tiempoEstimadoMinAdHoc: 45,
      tiempoEstimadoMaxAdHoc: 90,
    });
    expect(r.nombre).toBe("Tarea especial");
    expect(r.descripcion).toBe("Hacer algo urgente");
    expect(r.puntosBase).toBe(15);
    expect(r.tiempoMinimoMin).toBe(45);
    expect(r.tiempoMaximoMin).toBe(90);
    expect(r.esAdHoc).toBe(true);
    expect(r.bonusATiempo).toBe(0);
    expect(r.bonusDesbloqueo).toBe(0);
  });

  it("defaults cuando campos adHoc son null", () => {
    const r = datosTarea({
      catalogoTareaId: null,
      catalogoTarea: null,
      nombreAdHoc: null,
      descripcionAdHoc: null,
      puntosBaseAdHoc: null,
      tiempoEstimadoMinAdHoc: null,
      tiempoEstimadoMaxAdHoc: null,
    });
    expect(r.nombre).toBe("Tarea sin nombre");
    expect(r.descripcion).toBe("");
    expect(r.puntosBase).toBe(5);
    expect(r.tiempoMinimoMin).toBe(30);
    expect(r.tiempoMaximoMin).toBe(60);
  });
});

describe("TOPE_MENSUAL_TAREAS_OPERATIVAS", () => {
  it("es 400 puntos", () => {
    expect(TOPE_MENSUAL_TAREAS_OPERATIVAS).toBe(400);
  });
});
