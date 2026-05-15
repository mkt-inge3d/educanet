import { describe, it, expect } from "vitest";
import {
  clasificarCarga,
  tareaEnElDia,
  resumirAgenda,
  type FilaMiembroAgenda,
} from "@/lib/equipo/agenda-utils";

describe("clasificarCarga", () => {
  it("0 tareas → VACIO", () => {
    expect(clasificarCarga(0)).toBe("VACIO");
  });
  it("1-3 tareas → VERDE", () => {
    expect(clasificarCarga(1)).toBe("VERDE");
    expect(clasificarCarga(3)).toBe("VERDE");
  });
  it("4-5 tareas → AMARILLO", () => {
    expect(clasificarCarga(4)).toBe("AMARILLO");
    expect(clasificarCarga(5)).toBe("AMARILLO");
  });
  it(">=6 tareas → ROJO", () => {
    expect(clasificarCarga(6)).toBe("ROJO");
    expect(clasificarCarga(12)).toBe("ROJO");
  });
});

describe("tareaEnElDia", () => {
  const inicio = new Date("2026-05-14T00:00:00Z");
  const fin = new Date("2026-05-14T23:59:59Z");

  it("tarea contenida en el día → true", () => {
    expect(
      tareaEnElDia(
        {
          fechaEstimadaInicio: new Date("2026-05-14T08:00:00Z"),
          fechaEstimadaFin: new Date("2026-05-14T17:00:00Z"),
        },
        inicio,
        fin,
      ),
    ).toBe(true);
  });

  it("tarea que cruza el día desde antes → true", () => {
    expect(
      tareaEnElDia(
        {
          fechaEstimadaInicio: new Date("2026-05-13T10:00:00Z"),
          fechaEstimadaFin: new Date("2026-05-14T10:00:00Z"),
        },
        inicio,
        fin,
      ),
    ).toBe(true);
  });

  it("tarea futura → false", () => {
    expect(
      tareaEnElDia(
        {
          fechaEstimadaInicio: new Date("2026-05-15T08:00:00Z"),
          fechaEstimadaFin: new Date("2026-05-15T17:00:00Z"),
        },
        inicio,
        fin,
      ),
    ).toBe(false);
  });

  it("tarea pasada → false", () => {
    expect(
      tareaEnElDia(
        {
          fechaEstimadaInicio: new Date("2026-05-10T08:00:00Z"),
          fechaEstimadaFin: new Date("2026-05-13T17:00:00Z"),
        },
        inicio,
        fin,
      ),
    ).toBe(false);
  });
});

function fila(carga: FilaMiembroAgenda["carga"], cantidad: number): FilaMiembroAgenda {
  return {
    userId: `u-${cantidad}`,
    nombre: "X",
    apellido: "Y",
    avatarUrl: null,
    puestoNombre: "Marketing",
    tareas: Array.from({ length: cantidad }, (_, i) => ({
      id: `t-${i}`,
      titulo: `Tarea ${i}`,
      estado: "PENDIENTE" as const,
      workflowId: null,
      workflowNombre: null,
      fechaInicio: new Date(),
      fechaFin: new Date(),
      esHito: false,
      requiereValidacionJefe: false,
    })),
    carga,
  };
}

describe("resumirAgenda", () => {
  it("cuenta total de tareas, miembros con/sin carga y sobrecargados", () => {
    const filas: FilaMiembroAgenda[] = [
      fila("VERDE", 2),
      fila("AMARILLO", 4),
      fila("ROJO", 6),
      fila("VACIO", 0),
      fila("VACIO", 0),
    ];
    const r = resumirAgenda(filas);
    expect(r.totalMiembros).toBe(5);
    expect(r.totalTareas).toBe(12);
    expect(r.miembrosActivos).toBe(3);
    expect(r.miembrosSinTareas).toBe(2);
    expect(r.miembrosSobrecargados).toBe(1);
  });

  it("sin filas retorna ceros", () => {
    const r = resumirAgenda([]);
    expect(r.totalMiembros).toBe(0);
    expect(r.totalTareas).toBe(0);
    expect(r.miembrosActivos).toBe(0);
    expect(r.miembrosSobrecargados).toBe(0);
  });
});
