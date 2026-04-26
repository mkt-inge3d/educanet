import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  misionFindUnique: vi.fn(),
  misionUpdate: vi.fn(),
  procesarEvento: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mision: {
      findUnique: mocks.misionFindUnique,
      update: mocks.misionUpdate,
    },
    notificacion: { create: vi.fn() },
  },
}));

vi.mock("@/lib/gamificacion/motor", () => ({
  procesarEvento: mocks.procesarEvento,
}));

// requireAuth se usa en completarMision/descartarMision pero no en actualizarProgresoMision
vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: "user-auth" }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { actualizarProgresoMision } from "@/lib/misiones/actions";

beforeEach(() => vi.clearAllMocks());

describe("actualizarProgresoMision", () => {
  it("retorna error si la misión no existe", async () => {
    mocks.misionFindUnique.mockResolvedValueOnce(null);

    const r = await actualizarProgresoMision("mision-x");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain("activa");
  });

  it("retorna error si la misión no está ACTIVA", async () => {
    mocks.misionFindUnique.mockResolvedValueOnce({
      userId: "u1",
      estado: "COMPLETADA",
      metaValor: 3,
      progresoActual: 3,
    });

    const r = await actualizarProgresoMision("mision-1");
    expect(r.success).toBe(false);
  });

  it("incrementa el progreso en la cantidad indicada", async () => {
    mocks.misionFindUnique.mockResolvedValueOnce({
      userId: "u1",
      estado: "ACTIVA",
      metaValor: 5,
      progresoActual: 2,
    });
    mocks.misionUpdate.mockResolvedValueOnce({});

    const r = await actualizarProgresoMision("mision-1", 2);
    expect(r.success).toBe(true);
    expect(mocks.misionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ progresoActual: 4 }),
      })
    );
  });

  it("incremento por defecto es 1", async () => {
    mocks.misionFindUnique.mockResolvedValueOnce({
      userId: "u1",
      estado: "ACTIVA",
      metaValor: 5,
      progresoActual: 1,
    });
    mocks.misionUpdate.mockResolvedValueOnce({});

    await actualizarProgresoMision("mision-1");
    expect(mocks.misionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ progresoActual: 2 }),
      })
    );
  });

  it("auto-completa la misión cuando progresoActual >= metaValor", async () => {
    // Primera llamada: estado de la misión
    mocks.misionFindUnique
      .mockResolvedValueOnce({
        userId: "u1",
        estado: "ACTIVA",
        metaValor: 3,
        progresoActual: 2,
      })
      // Segunda llamada: datos frescos para el evento
      .mockResolvedValueOnce({
        userId: "u1",
        titulo: "Completar 3 lecciones",
        puntosRecompensa: 40,
      });

    mocks.misionUpdate.mockResolvedValue({});
    mocks.procesarEvento.mockResolvedValue({ eventoId: "e1", puntosFinales: 40 });

    const r = await actualizarProgresoMision("mision-1", 1);
    expect(r.success).toBe(true);

    // Debe haber marcado la misión como COMPLETADA
    expect(mocks.misionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "COMPLETADA" }),
      })
    );
    // Debe haber llamado procesarEvento con MISION_COMPLETADA
    expect(mocks.procesarEvento).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "MISION_COMPLETADA",
        fuente: "MISIONES",
        puntosBrutos: 40,
      })
    );
  });

  it("NO auto-completa si el progreso no alcanza la meta", async () => {
    mocks.misionFindUnique.mockResolvedValueOnce({
      userId: "u1",
      estado: "ACTIVA",
      metaValor: 5,
      progresoActual: 2,
    });
    mocks.misionUpdate.mockResolvedValue({});

    await actualizarProgresoMision("mision-1", 1);

    expect(mocks.procesarEvento).not.toHaveBeenCalled();
  });

  it("NO auto-completa si metaValor es null (misión sin meta)", async () => {
    mocks.misionFindUnique.mockResolvedValueOnce({
      userId: "u1",
      estado: "ACTIVA",
      metaValor: null,
      progresoActual: 0,
    });
    mocks.misionUpdate.mockResolvedValue({});

    await actualizarProgresoMision("mision-1", 99);

    expect(mocks.procesarEvento).not.toHaveBeenCalled();
  });
});
