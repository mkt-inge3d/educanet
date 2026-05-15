import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { FilaMiembroAgenda, SemaforoCarga } from "@/lib/equipo/agenda-utils";
import { ChipTareaPlanificada } from "./ChipTareaPlanificada";

const CARGA_CONFIG: Record<
  SemaforoCarga,
  { label: string; bg: string; text: string; dot: string }
> = {
  VACIO: {
    label: "Sin tareas",
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
  VERDE: {
    label: "Carga normal",
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
  AMARILLO: {
    label: "Carga alta",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  ROJO: {
    label: "Sobrecarga",
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
};

type Props = {
  fila: FilaMiembroAgenda;
  fechaDelDia: Date;
};

export function FilaMiembroAgendaItem({ fila, fechaDelDia }: Props) {
  const cfg = CARGA_CONFIG[fila.carga];
  const iniciales =
    `${fila.nombre[0] ?? ""}${fila.apellido[0] ?? ""}`.toUpperCase();

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-3 sm:w-56">
          <Avatar size="default">
            {fila.avatarUrl && <AvatarImage src={fila.avatarUrl} alt="" />}
            <AvatarFallback>{iniciales}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Link
              href={`/mi-equipo/${fila.userId}`}
              className="line-clamp-1 text-sm font-semibold hover:text-primary"
            >
              {fila.nombre} {fila.apellido}
            </Link>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {fila.puestoNombre}
            </p>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label} · {fila.tareas.length}
            </span>
          </div>
        </div>
        <div className="flex-1">
          {fila.tareas.length === 0 ? (
            <div className="flex h-full items-center rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Sin tareas planificadas para este día
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {fila.tareas.map((t) => (
                <ChipTareaPlanificada
                  key={t.id}
                  tarea={t}
                  fechaDelDia={fechaDelDia}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
