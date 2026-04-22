"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2, FileText, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { validarInstancia } from "@/lib/kpis/hitos-actions";
import type { ItemValidacion } from "@/lib/kpis/hitos-queries";

type Props = {
  item: ItemValidacion;
};

export function ItemValidacionKpi({ item }: Props) {
  const [comentario, setComentario] = useState("");
  const [mostrarComentario, setMostrarComentario] = useState(false);
  const [isPending, startTransition] = useTransition();

  function aprobar() {
    startTransition(async () => {
      const r = await validarInstancia({
        instanciaId: item.instanciaId,
        aprobar: true,
        comentario: comentario.trim() || undefined,
      });
      if (!r.success) {
        toast.error(r.error ?? "No se pudo aprobar");
        return;
      }
      toast.success(`+${r.puntos ?? item.puntosAOtorgar} pts a ${item.user.nombre}`);
    });
  }

  function rechazar() {
    if (!comentario.trim()) {
      setMostrarComentario(true);
      toast.error("Necesitas un comentario para rechazar");
      return;
    }
    startTransition(async () => {
      const r = await validarInstancia({
        instanciaId: item.instanciaId,
        aprobar: false,
        comentario: comentario.trim(),
      });
      if (!r.success) {
        toast.error(r.error ?? "No se pudo rechazar");
        return;
      }
      toast.success("Rechazado. El empleado fue notificado.");
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
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {item.frecuencia === "SEMANAL"
                ? `Semana ${item.semanaDelAnio}`
                : "Mensual"}
            </Badge>
            <span>+{item.puntosAOtorgar} pts</span>
            {item.fechaReportado && (
              <span>
                ·{" "}
                {new Date(item.fechaReportado).toLocaleDateString("es", {
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
              className="max-h-64 w-full object-contain bg-muted/30"
            />
          )}
        </div>
      )}

      {!item.evidenciaUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          Sin evidencia adjunta.
        </div>
      )}

      {mostrarComentario && (
        <Textarea
          placeholder="Comentario obligatorio para rechazar..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={2}
          className="mt-3"
        />
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="flex-1 gap-1 bg-success text-success-foreground hover:bg-success/90"
          onClick={aprobar}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Aprobar +{item.puntosAOtorgar}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1"
          onClick={() => {
            if (!mostrarComentario) {
              setMostrarComentario(true);
            } else {
              rechazar();
            }
          }}
          disabled={isPending}
        >
          <XCircle className="h-3.5 w-3.5" />
          {mostrarComentario ? "Confirmar rechazo" : "Rechazar"}
        </Button>
      </div>
    </div>
  );
}
