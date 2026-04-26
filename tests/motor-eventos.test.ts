/**
 * Tests del motor de gamificación (procesarEvento).
 * Mockea prisma, ajustarPuntos y recalcularRangoMensual para testear
 * solo la lógica de orquestación del motor.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted garantiza que las variables estén disponibles cuando vi.mock se alza
const mocks = vi.hoisted(() => ({
  eventoCreate: vi.fn(),
  transaction: vi.fn(),
  notificacionCreate: vi.fn(),
  ajustarPuntos: vi.fn(),
  recalcularRangoMensual: vi.fn(),
  verificarMisionesTrasEvento: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventoGamificacion: { create: mocks.eventoCreate },
    transaccionPuntos: { create: vi.fn() },
    user: { update: vi.fn() },
    notificacion: { create: mocks.notificacionCreate },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/gamificacion/multiplicadores", () => ({
  TOPES_MENSUALES: {
    APRENDIZAJE: 400, KPIS: 1000, TAREAS_OPERATIVAS: 400,
    COMPROMISOS: 100, RECONOCIMIENTOS: 200, MISIONES: 200,
    EQUIPO: 300, SISTEMA: Infinity,
  },
  UMBRAL_MULTIPLICADOR: 0.7,
  FACTOR_REDUCCION: 0.5,
  ajustarPuntos: mocks.ajustarPuntos,
}));

vi.mock("@/lib/gamificacion/rangos", () => ({
  rangoSegunPuntos: vi.fn(),
  rangoOrden: vi.fn(),
  siguienteRango: vi.fn(),
  proyeccionRango: vi.fn(),
  sumarPuntosPorFuenteMes: vi.fn(),
  recalcularRangoMensual: mocks.recalcularRangoMensual,
}));

vi.mock("@/lib/misiones/hooks", () => ({
  verificarMisionesTrasEvento: mocks.verificarMisionesTrasEvento,
}));

import { procesarEvento } from "@/lib/gamificacion/motor";

function setupDefaults(
  puntosFinales = 50,
  subioDeRango = false,
  nuevoRango?: string
) {
  mocks.ajustarPuntos.mockResolvedValue({
    puntosFinales,
    fueModificado: puntosFinales !== 50,
    razon: puntosFinales !== 50 ? "Tope mensual alcanzado" : undefined,
  });
  mocks.eventoCreate.mockResolvedValue({ id: "evt-1" });
  mocks.transaction.mockResolvedValue([]);
  mocks.recalcularRangoMensual.mockResolvedValue({
    puntosTotales: 500,
    rango: subioDeRango ? (nuevoRango ?? "ORO") : "BRONCE",
    subioDeRango,
    nuevoRango: subioDeRango ? (nuevoRango ?? "ORO") : undefined,
    puntosPorFuente: {},
  });
  mocks.verificarMisionesTrasEvento.mockResolvedValue(undefined);
}

beforeEach(() => vi.clearAllMocks());

describe("procesarEvento — estructura de resultado", () => {
  it("retorna eventoId, puntosBrutos, puntosFinales, rango y subioDeRango", async () => {
    setupDefaults(50);

    const r = await procesarEvento({
      userId: "u1",
      tipo: "LECCION_COMPLETADA",
      fuente: "APRENDIZAJE",
      puntosBrutos: 50,
    });

    expect(r.eventoId).toBe("evt-1");
    expect(r.puntosBrutos).toBe(50);
    expect(r.puntosFinales).toBe(50);
    expect(r.rangoActual).toBe("BRONCE");
    expect(r.subioDeRango).toBe(false);
  });

  it("fueModificado y razonModificacion se propagan del ajuste", async () => {
    mocks.ajustarPuntos.mockResolvedValue({
      puntosFinales: 25,
      fueModificado: true,
      razon: "Tope mensual de APRENDIZAJE alcanzado.",
    });
    mocks.eventoCreate.mockResolvedValue({ id: "evt-2" });
    mocks.transaction.mockResolvedValue([]);
    mocks.recalcularRangoMensual.mockResolvedValue({
      puntosTotales: 400, rango: "BRONCE", subioDeRango: false, puntosPorFuente: {},
    });
    mocks.verificarMisionesTrasEvento.mockResolvedValue(undefined);

    const r = await procesarEvento({
      userId: "u1",
      tipo: "QUIZ_APROBADO",
      fuente: "APRENDIZAJE",
      puntosBrutos: 50,
    });

    expect(r.fueModificado).toBe(true);
    expect(r.razonModificacion).toContain("Tope");
    expect(r.puntosFinales).toBe(25);
  });
});

describe("procesarEvento — tope = 0 no crea transaccion", () => {
  it("cuando puntosFinales = 0 NO llama $transaction", async () => {
    mocks.ajustarPuntos.mockResolvedValue({
      puntosFinales: 0,
      fueModificado: true,
      razon: "Tope alcanzado",
    });
    mocks.eventoCreate.mockResolvedValue({ id: "evt-3" });
    mocks.recalcularRangoMensual.mockResolvedValue({
      puntosTotales: 400, rango: "BRONCE", subioDeRango: false, puntosPorFuente: {},
    });
    mocks.verificarMisionesTrasEvento.mockResolvedValue(undefined);

    await procesarEvento({
      userId: "u1",
      tipo: "LECCION_COMPLETADA",
      fuente: "APRENDIZAJE",
      puntosBrutos: 30,
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("procesarEvento — subida de rango", () => {
  it("nuevoRango y subioDeRango=true cuando recalcular sube de rango", async () => {
    setupDefaults(200, true, "ORO");

    const r = await procesarEvento({
      userId: "u1",
      tipo: "KPIS_MES_TOTAL",
      fuente: "KPIS",
      puntosBrutos: 200,
    });

    expect(r.subioDeRango).toBe(true);
    expect(r.nuevoRango).toBe("ORO");
    expect(r.rangoActual).toBe("ORO");
  });

  it("crea notificacion cuando sube de rango", async () => {
    setupDefaults(300, true, "DIAMANTE");

    await procesarEvento({
      userId: "u1",
      tipo: "KPIS_MES_TOTAL",
      fuente: "KPIS",
      puntosBrutos: 300,
    });

    expect(mocks.notificacionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          tipo: "LOGRO",
        }),
      })
    );
  });

  it("NO crea notificacion cuando NO sube de rango", async () => {
    setupDefaults(50, false);

    await procesarEvento({
      userId: "u1",
      tipo: "LECCION_COMPLETADA",
      fuente: "APRENDIZAJE",
      puntosBrutos: 50,
    });

    expect(mocks.notificacionCreate).not.toHaveBeenCalled();
  });
});

describe("procesarEvento — llamadas a dependencias", () => {
  it("llama ajustarPuntos con userId, fuente, puntosBrutos, mes y anio correctos", async () => {
    setupDefaults(40);
    const fecha = new Date(2026, 3, 15); // abril 2026

    await procesarEvento({
      userId: "u99",
      tipo: "TAREA_OPERATIVA_COMPLETADA",
      fuente: "TAREAS_OPERATIVAS",
      puntosBrutos: 40,
      fecha,
    });

    expect(mocks.ajustarPuntos).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u99",
        fuente: "TAREAS_OPERATIVAS",
        puntosBrutos: 40,
        mes: 4,
        anio: 2026,
      })
    );
  });

  it("llama recalcularRangoMensual con userId, mes y anio correctos", async () => {
    setupDefaults(30);
    const fecha = new Date(2026, 3, 15);

    await procesarEvento({
      userId: "u88",
      tipo: "LECCION_COMPLETADA",
      fuente: "APRENDIZAJE",
      puntosBrutos: 30,
      fecha,
    });

    expect(mocks.recalcularRangoMensual).toHaveBeenCalledWith("u88", 4, 2026);
  });

  it("siempre registra el evento en eventoGamificacion aunque puntosFinales = 0", async () => {
    mocks.ajustarPuntos.mockResolvedValue({ puntosFinales: 0, fueModificado: true });
    mocks.eventoCreate.mockResolvedValue({ id: "evt-z" });
    mocks.recalcularRangoMensual.mockResolvedValue({
      puntosTotales: 0, rango: "BRONCE", subioDeRango: false, puntosPorFuente: {},
    });
    mocks.verificarMisionesTrasEvento.mockResolvedValue(undefined);

    await procesarEvento({
      userId: "u1",
      tipo: "LECCION_COMPLETADA",
      fuente: "APRENDIZAJE",
      puntosBrutos: 30,
    });

    expect(mocks.eventoCreate).toHaveBeenCalledTimes(1);
  });
});
