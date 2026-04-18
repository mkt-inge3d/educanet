import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EstadoLeccion } from "@/lib/leccion/estado-timeline";

type EstadoCompacto = EstadoLeccion | "actual";

export function NodoCompacto({
  estado,
  esActual,
}: {
  estado: EstadoLeccion;
  esActual?: boolean;
}) {
  const estadoVisual: EstadoCompacto = esActual ? "actual" : estado;

  return (
    <div
      data-timeline-nodo
      data-estado={estado}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200",
        estadoVisual === "completado" &&
          "bg-primary text-primary-foreground",
        estadoVisual === "en-progreso" &&
          "bg-primary text-primary-foreground ring-2 ring-primary/30",
        estadoVisual === "actual" &&
          "bg-primary text-primary-foreground ring-2 ring-primary/50 shadow-sm shadow-primary/40",
        estadoVisual === "proximo" &&
          "border-2 border-primary bg-background text-primary",
        estadoVisual === "bloqueado" &&
          "border-2 border-border bg-background text-muted-foreground"
      )}
    >
      {estado === "completado" ? (
        <Check className="h-3 w-3" strokeWidth={3} />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            estadoVisual === "proximo" && "bg-primary",
            estadoVisual === "bloqueado" && "bg-muted-foreground/50",
            (estadoVisual === "en-progreso" || estadoVisual === "actual") &&
              "bg-primary-foreground"
          )}
        />
      )}
    </div>
  );
}
