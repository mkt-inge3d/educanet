import { describe, it, expect } from "vitest";
import {
  comentarioSchema,
  actualizarComentarioSchema,
  reporteSchema,
  sanitizarTextoPlano,
} from "@/lib/comentarios/schemas";

describe("comentarioSchema", () => {
  const leccionId = "cld0000000000000000000000";
  const padreId = "cld0000000000000000000001";

  it("acepta contenido valido", () => {
    const res = comentarioSchema.safeParse({
      contenido: "Este es un comentario valido",
      leccionId,
    });
    expect(res.success).toBe(true);
  });

  it("rechaza contenido vacio", () => {
    const res = comentarioSchema.safeParse({ contenido: "", leccionId });
    expect(res.success).toBe(false);
  });

  it("rechaza solo espacios en blanco", () => {
    const res = comentarioSchema.safeParse({
      contenido: "     ",
      leccionId,
    });
    expect(res.success).toBe(false);
  });

  it("rechaza mas de 2000 caracteres", () => {
    const res = comentarioSchema.safeParse({
      contenido: "a".repeat(2001),
      leccionId,
    });
    expect(res.success).toBe(false);
  });

  it("acepta exactamente 2000 caracteres", () => {
    const res = comentarioSchema.safeParse({
      contenido: "a".repeat(2000),
      leccionId,
    });
    expect(res.success).toBe(true);
  });

  it("acepta comentarioPadreId opcional", () => {
    const res = comentarioSchema.safeParse({
      contenido: "respuesta",
      leccionId,
      comentarioPadreId: padreId,
    });
    expect(res.success).toBe(true);
  });
});

describe("actualizarComentarioSchema", () => {
  const id = "cld0000000000000000000000";

  it("requiere contenido no vacio", () => {
    expect(
      actualizarComentarioSchema.safeParse({ id, contenido: "" }).success
    ).toBe(false);
  });

  it("acepta contenido valido", () => {
    expect(
      actualizarComentarioSchema.safeParse({ id, contenido: "editado" }).success
    ).toBe(true);
  });
});

describe("reporteSchema", () => {
  const comentarioId = "cld0000000000000000000000";

  it("rechaza razones con menos de 10 caracteres", () => {
    expect(
      reporteSchema.safeParse({ comentarioId, razon: "spam" }).success
    ).toBe(false);
  });

  it("acepta razon detallada", () => {
    expect(
      reporteSchema.safeParse({
        comentarioId,
        razon: "Este comentario parece spam comercial no relacionado",
      }).success
    ).toBe(true);
  });

  it("rechaza razon mayor a 500 caracteres", () => {
    expect(
      reporteSchema.safeParse({
        comentarioId,
        razon: "a".repeat(501),
      }).success
    ).toBe(false);
  });
});

describe("sanitizarTextoPlano", () => {
  it("elimina etiquetas HTML", () => {
    // El sanitizador deja el texto interno (no es riesgo porque se renderiza
    // siempre como texto plano via {contenido}), solo quita tags.
    expect(sanitizarTextoPlano("<b>negrita</b>")).toBe("negrita");
    expect(sanitizarTextoPlano("<script>alert(1)</script>hola")).toBe(
      "alert(1)hola"
    );
  });

  it("preserva saltos de linea", () => {
    expect(sanitizarTextoPlano("linea 1\nlinea 2")).toBe("linea 1\nlinea 2");
  });

  it("hace trim del resultado", () => {
    expect(sanitizarTextoPlano("   hola   ")).toBe("hola");
  });

  it("quita caracteres nulos", () => {
    expect(sanitizarTextoPlano("texto\u0000malo")).toBe("textomalo");
  });
});
