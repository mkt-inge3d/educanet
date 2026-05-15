import Link from "next/link";
import { Flag, ShieldQuestion } from "lucide-react";
import type { EstadoTareaInstancia } from "@prisma/client";
import type { TareaPlanificada } from "@/lib/equipo/agenda-utils";

const ESTADO_DOT: Record<EstadoTareaInstancia, string> = {
  PENDIENTE: "bg-muted-foreground/40",
  EN_PROGRESO: "bg-success",
  EN_REVISION: "bg-warning",
  BLOQUEADA: "bg-destructive",
  VENCIDA: "bg-destructive",
  COMPLETADA: "bg-success",
  OMITIDA: "bg-muted",
};

const ESTADO_LABEL: Record<EstadoTareaInstancia, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En curso",
  EN_REVISION: "Revisión",
  BLOQUEADA: "Bloqueada",
  VENCIDA: "Vencida",
  COMPLETADA: "OK",
  OMITIDA: "Omitida",
};

function formatHora(d: Date, mostrar: boolean): string | null {
  if (!mostrar) return null;
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

type Props = {
  tarea: TareaPlanificada;
  fechaDelDia: Date;
};

export function ChipTareaPlanificada({ tarea, fechaDelDia }: Props) {
  const inicioDia = new Date(fechaDelDia);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(fechaDelDia);
  finDia.setHours(23, 59, 59, 999);

  const empiezaHoy = tarea.fechaInicio >= inicioDia && tarea.fechaInicio <= finDia;
  const venceHoy = tarea.fechaFin >= inicioDia && tarea.fechaFin <= finDia;
  const hora = formatHora(tarea.fechaInicio, empiezaHoy);

  const href = tarea.workflowId
    ? `/proyectos/${tarea.workflowId}/gantt`
    : `/tareas/${tarea.id}`;

  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-md border border-border/60 bg-card px-2 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${ESTADO_DOT[tarea.estado]}`}
        aria-hidden
        title={ESTADO_LABEL[tarea.estado]}
      />
      {tarea.esHito && (
        <Flag className="h-3 w-3 shrink-0 text-primary" aria-hidden />
      )}
      {hora && (
        <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
          {hora}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{tarea.titulo}</span>
      {tarea.workflowNombre && (
        <span className="hidden shrink-0 truncate text-muted-foreground sm:inline-block sm:max-w-[12ch]">
          · {tarea.workflowNombre}
        </span>
      )}
      {venceHoy && tarea.estado !== "COMPLETADA" && (
        <span className="shrink-0 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
          vence
        </span>
      )}
      {tarea.requiereValidacionJefe && (
        <ShieldQuestion
          className="h-3 w-3 shrink-0 text-primary/70"
          aria-hidden
        />
      )}
    </Link>
  );
}
