import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (clsx + tailwind-merge)", () => {
  it("combina clases simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filtra valores falsy", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("resuelve conflictos tailwind (ultima clase gana)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("mantiene clases no conflictivas", () => {
    const result = cn("flex", "items-center", "gap-2");
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).toContain("gap-2");
  });

  it("cadena vacia sin args", () => {
    expect(cn()).toBe("");
  });

  it("acepta objetos condicionales de clsx", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
    expect(cn({ active: false, disabled: true })).toBe("disabled");
  });

  it("combina array y string", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});
