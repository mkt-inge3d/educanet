import { describe, it, expect } from "vitest";
import type { EstadoTareaInstancia, EstadoWorkflow } from "@prisma/client";
import {
  calcularSaludProyecto,
  agregarResumenProyectos,
  type WorkflowParaSalud,
} from "@/lib/proyectos/salud";

const ASIGNADO = {
  id: "u1",
  nombre: "Ana",
  apellido: "Pérez",
  avatarUrl: null,
};

function tarea(
  estado: EstadoTareaInstancia,
  diasOffsetFin = 5,
  diasOffsetInicio = -5,
) {
  const ahora = new Date("2026-05-14T12:00:00Z");
  const ini = new Date(ahora);
  ini.setDate(ahora.getDate() + diasOffsetInicio);
  const fin = new Date(ahora);
  fin.setDate(ahora.getDate() + diasOffsetFin);
  return {
    id: `t-${Math.random()}`,
    estado,
    fechaEstimadaInicio: ini,
    fechaEstimadaFin: fin,
    completadaEn: estado === "COMPLETADA" ? ahora : null,
    asignadoA: ASIGNADO,
  };
}

function workflow(
  estadoGeneral: EstadoWorkflow,
  tareas: ReturnType<typeof tarea>[],
  diasHasta = 5,
): WorkflowParaSalud {
  const fechaHito = new Date("2026-05-14T12:00:00Z");
  fechaHito.setDate(fechaHito.getDate() + diasHasta);
  return {
    id: "wf1",
    nombre: "Webinar Mayo",
    contextoMarca: null,
    fechaHito,
    estadoGeneral,
    responsableGeneral: { id: "u1", nombre: "Ana", apellido: "Pérez" },
    plantilla: { nombre: "Webinar", categoria: "WEBINAR" },
    tareas,
  };
}

const AHORA = new Date("2026-05-14T12:00:00Z");

describe("calcularSaludProyecto", () => {
  it("retorna SIN_DATOS si no hay tareas", () => {
    const r = calcularSaludProyecto(workflow("ACTIVO", []), AHORA);
    expect(r.salud).toBe("SIN_DATOS");
    expect(r.porcentajeAvance).toBe(0);
    expect(r.total).toBe(0);
  });

  it("VERDE cuando el proyecto está completado", () => {
    const r = calcularSaludProyecto(
      workflow("ACTIVO", [
        tarea("COMPLETADA"),
        tarea("COMPLETADA"),
        tarea("COMPLETADA"),
      ]),
      AHORA,
    );
    expect(r.salud).toBe("VERDE");
    expect(r.porcentajeAvance).toBe(100);
  });

  it("VERDE cuando el avance acompaña al tiempo transcurrido", () => {
    const r = calcularSaludProyecto(
      workflow("ACTIVO", [
        tarea("COMPLETADA"),
        tarea("COMPLETADA"),
        tarea("EN_PROGRESO"),
        tarea("PENDIENTE"),
      ]),
      AHORA,
    );
    expect(r.salud).toBe("VERDE");
  });

  it("ROJO cuando hay tareas vencidas en >20% del total", () => {
    const r = calcularSaludProyecto(
      workflow("ACTIVO", [
        tarea("VENCIDA"),
        tarea("VENCIDA"),
        tarea("PENDIENTE"),
        tarea("PENDIENTE"),
      ]),
      AHORA,
    );
    expect(r.salud).toBe("ROJO");
    expect(r.vencidas).toBe(2);
  });

  it("AMARILLO cuando hay bloqueadas pero el avance acompaña al tiempo", () => {
    const r = calcularSaludProyecto(
      workflow("ACTIVO", [
        tarea("COMPLETADA"),
        tarea("COMPLETADA"),
        tarea("BLOQUEADA"),
        tarea("EN_PROGRESO"),
      ]),
      AHORA,
    );
    expect(r.salud).toBe("AMARILLO");
    expect(r.bloqueadas).toBe(1);
  });

  it("ROJO si el hito ya venció y aún quedan tareas", () => {
    const r = calcularSaludProyecto(
      workflow(
        "ACTIVO",
        [tarea("COMPLETADA"), tarea("PENDIENTE")],
        -3,
      ),
      AHORA,
    );
    expect(r.salud).toBe("ROJO");
    expect(r.diasRestantes).toBeLessThan(0);
  });

  it("ignora tareas OMITIDAS en el porcentaje de avance", () => {
    const r = calcularSaludProyecto(
      workflow("ACTIVO", [
        tarea("COMPLETADA"),
        tarea("OMITIDA"),
      ]),
      AHORA,
    );
    expect(r.porcentajeAvance).toBe(100);
  });

  it("acumula carga correctamente por miembro", () => {
    const r = calcularSaludProyecto(
      workflow("ACTIVO", [
        tarea("COMPLETADA"),
        tarea("EN_PROGRESO"),
        tarea("VENCIDA"),
      ]),
      AHORA,
    );
    expect(r.cargaPorMiembro).toHaveLength(1);
    const m = r.cargaPorMiembro[0];
    expect(m.completadas).toBe(1);
    expect(m.activas).toBe(1);
    expect(m.vencidas).toBe(1);
  });
});

describe("agregarResumenProyectos", () => {
  it("cuenta por categoría de salud", () => {
    const proyectos = [
      calcularSaludProyecto(workflow("ACTIVO", [tarea("COMPLETADA"), tarea("COMPLETADA")]), AHORA),
      calcularSaludProyecto(workflow("ACTIVO", [tarea("VENCIDA"), tarea("VENCIDA"), tarea("PENDIENTE"), tarea("PENDIENTE")]), AHORA),
      calcularSaludProyecto(workflow("ACTIVO", [tarea("COMPLETADA"), tarea("COMPLETADA"), tarea("COMPLETADA"), tarea("BLOQUEADA"), tarea("PENDIENTE")]), AHORA),
    ];
    const r = agregarResumenProyectos(proyectos);
    expect(r.total).toBe(3);
    expect(r.saludables).toBe(1);
    expect(r.criticos).toBe(1);
    expect(r.enRiesgo).toBe(1);
  });
});
