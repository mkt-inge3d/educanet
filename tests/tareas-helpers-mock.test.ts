import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  eventoAggregate: vi.fn(),
  tareaFindMany: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventoGamificacion: { aggregate: mocks.eventoAggregate },
    tareaInstancia: { findMany: mocks.tareaFindMany },
    user: { findUnique: mocks.userFindUnique },
  },
}));

// mesActual retorna el mes actual — lo mockeamos para tests deterministas
vi.mock("@/lib/gamificacion/periodo", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/gamificacion/periodo")>();
  return {
    ...original,
    mesActual: () => ({ mes: 4, anio: 2026 }),
    rangoMes: () => ({
      inicio: new Date(2026, 3, 1),
      fin: new Date(2026, 3, 30),
    }),
  };
});

import { calcularPuntosProrrateados, esJefeDelArea } from "@/lib/tareas/helpers";

beforeEach(() => vi.clearAllMocks());

describe("calcularPuntosProrrateados", () => {
  it("retorna puntos sin prorrateo si la proyeccion esta dentro del tope", async () => {
    // Ya ganó 200 brutos, pendientes 100 → proyección 200+30+100 = 330 < 400
    mocks.eventoAggregate.mockResolvedValueOnce({ _sum: { cantidadBruta: 200 } });
    mocks.tareaFindMany.mockResolvedValueOnce([
      { catalogoTarea: { puntosBase: 50 }, puntosBaseAdHoc: null },
      { catalogoTarea: { puntosBase: 50 }, puntosBaseAdHoc: null },
    ]);

    const r = await calcularPuntosProrrateados("u1", 30);
    expect(r.puntosProrrateados).toBe(30);
    expect(r.factorProrrateo).toBe(1);
  });

  it("prorratear cuando la proyección supera el tope de 400", async () => {
    // Ya ganó 300 brutos, pendientes 60 → proyección 300+80+60 = 440 > 400
    mocks.eventoAggregate.mockResolvedValueOnce({ _sum: { cantidadBruta: 300 } });
    mocks.tareaFindMany.mockResolvedValueOnce([
      { catalogoTarea: { puntosBase: 60 }, puntosBaseAdHoc: null },
    ]);

    const r = await calcularPuntosProrrateados("u1", 80);
    expect(r.puntosProrrateados).toBeLessThan(80);
    expect(r.factorProrrateo).toBeLessThan(1);
    expect(r.totalProyectado).toBe(440);
  });

  it("puntosProrrateados nunca es 0 (minimo 1)", async () => {
    // Tope ya casi alcanzado
    mocks.eventoAggregate.mockResolvedValueOnce({ _sum: { cantidadBruta: 398 } });
    mocks.tareaFindMany.mockResolvedValueOnce([]);

    const r = await calcularPuntosProrrateados("u1", 100);
    expect(r.puntosProrrateados).toBeGreaterThanOrEqual(1);
  });

  it("acumulado null se trata como 0", async () => {
    mocks.eventoAggregate.mockResolvedValueOnce({ _sum: { cantidadBruta: null } });
    mocks.tareaFindMany.mockResolvedValueOnce([]);

    const r = await calcularPuntosProrrateados("u1", 50);
    expect(r.puntosProrrateados).toBe(50);
    expect(r.factorProrrateo).toBe(1);
  });
});

describe("esJefeDelArea", () => {
  it("retorna true cuando mismo area y puesto empieza con 'Jefe'", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce({ areaId: "a1", puesto: { nombre: "Jefe de Marketing" } })
      .mockResolvedValueOnce({ areaId: "a1" });

    expect(await esJefeDelArea("j1", "e1")).toBe(true);
  });

  it("retorna false cuando áreas distintas", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce({ areaId: "a1", puesto: { nombre: "Jefe" } })
      .mockResolvedValueOnce({ areaId: "a2" });

    expect(await esJefeDelArea("j1", "e1")).toBe(false);
  });

  it("retorna false cuando puesto no empieza con 'Jefe'", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce({ areaId: "a1", puesto: { nombre: "Ejecutivo" } })
      .mockResolvedValueOnce({ areaId: "a1" });

    expect(await esJefeDelArea("j1", "e1")).toBe(false);
  });

  it("retorna false si algún usuario no existe", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ areaId: "a1" });

    expect(await esJefeDelArea("no-existe", "e1")).toBe(false);
  });
});
