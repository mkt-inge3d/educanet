import { describe, it, expect } from "vitest";
import { LIMITES_DIARIOS } from "@/lib/gamificacion/limites";
import { PUNTOS_POR_ACCION } from "@/lib/gamificacion/constantes";

describe("Tope diario de likes", () => {
  it("el tope diario por likes recibidos es 20 puntos", () => {
    expect(LIMITES_DIARIOS.PUNTOS_POR_LIKES_RECIBIDOS).toBe(20);
  });

  it("cada like otorga 1 punto al autor", () => {
    expect(PUNTOS_POR_ACCION.LIKE_RECIBIDO).toBe(1);
  });

  it("con el tope de 20 y 1 punto por like, hacen falta exactamente 20 likes para alcanzarlo", () => {
    const likesNecesarios =
      LIMITES_DIARIOS.PUNTOS_POR_LIKES_RECIBIDOS /
      PUNTOS_POR_ACCION.LIKE_RECIBIDO;
    expect(likesNecesarios).toBe(20);
  });
});
