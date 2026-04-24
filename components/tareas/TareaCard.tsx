"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  ListChecks,
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
import { completarTarea, marcarChecklistItem } from "@/lib/tareas/actions";
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

export function TareaCard({ tarea }: TareaCardProps) {
  const router = useRouter();
  const [expand, setExpand] = useState(false);
  const [isPending, startTransition] = useTransition();

  const datos = datosTarea(tarea);
  const negocioInfo = infoNegocio(tarea.negocio);
  const { workflowInstancia: wf } = tarea;

  const items = useMemo(
    () =>
      tarea.catalogoTarea?.checklistItems
        ? [...tarea.catalogoTarea.checklistItems].sort((a, b) => a.orden - b.orden)
        : [],
    [tarea.catalogoTarea],
  );
  const marcadosMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const x of tarea.checklistMarcados) m.set(x.plantillaItemId, x.marcado);
    return m;
  }, [tarea.checklistMarcados]);

  const totalItems = items.length;
  const marcados = items.filter((i) => marcadosMap.get(i.id)).length;
  const obligatoriosRestantes = items.filter(
    (i) => i.obligatorio && !marcadosMap.get(i.id),
  ).length;
  const puedeCompletar =
    items.length > 0 &&
    obligatoriosRestantes === 0 &&
    tarea.estado !== "COMPLETADA" &&
    tarea.estado !== "OMITIDA";

  const urgencia = diasRestantes(tarea.fechaEstimadaFin);
  const requiereValidacion = tarea.requiereValidacionJefe && !tarea.validadaEn;

  const onToggleItem = (itemId: string, nuevo: boolean) => {
    startTransition(async () => {
      const res = await marcarChecklistItem({
        tareaId: tarea.id,
        itemPlantillaId: itemId,
        marcado: nuevo,
      });
      if (!res.success) toast.error(res.error ?? "Error");
      else router.refresh();
    });
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
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
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
            <h4 className="mt-0.5 text-sm font-semibold leading-tight line-clamp-2">
              {datos.nombre}
            </h4>
          </div>
          <Link
            href={`/tareas/${tarea.id}`}
            className="flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Ver detalle"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

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
          {totalItems > 0 && (
            <span className="tabular-nums text-muted-foreground">
              {marcados}/{totalItems} ✓
            </span>
          )}
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
            onClick={() => setExpand((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-expanded={expand}
          >
            <span className="flex items-center gap-1.5">
              <ListChecks className="h-3 w-3" />
              {expand ? "Ocultar checklist" : `Ver checklist (${marcados}/${totalItems})`}
            </span>
            {expand ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}

        {/* Checklist expandido */}
        {expand && totalItems > 0 && (
          <div className="space-y-2 rounded-md border border-border/40 bg-muted/20 p-2.5">
            <ul className="space-y-1.5">
              {items.map((item, idx) => {
                const marcado = marcadosMap.get(item.id) ?? false;
                return (
                  <li key={item.id} className="flex items-start gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onToggleItem(item.id, !marcado)}
                      className={cn(
                        "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
                        marcado
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 hover:border-primary",
                        isPending && "opacity-60",
                      )}
                      aria-label={marcado ? "Desmarcar paso" : "Marcar paso"}
                    >
                      {marcado ? (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      ) : (
                        <Circle className="h-2.5 w-2.5 opacity-0" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "text-xs leading-snug",
                        marcado && "text-muted-foreground line-through",
                      )}
                    >
                      <span className="mr-1 text-muted-foreground tabular-nums">
                        {idx + 1}.
                      </span>
                      {item.descripcion}
                      {!item.obligatorio && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          (opcional)
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>

            {puedeCompletar && (
              <Button
                size="sm"
                className="w-full"
                onClick={onCompletarRapido}
                disabled={isPending}
              >
                <CheckCircle2 />
                Completar tarea
              </Button>
            )}
            {!puedeCompletar && obligatoriosRestantes > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Faltan {obligatoriosRestantes} pasos obligatorios
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
