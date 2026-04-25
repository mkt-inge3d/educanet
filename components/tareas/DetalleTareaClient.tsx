"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Pause,
  Play,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  agregarItemChecklistAdHoc,
  completarTarea,
  desbloquearTarea,
  editarChecklistItemTexto,
  editarTareaInstancia,
  eliminarItemChecklistAdHoc,
  eliminarTareaInstancia,
  iniciarTarea,
  marcarChecklistAdHocItem,
  marcarChecklistItem,
  reportarBloqueoExterno,
} from "@/lib/tareas/actions";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { datosTarea } from "@/lib/tareas/tarea-datos";
import {
  InlineDate,
  InlineNegocio,
  InlineNumber,
  InlineText,
  InlineTextarea,
} from "./InlineEditable";
import { CheckSquare, Square } from "lucide-react";
import type { Negocio, Prisma } from "@prisma/client";

type ChecklistAdHocItem = { texto: string; marcado: boolean };

type TareaDetalle = Prisma.TareaInstanciaGetPayload<{
  include: {
    catalogoTarea: {
      include: {
        checklistItems: true;
        rolResponsable: true;
      };
    };
    workflowInstancia: {
      select: {
        id: true;
        nombre: true;
        fechaHito: true;
        contextoMarca: true;
        responsableGeneralId: true;
      };
    };
    asignadoA: { select: { id: true; nombre: true; apellido: true; puesto: { select: { nombre: true } } } };
    ejecutadaRealmente: { select: { id: true; nombre: true; apellido: true } };
    checklistMarcados: true;
  };
}>;

type Companero = {
  id: string;
  nombre: string;
  apellido: string;
  puesto: { nombre: string } | null;
};

export function DetalleTareaClient({
  tarea,
  companeros,
  modoLectura = false,
}: {
  tarea: TareaDetalle;
  companeros: Companero[];
  modoLectura?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const cat = tarea.catalogoTarea;
  const datos = datosTarea(tarea);
  const itemsOrdenados = useMemo(
    () => (cat?.checklistItems ? [...cat.checklistItems].sort((a, b) => a.orden - b.orden) : []),
    [cat],
  );
  const [localMarcados, setLocalMarcados] = useState<Map<string, boolean>>(() => {
    const m = new Map<string, boolean>();
    for (const marcado of tarea.checklistMarcados) {
      m.set(marcado.plantillaItemId, marcado.marcado);
    }
    return m;
  });
  const overridesMap = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const x of tarea.checklistMarcados) {
      m.set(x.plantillaItemId, x.descripcionOverride ?? null);
    }
    return m;
  }, [tarea.checklistMarcados]);

  const itemsCompletados = itemsOrdenados.filter((i) => localMarcados.get(i.id)).length;
  const totalObligatorios = itemsOrdenados.filter((i) => i.obligatorio).length;
  const obligatoriosMarcados = itemsOrdenados.filter(
    (i) => i.obligatorio && localMarcados.get(i.id),
  ).length;
  const progreso =
    itemsOrdenados.length > 0
      ? Math.round((itemsCompletados / itemsOrdenados.length) * 100)
      : 0;

  const onToggle = (itemId: string, nuevoEstado: boolean) => {
    setLocalMarcados(prev => new Map(prev).set(itemId, nuevoEstado));
    void marcarChecklistItem({
      tareaId: tarea.id,
      itemPlantillaId: itemId,
      marcado: nuevoEstado,
    }).then(res => {
      if (!res.success) {
        setLocalMarcados(prev => new Map(prev).set(itemId, !nuevoEstado));
        toast.error(res.error ?? "Error al guardar");
      }
    });
  };

  const onIniciar = () => {
    startTransition(async () => {
      const res = await iniciarTarea(tarea.id);
      if (!res.success) toast.error(res.error ?? "Error");
      else {
        toast.success("Tarea iniciada");
        router.refresh();
      }
    });
  };

  const onDesbloquear = () => {
    startTransition(async () => {
      const res = await desbloquearTarea(tarea.id);
      if (!res.success) toast.error(res.error ?? "Error");
      else {
        toast.success("Tarea desbloqueada");
        router.refresh();
      }
    });
  };

  return (
    <>
      {modoLectura && tarea.asignadoA && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Users className="h-4 w-4 flex-shrink-0 text-primary" />
          <span className="text-muted-foreground">
            Viendo como jefe ·{" "}
            <strong className="text-foreground">
              {tarea.asignadoA.nombre} {tarea.asignadoA.apellido}
            </strong>
            {tarea.asignadoA.puesto?.nombre && ` · ${tarea.asignadoA.puesto.nombre}`}
          </span>
        </div>
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {cat ? (
            <>
              <Badge variant="outline">{cat.categoria.replace(/_/g, " ")}</Badge>
              <Badge variant="outline">{cat.tipoTrabajo}</Badge>
              <Badge variant="outline">Rol: {cat.rolResponsable.nombre}</Badge>
            </>
          ) : (
            <Badge variant="outline">
              {tarea.origen === "ASIGNADA_JEFE" ? "Asignada por jefe" : "Ad-hoc"}
            </Badge>
          )}
          {!modoLectura && (
            <InlineNegocio
              value={tarea.negocio}
              onSave={(nuevo) =>
                editarTareaInstancia({ tareaId: tarea.id, negocio: nuevo })
              }
            />
          )}
          {modoLectura && tarea.negocio && (
            <Badge variant="outline">{tarea.negocio}</Badge>
          )}
        </div>

        {modoLectura ? (
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{datos.nombre}</h1>
        ) : (
          <InlineText
            value={datos.nombre}
            onSave={(nuevo) =>
              editarTareaInstancia({ tareaId: tarea.id, nombreAdHoc: nuevo })
            }
            allowEmpty={!!cat}
            emptyHint={
              cat ? `Al guardar vacío, vuelve al nombre original "${cat.nombre}"` : undefined
            }
            placeholder="Nombre de la tarea"
            className="text-2xl font-semibold tracking-tight sm:text-3xl block w-full"
            inputClassName="text-2xl sm:text-3xl font-semibold h-auto py-1"
          />
        )}
        {datos.tieneOverrideNombre && cat && (
          <p className="text-xs text-muted-foreground italic">
            Nombre personalizado (original: {cat.nombre})
          </p>
        )}

        {tarea.workflowInstancia && (
          <p className="text-sm text-muted-foreground">
            Workflow:{" "}
            <strong className="text-foreground">
              {tarea.workflowInstancia.nombre}
            </strong>
            {tarea.workflowInstancia.contextoMarca &&
              ` · ${tarea.workflowInstancia.contextoMarca}`}
            {" · hito "}
            {tarea.workflowInstancia.fechaHito.toLocaleDateString("es")}
          </p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              {modoLectura ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {datos.descripcion || <span className="italic">Sin descripción</span>}
                </p>
              ) : (
                <>
                  <InlineTextarea
                    value={datos.descripcion}
                    placeholder="Agregar descripción"
                    className="text-sm leading-relaxed text-muted-foreground"
                    onSave={(nuevo) =>
                      editarTareaInstancia({
                        tareaId: tarea.id,
                        descripcionAdHoc: nuevo,
                      })
                    }
                  />
                  {datos.tieneOverrideDescripcion && cat && (
                    <p className="mt-2 text-[11px] text-muted-foreground italic">
                      Descripción personalizada · dejá el campo vacío para volver a
                      la original del catálogo
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {tarea.ejecutadaPorOtro && tarea.ejecutadaRealmente && (
            <div className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-sm">
              <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <div>
                <p className="font-medium">
                  Ejecutada con ayuda de {tarea.ejecutadaRealmente.nombre}{" "}
                  {tarea.ejecutadaRealmente.apellido}
                </p>
                {tarea.motivoAyuda && (
                  <p className="text-muted-foreground">{tarea.motivoAyuda}</p>
                )}
              </div>
            </div>
          )}

          {tarea.estado === "BLOQUEADA" && (
            <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
              <div className="space-y-1">
                <p className="font-medium">
                  Esperando a {tarea.bloqueoExternoResponsable}
                </p>
                <p className="text-muted-foreground">{tarea.bloqueoExternoMotivo}</p>
                {tarea.bloqueoExternoDesde && (
                  <p className="text-xs text-muted-foreground">
                    Bloqueada desde{" "}
                    {tarea.bloqueoExternoDesde.toLocaleDateString("es")}. Tu
                    calificación no se ve afectada.
                  </p>
                )}
              </div>
            </div>
          )}

          {itemsOrdenados.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Checklist</CardTitle>
              <span className="text-xs tabular-nums text-muted-foreground">
                {itemsCompletados}/{itemsOrdenados.length} completados
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={progreso} />
              <ul className="space-y-2">
                {itemsOrdenados.map((item, idx) => {
                  const disabled =
                    modoLectura || tarea.estado === "COMPLETADA" || tarea.estado === "OMITIDA";
                  return (
                    <li key={item.id} className="rounded-lg border p-3">
                      <ChecklistItemRow
                        itemPlantillaId={item.id}
                        indice={idx + 1}
                        descripcionOriginal={item.descripcion}
                        descripcionOverride={overridesMap.get(item.id) ?? null}
                        ayudaContextual={item.ayudaContextual}
                        obligatorio={item.obligatorio}
                        marcado={localMarcados.get(item.id) ?? false}
                        disabled={disabled}
                        onToggle={(nuevo) => onToggle(item.id, nuevo)}
                        onEditarTexto={(nuevo) =>
                          editarChecklistItemTexto({
                            tareaId: tarea.id,
                            itemPlantillaId: item.id,
                            descripcion: nuevo,
                          })
                        }
                        size="md"
                      />
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
          )}

          {!modoLectura && <ChecklistAdHoc tarea={tarea} />}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Tiempo estimado
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {datos.esAdHoc && !modoLectura ? (
                    <>
                      <InlineNumber
                        value={datos.tiempoMinimoMin}
                        min={1}
                        max={9999}
                        onSave={(nuevo) =>
                          editarTareaInstancia({
                            tareaId: tarea.id,
                            tiempoEstimadoMinAdHoc: nuevo,
                          })
                        }
                      />
                      {"–"}
                      <InlineNumber
                        value={datos.tiempoMaximoMin}
                        min={datos.tiempoMinimoMin}
                        max={9999}
                        onSave={(nuevo) =>
                          editarTareaInstancia({
                            tareaId: tarea.id,
                            tiempoEstimadoMaxAdHoc: nuevo,
                          })
                        }
                      />
                      {" min"}
                    </>
                  ) : (
                    `${datos.tiempoMinimoMin}–${datos.tiempoMaximoMin} min`
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Puntos estimados
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {datos.puntosBase} pts
                </p>
                <p className="text-xs text-muted-foreground">
                  {datos.esAdHoc
                    ? "El jefe ajusta al validar"
                    : [
                        datos.bonusATiempo > 0 && `+${datos.bonusATiempo} a tiempo`,
                        datos.bonusDesbloqueo > 0 && `+${datos.bonusDesbloqueo} desbloqueando`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || null}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Fechas
                </p>
                <div className="mt-1 space-y-1 text-sm">
                  {modoLectura ? (
                    <>
                      <p>
                        <span className="text-muted-foreground">Inicio: </span>
                        {tarea.fechaEstimadaInicio
                          ? tarea.fechaEstimadaInicio.toLocaleDateString("es")
                          : "—"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Fin: </span>
                        {tarea.fechaEstimadaFin
                          ? tarea.fechaEstimadaFin.toLocaleDateString("es")
                          : "—"}
                      </p>
                    </>
                  ) : (
                    <>
                      <InlineDate
                        label="Inicio"
                        value={tarea.fechaEstimadaInicio}
                        onSave={(nuevo) =>
                          editarTareaInstancia({
                            tareaId: tarea.id,
                            fechaEstimadaInicio: nuevo,
                          })
                        }
                      />
                      <br />
                      <InlineDate
                        label="Fin"
                        value={tarea.fechaEstimadaFin}
                        onSave={(nuevo) =>
                          editarTareaInstancia({
                            tareaId: tarea.id,
                            fechaEstimadaFin: nuevo,
                          })
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {!modoLectura && (
            <div className="space-y-2">
              {tarea.estado === "PENDIENTE" && (
                <Button className="w-full" onClick={onIniciar} disabled={isPending}>
                  <Play />
                  Iniciar tarea
                </Button>
              )}
              {tarea.estado === "BLOQUEADA" && (
                <Button className="w-full" onClick={onDesbloquear} disabled={isPending}>
                  <Play />
                  Se desbloqueó
                </Button>
              )}
              {tarea.estado === "EN_PROGRESO" && (
                <ModalCompletar
                  tarea={tarea}
                  companeros={companeros}
                  obligatoriosMarcados={obligatoriosMarcados}
                  totalObligatorios={totalObligatorios}
                  itemsCompletados={itemsCompletados}
                  itemsTotales={itemsOrdenados.length}
                />
              )}
              {tarea.estado !== "COMPLETADA" && tarea.estado !== "BLOQUEADA" && tarea.estado !== "OMITIDA" && (
                <ModalBloqueo tareaId={tarea.id} />
              )}
              <ModalEliminarTarea tareaId={tarea.id} />
            </div>
          )}

          {tarea.estado === "COMPLETADA" && (
            <Card className="border-success/40 bg-success/5">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex items-center gap-2 font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Completada
                </div>
                <p className="text-xs text-muted-foreground">
                  {tarea.puntosOtorgados} pts
                  {tarea.puntosATiempo && " · a tiempo"}
                  {tarea.puntosDesbloqueo && " · desbloqueó a otros"}
                </p>
                {tarea.tiempoInvertidoMin && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Tiempo real: {tarea.tiempoInvertidoMin} min
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}

function ModalEliminarTarea({ tareaId }: { tareaId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onConfirmar = () => {
    startTransition(async () => {
      const res = await eliminarTareaInstancia(tareaId);
      if (!res.success) {
        toast.error(res.error ?? "Error al eliminar");
        setOpen(false);
        return;
      }
      toast.success("Tarea eliminada");
      router.back();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
            Eliminar tarea
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar esta tarea?</DialogTitle>
          <DialogDescription>
            Se eliminará permanentemente junto con su checklist y progreso. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirmar}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Eliminando…" : "Sí, eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModalBloqueo({ tareaId }: { tareaId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [responsable, setResponsable] = useState("");
  const [motivo, setMotivo] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsable.trim() || !motivo.trim()) return;
    startTransition(async () => {
      const res = await reportarBloqueoExterno({
        tareaId,
        responsable: responsable.trim(),
        motivo: motivo.trim(),
      });
      if (!res.success) {
        toast.error(res.error ?? "Error");
      } else {
        toast.success("Bloqueo reportado");
        setOpen(false);
        setResponsable("");
        setMotivo("");
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="subtle" className="w-full">
            <Pause />
            Reportar bloqueo
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar bloqueo externo</DialogTitle>
          <DialogDescription>
            No avanzás por causa externa. Esto no afecta tu calificación ni tu
            rango del mes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="responsable">¿Quién o qué te bloquea?</Label>
            <Input
              id="responsable"
              placeholder="Ej: Especialista Autodesk, Comercial Luana"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              rows={3}
              placeholder="Ej: Esperando ficha pre-webinar hace 3 días, ya envié 2 recordatorios"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando…" : "Reportar bloqueo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChecklistAdHoc({ tarea }: { tarea: TareaDetalle }) {
  const router = useRouter();
  const [nuevoTexto, setNuevoTexto] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [localItems, setLocalItems] = useState<ChecklistAdHocItem[]>(
    (tarea.checklistAdHoc as ChecklistAdHocItem[] | null) ?? []
  );
  const [isPending, startTransition] = useTransition();

  // Solo aplica a tareas ad-hoc
  if (tarea.catalogoTareaId) return null;

  const cerrada = tarea.estado === "COMPLETADA" || tarea.estado === "OMITIDA";

  const marcados = localItems.filter((i) => i.marcado).length;
  const progreso = localItems.length > 0 ? Math.round((marcados / localItems.length) * 100) : 0;

  const toggle = (indice: number, marcado: boolean) => {
    // Optimistic: update immediately, sync server in background — no router.refresh()
    setLocalItems(prev => prev.map((item, i) => i === indice ? { ...item, marcado } : item));
    void marcarChecklistAdHocItem({ tareaId: tarea.id, indice, marcado }).then(res => {
      if (!res.success) {
        setLocalItems(prev => prev.map((item, i) => i === indice ? { ...item, marcado: !marcado } : item));
        toast.error(res.error ?? "Error");
      }
    });
  };

  const agregar = () => {
    const texto = nuevoTexto.trim();
    if (!texto) return;
    setNuevoTexto("");
    setLocalItems(prev => [...prev, { texto, marcado: false }]);
    startTransition(async () => {
      const res = await agregarItemChecklistAdHoc({ tareaId: tarea.id, texto });
      if (!res.success) {
        setLocalItems(prev => prev.slice(0, -1));
        toast.error(res.error ?? "Error");
      } else {
        router.refresh();
        inputRef.current?.focus();
      }
    });
  };

  const eliminar = (indice: number) => {
    const removed = localItems[indice];
    setLocalItems(prev => prev.filter((_, i) => i !== indice));
    startTransition(async () => {
      const res = await eliminarItemChecklistAdHoc({ tareaId: tarea.id, indice });
      if (!res.success) {
        setLocalItems(prev => [...prev.slice(0, indice), removed, ...prev.slice(indice)]);
        toast.error(res.error ?? "Error");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Checklist</CardTitle>
        {localItems.length > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {marcados}/{localItems.length} completados
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {localItems.length > 0 && <Progress value={progreso} />}

        {localItems.length > 0 && (
          <ul className="space-y-2">
            {localItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <button
                  type="button"
                  disabled={cerrada}
                  onClick={() => toggle(i, !item.marcado)}
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                  aria-label={item.marcado ? "Desmarcar" : "Marcar completado"}
                >
                  {item.marcado ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm leading-snug ${item.marcado ? "line-through text-muted-foreground" : ""}`}
                >
                  {item.texto}
                </span>
                {!cerrada && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => eliminar(i)}
                    className="mt-0.5 shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-40"
                    aria-label="Eliminar paso"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {!cerrada && (
          <div className="flex gap-2 pt-1">
            <Input
              ref={inputRef}
              placeholder={localItems.length === 0 ? "Agregar primer paso…" : "Agregar paso…"}
              value={nuevoTexto}
              onChange={(e) => setNuevoTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregar();
                }
              }}
              disabled={isPending}
              className="text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={agregar}
              disabled={!nuevoTexto.trim() || isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ModalCompletar({
  tarea,
  companeros,
  obligatoriosMarcados,
  totalObligatorios,
  itemsCompletados,
  itemsTotales,
}: {
  tarea: TareaDetalle;
  companeros: Companero[];
  obligatoriosMarcados: number;
  totalObligatorios: number;
  itemsCompletados: number;
  itemsTotales: number;
}) {
  const router = useRouter();
  const datos = datosTarea(tarea);

  const fechaInicioRealMs = tarea.fechaInicioReal?.getTime();

  const [open, setOpen] = useState(false);
  const [tiempo, setTiempo] = useState(() =>
    fechaInicioRealMs
      ? Math.max(1, Math.round((new Date().getTime() - fechaInicioRealMs) / 60000))
      : datos.tiempoMinimoMin,
  );
  const [calidad, setCalidad] = useState<string>("");
  const [notas, setNotas] = useState("");
  const [ayudaToggle, setAyudaToggle] = useState(false);
  const [ayudaEjecutorId, setAyudaEjecutorId] = useState<string>("");
  const [ayudaMotivo, setAyudaMotivo] = useState("");
  const [isPending, startTransition] = useTransition();

  const checklistListo = obligatoriosMarcados >= totalObligatorios;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistListo) {
      toast.error("Completá los pasos obligatorios del checklist antes");
      return;
    }
    startTransition(async () => {
      const res = await completarTarea({
        tareaId: tarea.id,
        tiempoInvertidoMin: tiempo,
        calidadAutoeval: calidad ? parseInt(calidad, 10) : undefined,
        notasEjecutor: notas.trim() || undefined,
        ayudaCruzada:
          ayudaToggle && ayudaEjecutorId && ayudaMotivo.trim()
            ? {
                ejecutadaRealmenteId: ayudaEjecutorId,
                motivoAyuda: ayudaMotivo.trim(),
              }
            : undefined,
      });
      if (!res.success) {
        toast.error(res.error ?? "Error");
      } else {
        toast.success(
          `¡Completada! +${res.data?.puntosOtorgados ?? 0} pts${res.data?.puntosATiempo ? " (a tiempo)" : ""}`,
        );
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="w-full" disabled={!checklistListo}>
            <CheckCircle2 />
            Marcar completada
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Completar tarea</DialogTitle>
          <DialogDescription>
            {checklistListo
              ? "Confirmá los datos y otorgamos los puntos."
              : `Te faltan ${totalObligatorios - obligatoriosMarcados} pasos obligatorios (${itemsCompletados}/${itemsTotales} completados).`}
          </DialogDescription>
        </DialogHeader>

        {/* form is a direct grid child — scrollable fields, no footer inside */}
        <form
          id="completar-form"
          onSubmit={onSubmit}
          className="max-h-[52vh] overflow-y-auto space-y-4 py-1 pr-1"
        >
          <div className="space-y-2">
            <Label htmlFor="tiempo">Tiempo invertido (minutos)</Label>
            <Input
              id="tiempo"
              type="number"
              min={1}
              value={tiempo}
              onChange={(e) => setTiempo(Math.max(1, parseInt(e.target.value, 10) || 1))}
              required
            />
            <p className="text-xs text-muted-foreground tabular-nums">
              <Clock className="inline h-3 w-3" /> Estimado:{" "}
              {datos.tiempoMinimoMin}-{datos.tiempoMaximoMin} min
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calidad">Autoevaluación (opcional)</Label>
            <Select value={calidad} onValueChange={(v) => setCalidad(v ?? "")}>
              <SelectTrigger id="calidad">
                <SelectValue placeholder="¿Cómo salió?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 · Excelente</SelectItem>
                <SelectItem value="4">4 · Bien</SelectItem>
                <SelectItem value="3">3 · Aceptable</SelectItem>
                <SelectItem value="2">2 · Con fricciones</SelectItem>
                <SelectItem value="1">1 · Muchos problemas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              rows={2}
              placeholder="Ej: el ponente respondió más rápido de lo habitual"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={ayudaToggle}
                onChange={(e) => setAyudaToggle(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Esta tarea la ejecutó otra persona (ayuda cruzada)
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  El compañero recibe los puntos de la tarea + reconocimiento
                  automático.
                </span>
              </span>
            </label>

            {ayudaToggle && (
              <div className="space-y-2 pl-6">
                <div className="space-y-1">
                  <Label htmlFor="ayudaEjecutor">Compañero que ejecutó</Label>
                  <Select
                    value={ayudaEjecutorId}
                    onValueChange={(v) => setAyudaEjecutorId(v ?? "")}
                  >
                    <SelectTrigger id="ayudaEjecutor">
                      <SelectValue placeholder="Seleccioná" />
                    </SelectTrigger>
                    <SelectContent>
                      {companeros.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre} {c.apellido}
                          {c.puesto && ` · ${c.puesto.nombre}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ayudaMotivo">Motivo de la ayuda</Label>
                  <Input
                    id="ayudaMotivo"
                    placeholder="Ej: Sobrecarga de cursos en su semana"
                    value={ayudaMotivo}
                    onChange={(e) => setAyudaMotivo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        <DialogFooter className="sticky bottom-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="completar-form"
            disabled={
              isPending ||
              !checklistListo ||
              (ayudaToggle && (!ayudaEjecutorId || !ayudaMotivo.trim()))
            }
          >
            {isPending ? "Completando…" : "Confirmar completada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
