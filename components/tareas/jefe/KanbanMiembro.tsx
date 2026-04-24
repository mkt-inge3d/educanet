import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { datosTarea } from "@/lib/tareas/tarea-datos";
import { infoNegocio } from "@/lib/tareas/negocios";
import { BadgeNegocio } from "@/components/tareas/SelectorNegocio";
import { cn } from "@/lib/utils";
import type { EstadoTareaInstancia, Prisma } from "@prisma/client";

type Tarea = Prisma.TareaInstanciaGetPayload<{
  include: {
    catalogoTarea: true;
    workflowInstancia: { select: { id: true; nombre: true; fechaHito: true; contextoMarca: true } };
    checklistMarcados: true;
  };
}>;

const COLUMNAS: Array<{
  estado: EstadoTareaInstancia | "CERRADAS";
  titulo: string;
  filtra: (t: Tarea) => boolean;
  tono: string;
}> = [
  {
    estado: "PENDIENTE",
    titulo: "Pendientes",
    filtra: (t) => t.estado === "PENDIENTE" || t.estado === "EN_PROGRESO",
    tono: "border-muted-foreground/20",
  },
  {
    estado: "EN_REVISION",
    titulo: "Por validar",
    filtra: (t) => t.estado === "EN_REVISION",
    tono: "border-warning/40",
  },
  {
    estado: "BLOQUEADA",
    titulo: "Bloqueadas",
    filtra: (t) => t.estado === "BLOQUEADA",
    tono: "border-warning/40",
  },
  {
    estado: "CERRADAS",
    titulo: "Cerradas (mes)",
    filtra: (t) =>
      t.estado === "COMPLETADA" || t.estado === "OMITIDA" || t.estado === "VENCIDA",
    tono: "border-muted-foreground/10",
  },
];

export function KanbanMiembro({ tareas }: { tareas: Tarea[] }) {
  if (tareas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Sin tareas asignadas todavía.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {COLUMNAS.map((col) => {
        const items = tareas.filter(col.filtra);
        return (
          <div
            key={col.estado}
            className={cn(
              "flex flex-col rounded-xl border-2 border-dashed bg-muted/20 p-3",
              col.tono,
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{col.titulo}</h3>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  —
                </p>
              ) : (
                items.map((t) => <TareaItem key={t.id} tarea={t} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TareaItem({ tarea }: { tarea: Tarea }) {
  const datos = datosTarea(tarea);
  const negocioInfo = infoNegocio(tarea.negocio);
  const origen =
    tarea.origen === "ASIGNADA_JEFE"
      ? "Asignada por vos"
      : tarea.origen === "AUTO_ASIGNADA"
        ? "Auto-asignada"
        : "Workflow";

  return (
    <Link href={`/tareas/${tarea.id}`}>
      <Card
        className={cn(
          "transition-colors hover:border-primary/40",
          negocioInfo && `border-l-4 ${negocioInfo.borderClass}`,
        )}
      >
        <CardContent className="space-y-1.5 p-3">
          <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
            <span className="uppercase tracking-wider">{origen}</span>
            {tarea.estado === "COMPLETADA" && (
              <CheckCircle2 className="h-3 w-3 text-success" />
            )}
            {tarea.estado === "BLOQUEADA" && (
              <AlertTriangle className="h-3 w-3 text-warning" />
            )}
          </div>
          <p className="line-clamp-2 text-sm font-medium leading-tight">
            {datos.nombre}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge variant="outline" className="h-4 text-[10px]">
              {datos.puntosBase} pts
            </Badge>
            <Badge variant="outline" className="h-4 text-[10px]">
              <Clock className="mr-0.5 h-2.5 w-2.5" />
              {datos.tiempoMinimoMin}-{datos.tiempoMaximoMin}m
            </Badge>
            <BadgeNegocio negocio={tarea.negocio} compact />
            {tarea.estado === "COMPLETADA" && tarea.puntosOtorgados > 0 && (
              <span className="text-[10px] text-success">
                +{tarea.puntosOtorgados} otorgados
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
