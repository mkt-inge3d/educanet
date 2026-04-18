"use client";

import { useEffect } from "react";

export function ScrollALeccionActual({ leccionId }: { leccionId: string }) {
  useEffect(() => {
    const elemento = document.querySelector<HTMLElement>(
      `[data-leccion-id="${leccionId}"]`
    );
    if (!elemento) return;
    elemento.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [leccionId]);

  return null;
}
