"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  ListChecks,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { datosTarea } from "@/lib/tareas/tarea-datos";
import { infoNegocio } from "@/lib/tareas/negocios";
import { BadgeNegocio } from "./SelectorNegocio";
import {
  completarTarea,
  editarChecklistItemTexto,
  eliminarTareaInstancia,
  marcarChecklistItem,
  marcarChecklistAdHocItem,
} from "@/lib/tareas/actions";
import { ChecklistItemRow } from "./ChecklistItemRow";
import type { Prisma } from "@prisma/client";

type Tarea = Prisma.TareaInstanciaGetPayload<{
  include: {
    catalogoTarea: { include: { checklistItems: true } };
    workflowInstancia: { select: { id: true; nombre: true; fechaHito: true; contextoMarca: true } };
    checklistMarcados: true;
  };
}>;

export type TareaCardProps = {
  tarea: Tarea;
  userId: string;
  /** Oculta el botón "Completar tarea" (usado en vista jefe, donde solo
   *  el empleado puede marcarla como completada). */
  hideCompleteButton?: boolean;
  /** Oculta controles de acción (eliminar, checklist editable). Para vista
   *  de jefe sobre tareas de su equipo. */
  hideActions?: boolean;
  onExpandChange?: (expanded: boolean) => void;
};

const LABEL_CATEGORIA: Record<string, string> = {
  PRE_WEBINAR: "Pre-webinar",
  DURANTE_WEBINAR: "Día W.",
  POST_WEBINAR: "Post-webinar",
  SEO_RECURRENTE: "SEO",
  CAMPANA_META_ADS: "Meta Ads",
  COORDINACION_GENERAL: "Coord.",
  DISENO: "Diseño",
  DESARROLLO_WEB: "Dev",
};

function diasRestantes(fecha: Date): { texto: string; urgente: boolean } {
  const diff = Math.ceil((fecha.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (diff < 0) return { texto: `${Math.abs(diff)}d atrasada`, urgente: true };
  if (diff === 0) return { texto: "Hoy", urgente: true };
  if (diff === 1) return { texto: "Mañana", urgente: true };
  if (diff <= 3) return { texto: `${diff} días`, urgente: true };
  return { texto: `${diff} días`, urgente: false };
}

export function TareaCard({ tarea, hideCompleteButton = false, hideActions = false, onExpandChange }: TareaCardProps) {
  const router = useRouter();
  const [expand, setExpand] = useState(false);
  const [editingItem, setEditingItem] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [armado, setArmado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEliminar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!armado) {
      setArmado(true);
      timerRef.current = setTimeout(() => setArmado(false), 2500);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setArmado(false);
    startTransition(async () => {
      const res = await eliminarTareaInstancia(tarea.id);
      if (!res.success) toast.error(res.error ?? "Error al eliminar");
      else {
        toast.success("Tarea eliminada");
        router.refresh();
      }
    });
  };

  const datos = datosTarea(tarea);
  const negocioInfo = infoNegocio(tarea.negocio);
  const { workflowInstancia: wf } = tarea;

  type AdHocItem = { texto: string; marcado: boolean };
  const isAdHoc = !tarea.catalogoTareaId;

  const items = useMemo(
    () =>
      tarea.catalogoTarea?.checklistItems
        ? [...tarea.catalogoTarea.checklistItems].sort((a, b) => a.orden - b.orden)
        : [],
    [tarea.catalogoTarea],
  );
  const [localMarcados, setLocalMarcados] = useState<Map<string, boolean>>(() => {
    const m = new Map<string, boolean>();
    for (const x of tarea.checklistMarcados) m.set(x.plantillaItemId, x.marcado);
    return m;
  });
  useEffect(() => {
    const m = new Map<string, boolean>();
    for (const x of tarea.checklistMarcados) m.set(x.plantillaItemId, x.marcado);
    setLocalMarcados(m);
  }, [tarea.checklistMarcados]);
  const overridesMap = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const x of tarea.checklistMarcados) {
      m.set(x.plantillaItemId, x.descripcionOverride ?? null);
    }
    return m;
  }, [tarea.checklistMarcados]);

  const [localAdHocItems, setLocalAdHocItems] = useState<AdHocItem[]>(() =>
    isAdHoc ? ((tarea.checklistAdHoc as AdHocItem[] | null) ?? []) : [],
  );
  useEffect(() => {
    if (isAdHoc) setLocalAdHocItems((tarea.checklistAdHoc as AdHocItem[] | null) ?? []);
  }, [tarea.checklistAdHoc, isAdHoc]);

  const totalItems = isAdHoc ? localAdHocItems.length : items.length;
  const marcados = isAdHoc
    ? localAdHocItems.filter((i) => i.marcado).length
    : items.filter((i) => localMarcados.get(i.id)).length;
  const obligatoriosRestantes = isAdHoc
    ? localAdHocItems.filter((i) => !i.marcado).length
    : items.filter((i) => i.obligatorio && !localMarcados.get(i.id)).length;
  const puedeCompletar =
    totalItems > 0 &&
    obligatoriosRestantes === 0 &&
    tarea.estado !== "COMPLETADA" &&
    tarea.estado !== "OMITIDA";

  const urgencia = diasRestantes(tarea.fechaEstimadaFin);
  const requiereValidacion = tarea.requiereValidacionJefe && !tarea.validadaEn;

  const onToggleItem = (itemId: string, nuevo: boolean) => {
    setLocalMarcados((prev) => new Map(prev).set(itemId, nuevo));
    void marcarChecklistItem({
      tareaId: tarea.id,
      itemPlantillaId: itemId,
      marcado: nuevo,
    }).then((res) => {
      if (!res.success) {
        setLocalMarcados((prev) => new Map(prev).set(itemId, !nuevo));
        toast.error(res.error ?? "Error al guardar");
      } else {
        router.refresh();
      }
    });
  };

  const onToggleAdHocItem = (indice: number, nuevo: boolean) => {
    setLocalAdHocItems((prev) =>
      prev.map((item, i) => (i === indice ? { ...item, marcado: nuevo } : item)),
    );
    void marcarChecklistAdHocItem({ tareaId: tarea.id, indice, marcado: nuevo }).then((res) => {
      if (!res.success) {
        setLocalAdHocItems((prev) =>
          prev.map((item, i) => (i === indice ? { ...item, marcado: !nuevo } : item)),
        );
        toast.error(res.error ?? "Error al guardar");
      } else {
        router.refresh();
      }
    });
  };

  const handleItemEditingChange = (isEditing: boolean) => {
    setEditingItem(isEditing);
    if (isEditing) onExpandChange?.(true);
    // collapse is handled externally by KanbanTareas click-outside
  };

  const onCompletarRapido = () => {
    startTransition(async () => {
      const tiempoEstimado = Math.round(
        (datos.tiempoMinimoMin + datos.tiempoMaximoMin) / 2,
      );
      const res = await completarTarea({
        tareaId: tarea.id,
        tiempoInvertidoMin: tiempoEstimado,
      });
      if (!res.success) {
        toast.error(res.error ?? "Error");
        return;
      }
      toast.success(
        res.data?.requiereValidacion
          ? "Completada · esperando validación del jefe"
          : `¡Completada! +${res.data?.puntosOtorgados ?? 0} pts`,
      );
      router.refresh();
    });
  };

  return (
    <Card
      className={cn(
        "transition-colors",
        tarea.estado === "BLOQUEADA" && "border-warning/40",
        urgencia.urgente && !expand && "border-primary/50",
        datos.esAdHoc && "border-dashed",
        negocioInfo && `border-l-4 ${negocioInfo.borderClass}`,
      )}
    >
      <CardContent className="space-y-2 p-3">
        {/* Encabezado — todo el título es link al detalle */}
        <Link
          href={`/tareas/${tarea.id}`}
          className="block space-y-0.5 rounded-sm transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>
              {datos.esAdHoc
                ? tarea.origen === "ASIGNADA_JEFE"
                  ? "Asignada por jefe"
                  : "Ad-hoc"
                : LABEL_CATEGORIA[datos.categoria] ?? datos.categoria}
            </span>
            {wf?.contextoMarca && <span>· {wf.contextoMarca}</span>}
          </div>
          <h4 className="text-sm font-semibold leading-tight line-clamp-2">
            {datos.nombre}
          </h4>
        </Link>

        {wf && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {wf.nombre}
          </p>
        )}

        {tarea.estado === "BLOQUEADA" && (
          <div className="flex items-start gap-1.5 rounded-md bg-warning/10 p-2 text-xs">
            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="font-medium">
                Esperando a {tarea.bloqueoExternoResponsable}
              </p>
              {tarea.bloqueoExternoDesde && (
                <p className="text-muted-foreground">
                  Desde {tarea.bloqueoExternoDesde.toLocaleDateString("es")}
                </p>
              )}
            </div>
          </div>
        )}

        {requiereValidacion && tarea.estado === "EN_REVISION" && (
          <div className="flex items-start gap-1.5 rounded-md bg-warning/10 p-2 text-xs">
            <UserCheck className="mt-0.5 h-3 w-3 flex-shrink-0 text-warning" />
            <p className="text-muted-foreground">Esperando validación del jefe</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span
              className={cn(
                "tabular-nums",
                urgencia.urgente && "font-semibold text-primary",
              )}
            >
              {urgencia.texto}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totalItems > 0 && (
              <span className="tabular-nums text-muted-foreground">
                {marcados}/{totalItems} ✓
              </span>
            )}
            {!hideActions && (
              <button
                type="button"
                onClick={onEliminar}
                disabled={isPending}
                className={cn(
                  "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                  armado
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "text-muted-foreground hover:text-destructive",
                )}
                title={armado ? "Clic para confirmar eliminación" : "Eliminar tarea"}
              >
                <Trash2 className="h-3 w-3" />
                {armado && <span>¿Eliminar?</span>}
              </button>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="h-5 text-[10px]">
            {datos.tiempoMinimoMin}-{datos.tiempoMaximoMin}min
          </Badge>
          <Badge variant="outline" className="h-5 text-[10px]">
            {datos.puntosBase} pts
          </Badge>
          <BadgeNegocio negocio={tarea.negocio} />
          {tarea.ejecutadaPorOtro && (
            <Badge variant="outline" className="h-5 text-[10px]">
              <Users className="mr-1 h-3 w-3" />
              Ayuda
            </Badge>
          )}
        </div>

        {/* Toggle checklist inline */}
        {totalItems > 0 && (
          <button
            type="button"
            onClick={() => {
              const next = !expand;
              setExpand(next);
              onExpandChange?.(next || editingItem);
            }}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs transition-all",
              expand
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-expanded={expand}
          >
            <span className="flex items-center gap-1.5">
              <ListChecks
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  expand && "text-primary",
                )}
              />
              <span className="font-medium">
                {expand ? "Ocultar checklist" : "Ver checklist"}
              </span>
              <span className="tabular-nums text-muted-foreground">
                ({marcados}/{totalItems})
              </span>
            </span>
            <motion.span
              animate={{ rotate: expand ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.span>
          </button>
        )}

        {/* Checklist expandido con animación */}
        <AnimatePresence initial={false}>
          {expand && totalItems > 0 && (
            <motion.div
              key="checklist"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.18 },
              }}
              className="overflow-hidden"
            >
              <div className="space-y-2 rounded-md border border-border/40 bg-muted/20 p-2.5 mt-1">
                <ul className="space-y-1.5">
                  {isAdHoc
                    ? localAdHocItems.map((item, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.025 }}
                        >
                          <ChecklistItemRow
                            itemPlantillaId={String(idx)}
                            indice={idx + 1}
                            descripcionOriginal={item.texto}
                            descripcionOverride={null}
                            obligatorio={true}
                            marcado={item.marcado}
                            disabled={hideActions}
                            onToggle={(nuevo) => onToggleAdHocItem(idx, nuevo)}
                            onEditarTexto={async () => ({ success: true })}
                            onEditingChange={handleItemEditingChange}
                            size="sm"
                          />
                        </motion.li>
                      ))
                    : items.map((item, idx) => (
                        <motion.li
                          key={item.id}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.025 }}
                        >
                          <ChecklistItemRow
                            itemPlantillaId={item.id}
                            indice={idx + 1}
                            descripcionOriginal={item.descripcion}
                            descripcionOverride={overridesMap.get(item.id) ?? null}
                            obligatorio={item.obligatorio}
                            marcado={localMarcados.get(item.id) ?? false}
                            disabled={hideActions}
                            onToggle={(nuevo) => onToggleItem(item.id, nuevo)}
                            onEditarTexto={(nuevo) =>
                              editarChecklistItemTexto({
                                tareaId: tarea.id,
                                itemPlantillaId: item.id,
                                descripcion: nuevo,
                              })
                            }
                            onEditingChange={handleItemEditingChange}
                            size="sm"
                          />
                        </motion.li>
                      ))}
                </ul>

                {puedeCompletar && !hideCompleteButton && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: totalItems * 0.025 }}
                  >
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={onCompletarRapido}
                      disabled={isPending}
                    >
                      <CheckCircle2 />
                      Completar tarea
                    </Button>
                  </motion.div>
                )}
                {!puedeCompletar && obligatoriosRestantes > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Faltan {obligatoriosRestantes} pasos obligatorios
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
