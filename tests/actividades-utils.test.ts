import { describe, it, expect } from "vitest";
import {
  agruparPorMiembro,
  contarPorTipo,
  usuariosActivos,
  type ItemActividad,
} from "@/lib/equipo/actividades-utils";

function evento(
  userId: string,
  tipo: ItemActividad["tipo"],
  horaIso: string,
): ItemActividad {
  return {
    id: `${userId}-${tipo}-${horaIso}`,
    timestamp: new Date(horaIso),
    userId,
    userNombre: `Usuario ${userId}`,
    userApellido: "X",
    userAvatar: null,
    tipo,
    titulo: `Evento ${tipo}`,
  };
}

describe("agruparPorMiembro", () => {
  it("agrupa items por userId y los ordena por cantidad descendente", () => {
    const items: ItemActividad[] = [
      evento("u1", "TAREA_COMPLETADA", "2026-05-14T09:00:00Z"),
      evento("u2", "TAREA_COMPLETADA", "2026-05-14T10:00:00Z"),
      evento("u1", "KPI_APROBADO", "2026-05-14T11:00:00Z"),
      evento("u1", "LECCION", "2026-05-14T12:00:00Z"),
    ];
    const grupos = agruparPorMiembro(items);
    expect(grupos).toHaveLength(2);
    expect(grupos[0].userId).toBe("u1");
    expect(grupos[0].items).toHaveLength(3);
    expect(grupos[1].userId).toBe("u2");
  });

  it("retorna vacío sin items", () => {
    expect(agruparPorMiembro([])).toEqual([]);
  });
});

describe("contarPorTipo", () => {
  it("cuenta correctamente cada tipo de evento", () => {
    const items: ItemActividad[] = [
      evento("u1", "TAREA_COMPLETADA", "2026-05-14T09:00:00Z"),
      evento("u2", "TAREA_COMPLETADA", "2026-05-14T10:00:00Z"),
      evento("u1", "KPI_APROBADO", "2026-05-14T11:00:00Z"),
      evento("u3", "LECCION", "2026-05-14T12:00:00Z"),
    ];
    const c = contarPorTipo(items);
    expect(c.TAREA_COMPLETADA).toBe(2);
    expect(c.KPI_APROBADO).toBe(1);
    expect(c.LECCION).toBe(1);
    expect(c.MISION).toBe(0);
    expect(c.RECONOCIMIENTO).toBe(0);
    expect(c.TAREA_VALIDADA).toBe(0);
  });
});

describe("usuariosActivos", () => {
  it("retorna set único de userIds presentes en los items", () => {
    const items: ItemActividad[] = [
      evento("u1", "TAREA_COMPLETADA", "2026-05-14T09:00:00Z"),
      evento("u1", "KPI_APROBADO", "2026-05-14T10:00:00Z"),
      evento("u2", "LECCION", "2026-05-14T11:00:00Z"),
    ];
    const act = usuariosActivos(items);
    expect(act.size).toBe(2);
    expect(act.has("u1")).toBe(true);
    expect(act.has("u2")).toBe(true);
  });
});
