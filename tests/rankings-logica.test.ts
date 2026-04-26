import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { obtenerRankingArea } from "@/lib/gamificacion/rankings";

const mockFindMany = prisma.user.findMany as ReturnType<typeof vi.fn>;

function makeUser(
  id: string,
  nombre: string,
  puntosTotales: number,
  rachaActual = 0
) {
  return {
    id,
    nombre,
    apellido: "Test",
    avatarUrl: null,
    puntosTotales,
    rachaActual,
    puesto: { nombre: "Ejecutivo" },
  };
}

beforeEach(() => vi.clearAllMocks());

describe("obtenerRankingArea — posicionamiento", () => {
  it("ordena usuarios por puntos y asigna posicion 1-based", async () => {
    mockFindMany.mockResolvedValue([
      makeUser("u1", "Ana", 1000),
      makeUser("u2", "Luis", 800),
      makeUser("u3", "Mia", 600),
    ]);

    const r = await obtenerRankingArea({
      areaId: "area1",
      userIdActual: "u1",
      metrica: "puntos_total",
    });

    expect(r.lideres[0].position).toBe(1);
    expect(r.lideres[0].userId).toBe("u1");
    expect(r.lideres[1].position).toBe(2);
    expect(r.lideres[2].position).toBe(3);
  });

  it("lideres son los top 3", async () => {
    mockFindMany.mockResolvedValue([
      makeUser("u1", "A", 100),
      makeUser("u2", "B", 90),
      makeUser("u3", "C", 80),
      makeUser("u4", "D", 70),
      makeUser("u5", "E", 60),
    ]);

    const r = await obtenerRankingArea({
      areaId: "a",
      userIdActual: "u4",
      metrica: "puntos_total",
    });

    expect(r.lideres).toHaveLength(3);
    expect(r.lideres.map((l) => l.userId)).toEqual(["u1", "u2", "u3"]);
  });

  it("posicionUsuario retorna posicion 1-based del usuario actual", async () => {
    mockFindMany.mockResolvedValue([
      makeUser("u1", "A", 100),
      makeUser("u2", "B", 90),
      makeUser("u3", "C", 80),
    ]);

    const r = await obtenerRankingArea({
      areaId: "a",
      userIdActual: "u3",
      metrica: "puntos_total",
    });

    expect(r.posicionUsuario).toBe(3);
  });

  it("posicionUsuario = null si el usuario no esta en el area", async () => {
    mockFindMany.mockResolvedValue([
      makeUser("u1", "A", 100),
      makeUser("u2", "B", 90),
    ]);

    const r = await obtenerRankingArea({
      areaId: "a",
      userIdActual: "no-existe",
      metrica: "puntos_total",
    });

    expect(r.posicionUsuario).toBeNull();
  });

  it("totalParticipantes refleja el total de usuarios del area", async () => {
    const users = Array.from({ length: 10 }, (_, i) =>
      makeUser(`u${i}`, `U${i}`, 100 - i * 5)
    );
    mockFindMany.mockResolvedValue(users);

    const r = await obtenerRankingArea({
      areaId: "a",
      userIdActual: "u0",
      metrica: "puntos_total",
    });

    expect(r.totalParticipantes).toBe(10);
  });
});

describe("obtenerRankingArea — cercanosAlUsuario", () => {
  it("incluye hasta 2 antes y 2 despues del usuario actual", async () => {
    mockFindMany.mockResolvedValue([
      makeUser("u1", "A", 100),
      makeUser("u2", "B", 90),
      makeUser("u3", "C", 80), // usuario actual
      makeUser("u4", "D", 70),
      makeUser("u5", "E", 60),
    ]);

    const r = await obtenerRankingArea({
      areaId: "a",
      userIdActual: "u3",
      metrica: "puntos_total",
    });

    const ids = r.cercanosAlUsuario.map((e) => e.userId);
    expect(ids).toContain("u1");
    expect(ids).toContain("u2");
    expect(ids).toContain("u3");
    expect(ids).toContain("u4");
    expect(ids).toContain("u5");
  });

  it("cercanosAlUsuario vacio cuando el usuario no esta en la lista", async () => {
    mockFindMany.mockResolvedValue([makeUser("u1", "A", 100)]);

    const r = await obtenerRankingArea({
      areaId: "a",
      userIdActual: "fantasma",
      metrica: "puntos_total",
    });

    expect(r.cercanosAlUsuario).toHaveLength(0);
  });

  it("usuario en primer lugar solo muestra hacia adelante", async () => {
    mockFindMany.mockResolvedValue([
      makeUser("u1", "A", 100),
      makeUser("u2", "B", 90),
      makeUser("u3", "C", 80),
    ]);

    const r = await obtenerRankingArea({
      areaId: "a",
      userIdActual: "u1",
      metrica: "puntos_total",
    });

    expect(r.cercanosAlUsuario[0].userId).toBe("u1");
    expect(r.posicionUsuario).toBe(1);
  });
});

describe("obtenerRankingArea — metrica racha", () => {
  it("usa rachaActual cuando metrica=racha", async () => {
    mockFindMany.mockResolvedValue([
      makeUser("u1", "A", 10, 30),
      makeUser("u2", "B", 500, 5),
    ]);

    const r = await obtenerRankingArea({
      areaId: "a",
      userIdActual: "u1",
      metrica: "racha",
    });

    // u1 tiene racha 30, u2 racha 5 → u1 es el lider
    expect(r.lideres[0].userId).toBe("u1");
    expect(r.lideres[0].valor).toBe(30);
  });
});

describe("obtenerRankingArea — esUsuarioActual", () => {
  it("marca correctamente al usuario actual", async () => {
    mockFindMany.mockResolvedValue([
      makeUser("u1", "A", 100),
      makeUser("u2", "B", 90),
    ]);

    const r = await obtenerRankingArea({
      areaId: "a",
      userIdActual: "u2",
      metrica: "puntos_total",
    });

    const u1 = r.lideres.find((e) => e.userId === "u1");
    const u2 = r.lideres.find((e) => e.userId === "u2");
    expect(u1?.esUsuarioActual).toBe(false);
    expect(u2?.esUsuarioActual).toBe(true);
  });
});
