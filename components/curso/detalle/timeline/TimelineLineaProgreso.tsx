"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function TimelineLineaProgreso({
  containerSelector,
  estadoActivo,
}: {
  containerSelector: string;
  estadoActivo: "completado" | "en-progreso" | "ninguno";
}) {
  const [altura, setAltura] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(containerSelector);
    if (!container) return;

    const medir = () => {
      const nodos = container.querySelectorAll<HTMLElement>(
        "[data-timeline-nodo]"
      );
      if (nodos.length === 0) {
        setAltura(0);
        return;
      }

      let indiceActivo = -1;
      nodos.forEach((n, i) => {
        const est = n.dataset.estado;
        if (est === "completado" || est === "en-progreso") indiceActivo = i;
      });

      if (indiceActivo < 0) {
        setAltura(0);
        return;
      }

      const primero = nodos[0].getBoundingClientRect();
      const ultimo = nodos[indiceActivo].getBoundingClientRect();
      setAltura(ultimo.top + ultimo.height / 2 - (primero.top + primero.height / 2));
    };

    const programar = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(medir);
    };

    programar();

    const ro = new ResizeObserver(programar);
    ro.observe(container);
    window.addEventListener("resize", programar);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", programar);
    };
  }, [containerSelector, estadoActivo]);

  if (estadoActivo === "ninguno") return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute left-4 top-0 w-[2px] -translate-x-1/2 bg-primary"
      initial={{ height: 0 }}
      animate={{ height: altura }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ transform: "translateX(-50%)" }}
    />
  );
}
