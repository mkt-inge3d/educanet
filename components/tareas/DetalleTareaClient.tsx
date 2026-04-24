"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Pause,
  Play,
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
  completarTarea,
  desbloquearTarea,
  iniciarTarea,
  marcarChecklistItem,
  reportarBloqueoExterno,
} from "@/lib/tareas/actions";
import { datosTarea } from "@/lib/tareas/tarea-datos";
import { BadgeNegocio } from "./SelectorNegocio";
import { ModalEditarTarea } from "./ModalEditarTarea";
import type { Prisma } from "@prisma/client";

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
}: {
  tarea: TareaDetalle;
  companeros: Companero[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const cat = tarea.catalogoTarea;
  const datos = datosTarea(tarea);
  const itemsOrdenados = useMemo(
    () => (cat?.checklistItems ? [...cat.checklistItems].sort((a, b) => a.orden - b.orden) : []),
    [cat],
  );
  const marcadosMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const marcado of tarea.checklistMarcados) {
      m.set(marcado.plantillaItemId, marcado.marcado);
    }
    return m;
  }, [tarea.checklistMarcados]);

  const itemsCompletados = itemsOrdenados.filter((i) =>
    marcadosMap.get(i.id),
  ).length;
  const totalObligatorios = itemsOrdenados.filter((i) => i.obligatorio).length;
  const obligatoriosMarcados = itemsOrdenados.filter(
    (i) => i.obligatorio && marcadosMap.get(i.id),
  ).length;
  const progreso =
    itemsOrdenados.length > 0
      ? Math.round((itemsCompletados / itemsOrdenados.length) * 100)
      : 0;

  const onToggle = (itemId: string, nuevoEstado: boolean) => {
    startTransition(async () => {
      const res = await marcarChecklistItem({
        tareaId: tarea.id,
        itemPlantillaId: itemId,
        marcado: nuevoEstado,
      });
      if (!res.success) {
        toast.error(res.error ?? "Error al guardar");
      } else {
        router.refresh();
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
      <header className="space-y-2">
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
          <BadgeNegocio negocio={tarea.negocio} />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {datos.nombre}
          </h1>
          {tarea.estado !== "COMPLETADA" && tarea.estado !== "OMITIDA" && (
            <ModalEditarTarea tarea={tarea} />
          )}
        </div>
        {tarea.workflowInstancia && (
          <p className="text-sm text-muted-foreground">
            Workflow: <strong className="text-foreground">{tarea.workflowInstancia.nombre}</strong>
            {tarea.workflowInstancia.contextoMarca && ` · ${tarea.workflowInstancia.contextoMarca}`}
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
              <p className="text-sm leading-relaxed text-muted-foreground">
                {datos.descripcion || "Sin descripción."}
              </p>
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
                  const marcado = marcadosMap.get(item.id) ?? false;
                  const disabled =
                    tarea.estado === "COMPLETADA" || tarea.estado === "OMITIDA";
                  return (
                    <li key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <button
                        type="button"
                        disabled={disabled || isPending}
                        onClick={() => onToggle(item.id, !marcado)}
                        className={cn(
                          "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
                          marcado
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 hover:border-primary",
                          disabled && "cursor-not-allowed opacity-60",
                        )}
                        aria-label={marcado ? "Desmarcar paso" : "Marcar paso"}
                      >
                        {marcado && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm",
                            marcado && "text-muted-foreground line-through",
                          )}
                        >
                          <span className="font-medium tabular-nums text-muted-foreground mr-2">
                            {idx + 1}.
                          </span>
                          {item.descripcion}
                          {!item.obligatorio && (
                            <span className="ml-2 text-[10px] text-muted-foreground">
                              (opcional)
                            </span>
                          )}
                        </p>
                        {item.ayudaContextual && (
                          <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                            <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            {item.ayudaContextual}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Tiempo estimado
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {datos.tiempoMinimoMin}–{datos.tiempoMaximoMin} min
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Puntos
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {datos.puntosBase} base
                </p>
                {datos.bonusATiempo > 0 && (
                  <p className="text-xs text-muted-foreground">
                    +{datos.bonusATiempo} si completás a tiempo
                  </p>
                )}
                {datos.bonusDesbloqueo > 0 && (
                  <p className="text-xs text-muted-foreground">
                    +{datos.bonusDesbloqueo} si desbloqueás a otros
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Fechas
                </p>
                <p className="mt-1 text-sm tabular-nums">
                  Inicio: {tarea.fechaEstimadaInicio.toLocaleDateString("es")}
                </p>
                <p className="text-sm tabular-nums">
                  Fin: {tarea.fechaEstimadaFin.toLocaleDateString("es")}
                </p>
              </div>
            </CardContent>
          </Card>

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
          </div>

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
          <Button className="w-full">
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

        <form onSubmit={onSubmit} className="space-y-4">
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

          <DialogFooter>
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
              disabled={
                isPending ||
                !checklistListo ||
                (ayudaToggle && (!ayudaEjecutorId || !ayudaMotivo.trim()))
              }
            >
              {isPending ? "Completando…" : "Confirmar completada"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
