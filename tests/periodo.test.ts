import { describe, it, expect } from "vitest";
import {
  getMes,
  getAnio,
  getSemanaISO,
  rangoMes,
  diasRestantesDelMes,
  semanaDelMes,
} from "@/lib/gamificacion/periodo";

describe("getMes", () => {
  it("enero = 1", () => {
    expect(getMes(new Date(2024, 0, 15))).toBe(1);
  });
  it("diciembre = 12", () => {
    expect(getMes(new Date(2024, 11, 1))).toBe(12);
  });
  it("junio = 6", () => {
    expect(getMes(new Date(2025, 5, 20))).toBe(6);
  });
});

describe("getAnio", () => {
  it("retorna el año correcto", () => {
    expect(getAnio(new Date(2024, 3, 10))).toBe(2024);
    expect(getAnio(new Date(2026, 0, 1))).toBe(2026);
  });
});

describe("getSemanaISO", () => {
  it("2024-01-01 es semana 1 de 2024", () => {
    const r = getSemanaISO(new Date(2024, 0, 1));
    expect(r.semana).toBe(1);
    expect(r.anio).toBe(2024);
  });
  it("2024-12-30 es semana 1, anio calendario 2024 (usa getYear, no getISOWeekYear)", () => {
    const r = getSemanaISO(new Date(2024, 11, 30));
    expect(r.semana).toBe(1);
    expect(r.anio).toBe(2024); // año calendario, no ISO
  });
  it("2025-01-06 es semana 2 de 2025", () => {
    const r = getSemanaISO(new Date(2025, 0, 6));
    expect(r.semana).toBe(2);
  });
});

describe("rangoMes", () => {
  it("enero 2024: inicio = 1 enero, fin = 31 enero", () => {
    const { inicio, fin } = rangoMes(1, 2024);
    expect(inicio.getFullYear()).toBe(2024);
    expect(inicio.getMonth()).toBe(0);
    expect(inicio.getDate()).toBe(1);
    expect(fin.getDate()).toBe(31);
    expect(fin.getMonth()).toBe(0);
  });
  it("febrero 2024 (bisiesto): fin = 29", () => {
    const { fin } = rangoMes(2, 2024);
    expect(fin.getDate()).toBe(29);
  });
  it("febrero 2023 (no bisiesto): fin = 28", () => {
    const { fin } = rangoMes(2, 2023);
    expect(fin.getDate()).toBe(28);
  });
  it("diciembre 2024: fin = 31", () => {
    const { fin } = rangoMes(12, 2024);
    expect(fin.getDate()).toBe(31);
  });
});

describe("diasRestantesDelMes", () => {
  it("el ultimo dia del mes retorna 0", () => {
    expect(diasRestantesDelMes(new Date(2024, 0, 31))).toBe(0);
  });
  it("el primero de enero tiene 30 dias restantes", () => {
    expect(diasRestantesDelMes(new Date(2024, 0, 1))).toBe(30);
  });
  it("nunca retorna negativo", () => {
    expect(diasRestantesDelMes(new Date(2024, 11, 31))).toBeGreaterThanOrEqual(0);
  });
});

describe("semanaDelMes", () => {
  it("dia 1 = semana 1", () => {
    expect(semanaDelMes(new Date(2024, 0, 1))).toBe(1);
  });
  it("dia 7 = semana 1", () => {
    expect(semanaDelMes(new Date(2024, 0, 7))).toBe(1);
  });
  it("dia 8 = semana 2", () => {
    expect(semanaDelMes(new Date(2024, 0, 8))).toBe(2);
  });
  it("dia 15 = semana 3", () => {
    expect(semanaDelMes(new Date(2024, 0, 15))).toBe(3);
  });
  it("dia 29 = semana 5", () => {
    expect(semanaDelMes(new Date(2024, 0, 29))).toBe(5);
  });
});
