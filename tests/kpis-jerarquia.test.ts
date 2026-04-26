import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      findMany: mocks.findMany,
    },
  },
}));

import { verificarEsJefeDe, obtenerEquipoIds } from "@/lib/kpis/jerarquia";

beforeEach(() => vi.clearAllMocks());

describe("verificarEsJefeDe", () => {
  it("retorna true cuando jefe y empleado estan en la misma area y puesto empieza con 'Jefe'", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({ areaId: "area-1", puesto: { nombre: "Jefe de Marketing" } })
      .mockResolvedValueOnce({ areaId: "area-1" });

    expect(await verificarEsJefeDe("jefe-id", "empleado-id")).toBe(true);
  });

  it("retorna false cuando están en áreas distintas", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({ areaId: "area-1", puesto: { nombre: "Jefe de Marketing" } })
      .mockResolvedValueOnce({ areaId: "area-2" });

    expect(await verificarEsJefeDe("jefe-id", "empleado-id")).toBe(false);
  });

  it("retorna false cuando el puesto no empieza con 'Jefe'", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({ areaId: "area-1", puesto: { nombre: "Ejecutivo de Ventas" } })
      .mockResolvedValueOnce({ areaId: "area-1" });

    expect(await verificarEsJefeDe("user-id", "empleado-id")).toBe(false);
  });

  it("retorna false cuando el jefe no existe", async () => {
    mocks.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ areaId: "area-1" });

    expect(await verificarEsJefeDe("no-existe", "empleado-id")).toBe(false);
  });

  it("retorna false cuando el empleado no existe", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({ areaId: "area-1", puesto: { nombre: "Jefe de Área" } })
      .mockResolvedValueOnce(null);

    expect(await verificarEsJefeDe("jefe-id", "no-existe")).toBe(false);
  });

  it("retorna false cuando el jefe no tiene areaId", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({ areaId: null, puesto: { nombre: "Jefe" } })
      .mockResolvedValueOnce({ areaId: "area-1" });

    expect(await verificarEsJefeDe("jefe-id", "empleado-id")).toBe(false);
  });
});

describe("obtenerEquipoIds", () => {
  it("retorna los ids de todos los miembros activos del área", async () => {
    mocks.findUnique.mockResolvedValueOnce({ areaId: "area-1" });
    mocks.findMany.mockResolvedValueOnce([
      { id: "u2" },
      { id: "u3" },
      { id: "u4" },
    ]);

    const ids = await obtenerEquipoIds("u1");
    expect(ids).toEqual(["u2", "u3", "u4"]);
  });

  it("retorna array vacío si el jefe no tiene areaId", async () => {
    mocks.findUnique.mockResolvedValueOnce({ areaId: null });

    const ids = await obtenerEquipoIds("u1");
    expect(ids).toEqual([]);
  });

  it("retorna array vacío si el jefe no existe", async () => {
    mocks.findUnique.mockResolvedValueOnce(null);

    const ids = await obtenerEquipoIds("no-existe");
    expect(ids).toEqual([]);
  });

  it("retorna array vacío si no hay miembros en el área", async () => {
    mocks.findUnique.mockResolvedValueOnce({ areaId: "area-1" });
    mocks.findMany.mockResolvedValueOnce([]);

    const ids = await obtenerEquipoIds("u1");
    expect(ids).toEqual([]);
  });

  it("excluye al propio jefe de la lista (id: not jefeId)", async () => {
    mocks.findUnique.mockResolvedValueOnce({ areaId: "area-1" });
    mocks.findMany.mockResolvedValueOnce([{ id: "u2" }, { id: "u3" }]);

    const ids = await obtenerEquipoIds("u1");
    expect(ids).not.toContain("u1");
  });
});
