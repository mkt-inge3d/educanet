"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Ban,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModalReportarHito } from "./ModalReportarHito";
import type { HitoConInstancia } from "@/lib/kpis/hitos-queries";

type Props = {
  hito: HitoConInstancia;
  semanaActual: number;
};

function instanciaActual(hito: HitoConInstancia, semanaActual: number) {
  if (hito.frecuencia === "SEMANAL") {
    return hito.instancias.find((i) => i.semanaDelAnio === semanaActual) ?? null;
  }
  // Mensual: si hay multiples (condicional con cantidadMaxMes), tomar la primera
  // pendiente o la mas reciente.
  const pendiente = hito.instancias.find(
    (i) => i.estado === "PENDIENTE" || i.estado === "RECHAZADO"
  );
  return pendiente ?? hito.instancias[0] ?? null;
}

function badgeEstado(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> Pendiente
        </Badge>
      );
    case "EN_REVISION":
      return (
        <Badge className="gap-1 bg-warning text-warning-foreground">
          <Clock className="h-3 w-3" /> En revision
        </Badge>
      );
    case "APROBADO":
      return (
        <Badge className="gap-1 bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3" /> Aprobado
        </Badge>
      );
    case "RECHAZADO":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Rechazado
        </Badge>
      );
    case "NO_APLICA":
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <Ban className="h-3 w-3" /> No aplica
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
}

export function HitoCard({ hito, semanaActual }: Props) {
  const [open, setOpen] = useState(false);

  if (hito.noAplica) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-4 opacity-70">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-mono text-muted-foreground">
              {hito.codigo}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm font-medium">
              {hito.nombre}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
            <Ban className="h-3 w-3" /> No aplica
          </Badge>
        </div>
        {hito.motivoNoAplica && (
          <p className="mt-2 text-xs italic text-muted-foreground">
            {hito.motivoNoAplica}
          </p>
        )}
      </div>
    );
  }

  const inst = instanciaActual(hito, semanaActual);
  const estado = inst?.estado ?? "SIN_INSTANCIA";
  const puntosAOtorgar = hito.puntosAjustados ?? hito.puntos;

  const puedeReportar =
    inst &&
    (inst.estado === "PENDIENTE" || inst.estado === "RECHAZADO");

  return (
    <>
      <div className="rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono text-muted-foreground">
              {hito.codigo} · +{puntosAOtorgar} pts
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm font-medium">
              {hito.nombre}
            </p>
          </div>
          {inst ? (
            badgeEstado(estado)
          ) : (
            <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
              <AlertCircle className="h-3 w-3" /> Sin generar
            </Badge>
          )}
        </div>

        {inst?.comentarioRevisor && inst.estado === "RECHAZADO" && (
          <div className="mt-2 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
            <strong>Comentario del jefe:</strong> {inst.comentarioRevisor}
          </div>
        )}

        {puedeReportar && (
          <Button
            size="sm"
            variant={inst.estado === "RECHAZADO" ? "default" : "outline"}
            className="mt-3 w-full gap-1"
            onClick={() => setOpen(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            {inst.estado === "RECHAZADO" ? "Reenviar" : "Reportar"}
          </Button>
        )}

        {inst?.estado === "EN_REVISION" && inst.fechaReportado && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Reportado{" "}
            {new Date(inst.fechaReportado).toLocaleDateString("es", {
              day: "numeric",
              month: "short",
            })}
            . Esperando revision del jefe.
          </p>
        )}

        {inst?.estado === "APROBADO" && inst.fechaValidado && (
          <p className="mt-2 text-[11px] text-success">
            Validado · +{inst.puntosOtorgados} pts
          </p>
        )}
      </div>

      {puedeReportar && inst && (
        <ModalReportarHito
          open={open}
          onOpenChange={setOpen}
          instanciaId={inst.id}
          codigo={hito.codigo}
          nombre={hito.nombre}
          descripcion={hito.descripcion}
        />
      )}
    </>
  );
}
