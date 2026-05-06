"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { EstadoTareaInstancia } from "@prisma/client";

import { TareaCard, type TareaCardProps } from "./TareaCard";
import { duplicarTareaInstancia, eliminarTareaInstancia } from "@/lib/tareas/actions";

type TareaEnKanban = TareaCardProps["tarea"];

type KanbanProps = {
  tareas: TareaEnKanban[];
  userId: string;
};

function sortarConCopias(tasks: TareaEnKanban[]): TareaEnKanban[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const result: TareaEnKanban[] = [];
  const inserted = new Set<string>();

  function insertWithChildren(task: TareaEnKanban) {
    if (inserted.has(task.id)) return;
    result.push(task);
    inserted.add(task.id);
    for (const t of tasks) {
      if (t.duplicadaDe === task.id) insertWithChildren(t);
    }
  }

  for (const task of tasks) {
    if (!task.duplicadaDe || !byId.has(task.duplicadaDe)) {
      insertWithChildren(task);
    }
  }
  return result;
}

const COLUMNAS: Array<{
  estado: EstadoTareaInstancia;
  titulo: string;
  descripcion: string;
  tono: string;
}> = [
  {
    estado: "PENDIENTE",
    titulo: "Pendientes",
    descripcion: "Por iniciar",
    tono: "border-muted-foreground/20",
  },
  {
    estado: "EN_PROGRESO",
    titulo: "En progreso",
    descripcion: "Ejecutando ahora",
    tono: "border-primary/40",
  },
  {
    estado: "BLOQUEADA",
    titulo: "Bloqueadas",
    descripcion: "Esperando a un tercero",
    tono: "border-warning/50",
  },
  {
    estado: "EN_REVISION",
    titulo: "En revisión",
    descripcion: "Completadas, esperando validación",
    tono: "border-muted-foreground/20",
  },
];

export function KanbanTareas({ tareas, userId }: KanbanProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  type OptimisticAction =
    | { type: "duplicar"; tarea: TareaEnKanban }
    | { type: "eliminar"; id: string };

  const [optimisticTareas, dispatch] = useOptimistic(
    tareas,
    (state: TareaEnKanban[], action: OptimisticAction) => {
      if (action.type === "duplicar") return [...state, action.tarea];
      if (action.type === "eliminar") return state.filter((t) => t.id !== action.id);
      return state;
    },
  );

  const [expandedCol, setExpandedCol] = useState<EstadoTareaInstancia | null>(null);

  const expandedColRef = useRef<EstadoTareaInstancia | null>(null);
  expandedColRef.current = expandedCol;

  const colDivRefs = useRef<Partial<Record<EstadoTareaInstancia, HTMLDivElement | null>>>({});

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const curr = expandedColRef.current;
      if (!curr) return;
      const colEl = colDivRefs.current[curr];
      if (colEl && !colEl.contains(e.target as Node)) {
        setExpandedCol(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const duplicarConOptimismo = (original: TareaEnKanban) => {
    type AdHocItem = { texto: string; marcado: boolean };
    const adHocOriginal = original.checklistAdHoc as AdHocItem[] | null;

    const copia: TareaEnKanban = {
      ...original,
      id: `optimistic-${Date.now()}`,
      estado: "PENDIENTE",
      esCopia: true,
      duplicadaDe: original.id,
      checklistMarcados: [],
      checklistAdHoc: adHocOriginal?.map((i) => ({ texto: i.texto, marcado: false })) ?? null,
      fechaInicioReal: null,
      fechaFinReal: null,
      tiempoInvertidoMin: null,
      puntosOtorgados: 0,
      puntosBrutos: 0,
      puntosATiempo: false,
      puntosDesbloqueo: false,
      factorProrrateo: 1.0,
      bloqueoExternoMotivo: null,
      bloqueoExternoResponsable: null,
      bloqueoExternoDesde: null,
      ejecutadaPorOtro: false,
      ejecutadaRealmenteId: null,
      notasEjecutor: null,
      calidadAutoeval: null,
      motivoAyuda: null,
    };

    startTransition(async () => {
      dispatch({ type: "duplicar", tarea: copia });
      const res = await duplicarTareaInstancia(original.id);
      if (!res.success) {
        toast.error(res.error ?? "Error al duplicar");
      } else {
        toast.success("Tarea duplicada");
        router.refresh();
      }
    });
  };

  const eliminarConOptimismo = (id: string) => {
    startTransition(async () => {
      dispatch({ type: "eliminar", id });
      const res = await eliminarTareaInstancia(id);
      if (!res.success) {
        toast.error(res.error ?? "Error al eliminar");
        router.refresh();
      }
    });
  };

  const porEstado = new Map<EstadoTareaInstancia, TareaEnKanban[]>();
  for (const t of optimisticTareas) {
    const arr = porEstado.get(t.estado) ?? [];
    arr.push(t);
    porEstado.set(t.estado, arr);
  }
  for (const [estado, items] of porEstado) {
    porEstado.set(estado, sortarConCopias(items));
  }

  const gridStyle = {
    gridTemplateColumns: COLUMNAS.map((c) =>
      expandedCol && c.estado === expandedCol ? "2fr" : "1fr",
    ).join(" "),
    transition: "grid-template-columns 0.5s ease-in-out",
  };

  return (
    <div className="grid gap-4" style={gridStyle}>
      {COLUMNAS.map((col) => {
        const items = porEstado.get(col.estado) ?? [];
        return (
          <div
            key={col.estado}
            ref={(el) => { colDivRefs.current[col.estado] = el; }}
            className={`flex flex-col rounded-xl border-2 border-dashed ${col.tono} bg-muted/20 p-3`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{col.titulo}</h3>
                <p className="text-xs text-muted-foreground">{col.descripcion}</p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Sin tareas
                </p>
              ) : (
                items.map((t) => (
                  <TareaCard
                    key={t.id}
                    tarea={t}
                    userId={userId}
                    onDuplicarTarea={() => duplicarConOptimismo(t)}
                    onEliminarTarea={() => eliminarConOptimismo(t.id)}
                    onExpandChange={(expanded) =>
                      setExpandedCol(expanded ? col.estado : null)
                    }
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
