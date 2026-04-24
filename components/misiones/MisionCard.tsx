"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Target,
  BookOpen,
  Heart,
  BarChart3,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TipoMision, EstadoMision } from "@prisma/client";
import { completarMision, descartarMision } from "@/lib/misiones/actions";
import { LiquidRipple } from "@/components/ui/primitives/LiquidRipple";

const TIPO_VISUAL: Record<
  TipoMision,
  { icono: typeof Target; label: string }
> = {
  COMPLETAR_CURSO: { icono: BookOpen, label: "Curso" },
  AVANZAR_KPI: { icono: BarChart3, label: "KPI" },
  COMPLETAR_N_LECCIONES: { icono: BookOpen, label: "Lecciones" },
  OBTENER_BADGE: { icono: Target, label: "Badge" },
  RECONOCER_PEER: { icono: Heart, label: "Social" },
  REPORTAR_KPI: { icono: BarChart3, label: "Reporte" },
  PERSONALIZADA: { icono: Target, label: "Mision" },
};

export function MisionCard({
  id,
  titulo,
  descripcion,
  tipo,
  estado,
  puntosRecompensa,
  metaValor,
  progresoActual,
  cursoSlug,
}: {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoMision;
  estado: EstadoMision;
  puntosRecompensa: number;
  metaValor: number | null;
  progresoActual: number;
  cursoSlug?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [ripple, setRipple] = useState(false);
  const Icono = TIPO_VISUAL[tipo].icono;
  const completable =
    estado === "ACTIVA" && metaValor !== null && progresoActual >= metaValor;

  const completar = () => {
    startTransition(async () => {
      const res = await completarMision(id);
      if (res.success) {
        toast.success(`Mision completada · +${res.data?.puntosOtorgados} pts`);
        setRipple(true);
        setTimeout(() => setRipple(false), 1200);
      } else {
        toast.error(res.error);
      }
    });
  };

  const descartar = () => {
    if (!confirm("Descartar esta mision? Solo puedes descartar 1 por semana."))
      return;
    startTransition(async () => {
      const res = await descartarMision(id);
      if (res.success) toast.success("Mision descartada");
      else toast.error(res.error);
    });
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-4 transition-all",
        estado === "COMPLETADA" && "border-primary/40 bg-primary/5",
        estado === "VENCIDA" && "opacity-60",
        estado === "CANCELADA" && "opacity-50"
      )}
    >
      <LiquidRipple trigger={ripple} color="success" />
      <div className="mb-3 flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
            estado === "COMPLETADA"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icono className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <Badge variant="outline" className="mb-1 text-[10px]">
            {TIPO_VISUAL[tipo].label}
          </Badge>
          <h4 className="text-sm font-semibold leading-tight">{titulo}</h4>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground line-clamp-3">
        {descripcion}
      </p>

      {metaValor !== null && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium tabular-nums">
              {progresoActual}/{metaValor}
            </span>
          </div>
          <Progress
            value={Math.min(100, (progresoActual / metaValor) * 100)}
            className="h-1.5"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />+{puntosRecompensa} pts
        </span>

        {estado === "ACTIVA" && (
          <div className="flex items-center gap-1">
            {cursoSlug && (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/cursos/${cursoSlug}`} />}
              >
                Ir al curso
              </Button>
            )}
            {completable ? (
              <Button size="sm" onClick={completar} disabled={isPending}>
                <Check className="mr-1 h-3 w-3" />
                Completar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={descartar}
                disabled={isPending}
                aria-label="Descartar mision"
                className="h-8 w-8 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {estado === "COMPLETADA" && (
          <Badge className="gap-1 bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
            Completada
          </Badge>
        )}

        {estado === "VENCIDA" && (
          <span className="text-xs text-muted-foreground">Vencida</span>
        )}
      </div>
    </div>
  );
}
