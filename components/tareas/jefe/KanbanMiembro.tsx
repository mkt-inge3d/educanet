import type { EstadoTareaInstancia, Prisma } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TareaCard } from "@/components/tareas/TareaCard";

type Tarea = Prisma.TareaInstanciaGetPayload<{
  include: {
    catalogoTarea: { include: { checklistItems: true } };
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

export function KanbanMiembro({
  tareas,
  jefeId,
}: {
  tareas: Tarea[];
  jefeId: string;
}) {
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
                items.map((t) => (
                  <TareaCard
                    key={t.id}
                    tarea={t}
                    userId={jefeId}
                    hideCompleteButton
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
