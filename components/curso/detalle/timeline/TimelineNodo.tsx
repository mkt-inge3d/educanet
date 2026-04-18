import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EstadoLeccion } from "@/lib/leccion/estado-timeline";

export type { EstadoLeccion };

export function TimelineNodo({
  numero,
  estado,
}: {
  numero: number;
  estado: EstadoLeccion;
}) {
  return (
    <div
      data-timeline-nodo
      data-estado={estado}
      className="relative z-10 flex h-8 w-8 items-center justify-center"
    >
      {estado === "en-progreso" && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse rounded-full ring-[3px] ring-primary/30 dark:ring-primary/50"
        />
      )}
      <div
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
          estado === "completado" &&
            "bg-primary text-primary-foreground shadow-sm shadow-primary/35 dark:shadow-primary/50",
          estado === "en-progreso" &&
            "bg-primary text-primary-foreground shadow-md shadow-primary/40 dark:shadow-primary/70",
          estado === "proximo" &&
            "border-2 border-primary bg-background text-primary",
          estado === "bloqueado" &&
            "border-2 border-muted-foreground/30 bg-background text-muted-foreground",
          "group-hover:scale-[1.08]"
        )}
      >
        {estado === "completado" ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : (
          numero
        )}
      </div>
    </div>
  );
}
