"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Loader2, FileText, ImageIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { revertirAprobado } from "@/lib/kpis/hitos-actions";
import type { ItemValidacion } from "@/lib/kpis/hitos-queries";

type Props = {
  item: ItemValidacion;
};

export function ItemValidacionKpi({ item }: Props) {
  const [comentario, setComentario] = useState("");
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [isPending, startTransition] = useTransition();

  function revertir() {
    if (!comentario.trim()) {
      setMostrarComentario(true);
      toast.error("Necesitas un comentario para regresarlo");
      return;
    }
    startTransition(async () => {
      const r = await revertirAprobado({
        instanciaId: item.instanciaId,
        comentario: comentario.trim(),
      });
      if (!r.success) {
        toast.error(r.error ?? "No se pudo regresar");
        return;
      }
      toast.success(
        `Regresado a ${item.user.nombre}. Se restaron ${item.puntosOtorgados} pts.`
      );
    });
  }

  const esPdf = item.evidenciaTipo === "application/pdf";

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium">
            {item.user.nombre} {item.user.apellido}
            <span className="ml-2 font-normal text-muted-foreground">
              · {item.codigo}
            </span>
          </p>
          <p className="mt-0.5 text-sm font-semibold">{item.nombre}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {item.frecuencia === "SEMANAL"
                ? `Semana ${item.semanaDelAnio}`
                : "Mensual"}
            </Badge>
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Terminado · +{item.puntosOtorgados} pts
            </Badge>
            {item.fechaValidado && (
              <span>
                Marcado{" "}
                {new Date(item.fechaValidado).toLocaleDateString("es", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {item.comentarioEmpleado && (
        <p className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-xs italic">
          &ldquo;{item.comentarioEmpleado}&rdquo;
        </p>
      )}

      {item.evidenciaUrl && (
        <div className="mt-3 overflow-hidden rounded-lg border">
          {esPdf ? (
            <a
              href={item.evidenciaUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-muted/40 p-3 text-sm hover:bg-muted/70"
            >
              <FileText className="h-4 w-4" />
              Abrir PDF de evidencia (URL valida 10 min)
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.evidenciaUrl}
              alt={`Evidencia de ${item.codigo}`}
              className="max-h-64 w-full bg-muted/30 object-contain"
            />
          )}
        </div>
      )}

      {!item.evidenciaUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          Sin evidencia adjunta (es opcional).
        </div>
      )}

      {mostrarComentario && (
        <Textarea
          placeholder="Por que lo regresas? (visible al empleado)..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={2}
          className="mt-3"
        />
      )}

      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => {
            if (!mostrarComentario) {
              setMostrarComentario(true);
            } else {
              revertir();
            }
          }}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          {mostrarComentario ? "Confirmar regresar" : "Regresar como incompleto"}
        </Button>
      </div>
    </div>
  );
}
