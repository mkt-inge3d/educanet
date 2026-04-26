import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma antes de importar el módulo que lo usa
vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventoGamificacion: {
      aggregate: vi.fn(),
    },
  },
}));

// Mock de calcularCumplimientoKpis (importación dinámica en ajustarPuntos)
vi.mock("@/lib/kpis/calculo", () => ({
  calcularCumplimientoKpis: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { calcularCumplimientoKpis } from "@/lib/kpis/calculo";
import { ajustarPuntos, TOPES_MENSUALES, UMBRAL_MULTIPLICADOR, FACTOR_REDUCCION } from "@/lib/gamificacion/multiplicadores";

const mockAggregate = prisma.eventoGamificacion.aggregate as ReturnType<typeof vi.fn>;
const mockCumplimiento = calcularCumplimientoKpis as ReturnType<typeof vi.fn>;

function sinTope() {
  mockAggregate.mockResolvedValue({ _sum: { cantidad: 0 } });
}

function cumplimientoOk() {
  mockCumplimiento.mockResolvedValue({
    hayDatosSuficientes: false,
    porcentaje: 0,
    cumplimientos: [],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ajustarPuntos — sin tope ni multiplicador", () => {
  it("retorna puntos brutos cuando no se alcanzó el tope y cumplimiento OK", async () => {
    sinTope();
    cumplimientoOk();

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "APRENDIZAJE",
      puntosBrutos: 50,
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(50);
    expect(r.fueModificado).toBe(false);
  });
});

describe("ajustarPuntos — tope mensual", () => {
  it("retorna 0 cuando ya se alcanzó el tope de la fuente", async () => {
    // Ya ganó 400 puntos de APRENDIZAJE (el tope)
    mockAggregate.mockResolvedValue({ _sum: { cantidad: 400 } });
    cumplimientoOk();

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "APRENDIZAJE",
      puntosBrutos: 30,
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(0);
    expect(r.fueModificado).toBe(true);
    expect(r.razon).toContain("APRENDIZAJE");
  });

  it("capa los puntos al restante del tope", async () => {
    // Ya ganó 380 de 400 → solo quedan 20
    mockAggregate.mockResolvedValue({ _sum: { cantidad: 380 } });
    cumplimientoOk();

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "APRENDIZAJE",
      puntosBrutos: 50,
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(20);
    expect(r.fueModificado).toBe(true);
  });

  it("SISTEMA no tiene tope (Infinity)", async () => {
    // No llamamos aggregate — no debería haberlo para SISTEMA
    cumplimientoOk();

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "SISTEMA",
      puntosBrutos: 9999,
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(9999);
    expect(r.fueModificado).toBe(false);
  });
});

describe("ajustarPuntos — multiplicador por bajo cumplimiento KPIs", () => {
  it("aplica FACTOR_REDUCCION (50%) cuando cumplimiento < 70%", async () => {
    sinTope();
    mockCumplimiento.mockResolvedValue({
      hayDatosSuficientes: true,
      porcentaje: 60, // < 70%
      cumplimientos: [],
    });

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "APRENDIZAJE",
      puntosBrutos: 100,
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(Math.floor(100 * FACTOR_REDUCCION));
    expect(r.fueModificado).toBe(true);
    expect(r.razon).toContain("50%");
  });

  it("no aplica multiplicador cuando cumplimiento >= 70%", async () => {
    sinTope();
    mockCumplimiento.mockResolvedValue({
      hayDatosSuficientes: true,
      porcentaje: 70,
      cumplimientos: [],
    });

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "APRENDIZAJE",
      puntosBrutos: 100,
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(100);
    expect(r.fueModificado).toBe(false);
  });

  it("no aplica multiplicador a fuente KPIS (exenta)", async () => {
    mockAggregate.mockResolvedValue({ _sum: { cantidad: 0 } });
    // No se llama calcularCumplimientoKpis para KPIS

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "KPIS",
      puntosBrutos: 100,
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(100);
    expect(mockCumplimiento).not.toHaveBeenCalled();
  });

  it("no aplica multiplicador a fuente SISTEMA (exenta)", async () => {
    cumplimientoOk();

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "SISTEMA",
      puntosBrutos: 50,
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(50);
    expect(mockCumplimiento).not.toHaveBeenCalled();
  });

  it("no aplica multiplicador cuando no hay datos suficientes de KPIs", async () => {
    sinTope();
    mockCumplimiento.mockResolvedValue({
      hayDatosSuficientes: false,
      porcentaje: 0,
      cumplimientos: [],
    });

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "APRENDIZAJE",
      puntosBrutos: 80,
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(80);
    expect(r.fueModificado).toBe(false);
  });
});

describe("ajustarPuntos — combinacion tope + multiplicador", () => {
  it("aplica tope primero, luego multiplicador al restante", async () => {
    // Ya ganó 360 de 400 → restante 40
    mockAggregate.mockResolvedValue({ _sum: { cantidad: 360 } });
    // Cumplimiento bajo
    mockCumplimiento.mockResolvedValue({
      hayDatosSuficientes: true,
      porcentaje: 50,
      cumplimientos: [],
    });

    const r = await ajustarPuntos({
      userId: "u1",
      fuente: "APRENDIZAJE",
      puntosBrutos: 80, // capado a 40 por tope, luego 40*0.5 = 20
      mes: 4,
      anio: 2026,
    });

    expect(r.puntosFinales).toBe(20);
    expect(r.fueModificado).toBe(true);
  });
});
