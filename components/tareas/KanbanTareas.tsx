"use client";

import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, LayoutGrid, Search, X } from "lucide-react";
import type { EstadoTareaInstancia } from "@prisma/client";
import { cn } from "@/lib/utils";

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

function extraerProyectos(tareas: TareaEnKanban[]) {
  const mapa = new Map<string, { id: string; nombre: string; count: number }>();
  for (const t of tareas) {
    if (!t.workflowInstanciaId || !t.workflowInstancia) continue;
    const prev = mapa.get(t.workflowInstanciaId);
    if (prev) {
      prev.count++;
    } else {
      mapa.set(t.workflowInstanciaId, {
        id: t.workflowInstanciaId,
        nombre: t.workflowInstancia.nombre,
        count: 1,
      });
    }
  }
  return Array.from(mapa.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );
}

// ---------------------------------------------------------------------------
// Barra de filtro con chips + flechas + buscador
// ---------------------------------------------------------------------------
function FiltroPorProyecto({
  proyectos,
  total,
  proyectoActivo,
  onSeleccionar,
}: {
  proyectos: { id: string; nombre: string; count: number }[];
  total: number;
  proyectoActivo: string | null;
  onSeleccionar: (id: string | null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chipActivo = useRef<HTMLButtonElement | null>(null);
  const buscadorRef = useRef<HTMLDivElement>(null);

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [proyectos, checkScroll]);

  // Scroll chip activo al centro cuando cambia la selección
  useEffect(() => {
    if (chipActivo.current && scrollRef.current) {
      chipActivo.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [proyectoActivo]);

  // Cerrar buscador al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target as Node)) {
        setBuscadorAbierto(false);
        setBusqueda("");
      }
    };
    if (buscadorAbierto) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [buscadorAbierto]);

  const scrollPrev = () =>
    scrollRef.current?.scrollBy({ left: -240, behavior: "smooth" });
  const scrollNext = () =>
    scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" });

  const proyectosFiltrados = busqueda.trim()
    ? proyectos.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : proyectos;

  const seleccionar = (id: string | null) => {
    onSeleccionar(id);
    setBuscadorAbierto(false);
    setBusqueda("");
  };

  const nombreActivo =
    proyectoActivo !== null
      ? proyectos.find((p) => p.id === proyectoActivo)?.nombre
      : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
        <span>Filtrar por proyecto</span>
        {nombreActivo && (
          <>
            <span className="text-border">·</span>
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {nombreActivo}
            </span>
            <button
              onClick={() => seleccionar(null)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
              title="Quitar filtro"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Flecha izquierda */}
        <button
          onClick={scrollPrev}
          disabled={!canLeft}
          className={cn(
            "shrink-0 rounded-full border bg-background p-1 shadow-sm transition-all",
            canLeft
              ? "border-border text-foreground hover:bg-muted"
              : "pointer-events-none border-transparent text-transparent"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Contenedor chips con degradados laterales */}
        <div className="relative min-w-0 flex-1">
          {/* Degradado izquierdo */}
          <div
            className={cn(
              "pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent transition-opacity",
              canLeft ? "opacity-100" : "opacity-0"
            )}
          />

          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
          >
            {/* Chip "Todos" */}
            <button
              ref={proyectoActivo === null ? chipActivo : undefined}
              onClick={() => seleccionar(null)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                proyectoActivo === null
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              Todos
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  proyectoActivo === null
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {total}
              </span>
            </button>

            {/* Chips de proyecto */}
            {proyectos.map((p) => {
              const activo = proyectoActivo === p.id;
              return (
                <button
                  key={p.id}
                  ref={activo ? chipActivo : undefined}
                  onClick={() => seleccionar(activo ? null : p.id)}
                  title={p.nombre}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    activo
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <span className="max-w-[140px] truncate">{p.nombre}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      activo
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {p.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Degradado derecho */}
          <div
            className={cn(
              "pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent transition-opacity",
              canRight ? "opacity-100" : "opacity-0"
            )}
          />
        </div>

        {/* Flecha derecha */}
        <button
          onClick={scrollNext}
          disabled={!canRight}
          className={cn(
            "shrink-0 rounded-full border bg-background p-1 shadow-sm transition-all",
            canRight
              ? "border-border text-foreground hover:bg-muted"
              : "pointer-events-none border-transparent text-transparent"
          )}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Buscador */}
        <div ref={buscadorRef} className="relative shrink-0">
          <button
            onClick={() => {
              setBuscadorAbierto((v) => !v);
              setBusqueda("");
            }}
            title="Buscar proyecto"
            className={cn(
              "rounded-full border p-1.5 shadow-sm transition-all",
              buscadorAbierto
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {buscadorAbierto && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-popover shadow-lg">
              {/* Input búsqueda */}
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar proyecto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
                {busqueda && (
                  <button onClick={() => setBusqueda("")}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Lista de proyectos */}
              <div className="max-h-60 overflow-y-auto py-1">
                {/* Opción Todos */}
                {!busqueda && (
                  <button
                    onClick={() => seleccionar(null)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-muted",
                      proyectoActivo === null && "bg-muted font-semibold text-foreground"
                    )}
                  >
                    <span>Todos los proyectos</span>
                    <span className="tabular-nums text-muted-foreground">{total}</span>
                  </button>
                )}

                {proyectosFiltrados.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Sin resultados
                  </p>
                ) : (
                  proyectosFiltrados.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => seleccionar(p.id)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-muted",
                        proyectoActivo === p.id && "bg-muted font-semibold text-foreground"
                      )}
                    >
                      <span className="truncate pr-2 text-left">{p.nombre}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {p.count}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-border" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban principal
// ---------------------------------------------------------------------------
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
  const [proyectoActivo, setProyectoActivo] = useState<string | null>(null);

  const expandedColRef = useRef<EstadoTareaInstancia | null>(null);
  expandedColRef.current = expandedCol;
  const colDivRefs = useRef<Partial<Record<EstadoTareaInstancia, HTMLDivElement | null>>>({});

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const curr = expandedColRef.current;
      if (!curr) return;
      const colEl = colDivRefs.current[curr];
      if (colEl && !colEl.contains(e.target as Node)) setExpandedCol(null);
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

  const proyectos = extraerProyectos(optimisticTareas);

  const tareasFiltradas =
    proyectoActivo === null
      ? optimisticTareas
      : optimisticTareas.filter((t) => t.workflowInstanciaId === proyectoActivo);

  const porEstado = new Map<EstadoTareaInstancia, TareaEnKanban[]>();
  for (const t of tareasFiltradas) {
    const arr = porEstado.get(t.estado) ?? [];
    arr.push(t);
    porEstado.set(t.estado, arr);
  }
  for (const [estado, items] of porEstado) {
    porEstado.set(estado, sortarConCopias(items));
  }

  const gridStyle = {
    gridTemplateColumns: COLUMNAS.map((c) =>
      expandedCol && c.estado === expandedCol ? "2fr" : "1fr"
    ).join(" "),
    transition: "grid-template-columns 0.5s ease-in-out",
  };

  return (
    <div className="flex flex-col gap-4">
      {proyectos.length > 0 && (
        <FiltroPorProyecto
          proyectos={proyectos}
          total={optimisticTareas.length}
          proyectoActivo={proyectoActivo}
          onSeleccionar={setProyectoActivo}
        />
      )}

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
    </div>
  );
}
