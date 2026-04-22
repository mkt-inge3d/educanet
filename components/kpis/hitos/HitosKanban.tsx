"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  XCircle,
  Ban,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModalReportarHito } from "./ModalReportarHito";
import { VelocimetroPuntos } from "./VelocimetroPuntos";
import type {
  HitoConInstancia,
  ProgresoHitosUsuario,
} from "@/lib/kpis/hitos-queries";

type HitoView = {
  hito: HitoConInstancia;
  instanciaId: string | null;
  estado: "PENDIENTE" | "EN_REVISION" | "RECHAZADO" | "APROBADO" | "NO_APLICA";
  semanaDelAnio: number | null;
  puntosOtorgados: number;
  comentarioRevisor: string | null;
  fechaReportado: Date | null;
  fechaValidado: Date | null;
};

function aplanarParaKanban(progreso: ProgresoHitosUsuario): HitoView[] {
  const items: HitoView[] = [];
  for (const h of [...progreso.semanales, ...progreso.mensuales]) {
    if (h.noAplica) {
      items.push({
        hito: h,
        instanciaId: null,
        estado: "NO_APLICA",
        semanaDelAnio: null,
        puntosOtorgados: 0,
        comentarioRevisor: h.motivoNoAplica,
        fechaReportado: null,
        fechaValidado: null,
      });
      continue;
    }
    if (h.instancias.length === 0) {
      items.push({
        hito: h,
        instanciaId: null,
        estado: "PENDIENTE",
        semanaDelAnio: null,
        puntosOtorgados: 0,
        comentarioRevisor: null,
        fechaReportado: null,
        fechaValidado: null,
      });
      continue;
    }
    // Para semanales: solo mostrar la instancia de la semana actual.
    // Para mensuales: mostrar todas las ocurrencias.
    const instancias =
      h.frecuencia === "SEMANAL"
        ? h.instancias.filter((i) => i.semanaDelAnio === progreso.periodo.semana)
        : h.instancias;
    for (const i of instancias) {
      items.push({
        hito: h,
        instanciaId: i.id,
        estado: i.estado as HitoView["estado"],
        semanaDelAnio: i.semanaDelAnio,
        puntosOtorgados: i.puntosOtorgados,
        comentarioRevisor: i.comentarioRevisor,
        fechaReportado: i.fechaReportado,
        fechaValidado: i.fechaValidado,
      });
    }
  }
  return items;
}

const PENDIENTES_ESTADOS: HitoView["estado"][] = [
  "PENDIENTE",
  "EN_REVISION",
  "RECHAZADO",
];
const COMPLETADOS_ESTADOS: HitoView["estado"][] = ["APROBADO", "NO_APLICA"];

function badgeFrecuencia(h: HitoConInstancia, semana: number | null) {
  if (h.frecuencia === "SEMANAL") {
    return (
      <Badge variant="outline" className="text-[10px]">
        Semanal{semana ? ` · sem ${semana}` : ""}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px]">
      Mensual
    </Badge>
  );
}

function badgeEstado(estado: HitoView["estado"]) {
  switch (estado) {
    case "PENDIENTE":
      return (
        <Badge variant="outline" className="gap-1">
          <CircleDashed className="h-3 w-3" /> Pendiente
        </Badge>
      );
    case "EN_REVISION":
      return (
        <Badge className="gap-1 bg-warning text-warning-foreground">
          <Clock className="h-3 w-3" /> En revision
        </Badge>
      );
    case "RECHAZADO":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Rechazado
        </Badge>
      );
    case "APROBADO":
      return (
        <Badge className="gap-1 bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3" /> Aprobado
        </Badge>
      );
    case "NO_APLICA":
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <Ban className="h-3 w-3" /> No aplica
        </Badge>
      );
  }
}

function HitoKanbanCard({
  view,
  onReportar,
}: {
  view: HitoView;
  onReportar: () => void;
}) {
  const puntos = view.hito.puntosAjustados ?? view.hito.puntos;
  const puedeReportar =
    view.instanciaId != null &&
    (view.estado === "PENDIENTE" || view.estado === "RECHAZADO");

  return (
    <div className="rounded-lg border bg-card p-3 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-muted-foreground">
              {view.hito.codigo}
            </span>
            {badgeFrecuencia(view.hito, view.semanaDelAnio)}
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug">
            {view.hito.nombre}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">
            {view.estado === "APROBADO" ? `+${view.puntosOtorgados}` : `+${puntos}`}
          </p>
          <p className="text-[10px] text-muted-foreground">pts</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {badgeEstado(view.estado)}
        {puedeReportar && (
          <Button
            size="sm"
            variant={view.estado === "RECHAZADO" ? "default" : "outline"}
            className="h-7 gap-1 text-xs"
            onClick={onReportar}
          >
            <Upload className="h-3 w-3" />
            {view.estado === "RECHAZADO" ? "Reenviar" : "Reportar"}
          </Button>
        )}
      </div>

      {view.estado === "RECHAZADO" && view.comentarioRevisor && (
        <p className="mt-2 rounded bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
          <strong>Jefe:</strong> {view.comentarioRevisor}
        </p>
      )}
      {view.estado === "EN_REVISION" && view.fechaReportado && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Reportado{" "}
          {new Date(view.fechaReportado).toLocaleDateString("es", {
            day: "numeric",
            month: "short",
          })}
        </p>
      )}
      {view.estado === "NO_APLICA" && view.comentarioRevisor && (
        <p className="mt-2 text-[11px] italic text-muted-foreground">
          {view.comentarioRevisor}
        </p>
      )}
    </div>
  );
}

export function HitosKanban({ progreso }: { progreso: ProgresoHitosUsuario }) {
  const [activo, setActivo] = useState<HitoView | null>(null);
  const items = aplanarParaKanban(progreso);

  const pendientes = items.filter((i) =>
    PENDIENTES_ESTADOS.includes(i.estado)
  );
  const completados = items.filter((i) =>
    COMPLETADOS_ESTADOS.includes(i.estado)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
        <div className="flex justify-center rounded-2xl border bg-card p-4">
          <VelocimetroPuntos
            puntos={progreso.puntosAcumulados}
            tope={progreso.puntosTope}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Resumen
            color="text-muted-foreground"
            label="Pendientes"
            valor={progreso.cantidadPorEstado.pendiente}
          />
          <Resumen
            color="text-warning"
            label="En revision"
            valor={progreso.cantidadPorEstado.enRevision}
          />
          <Resumen
            color="text-success"
            label="Aprobados"
            valor={progreso.cantidadPorEstado.aprobado}
          />
          <Resumen
            color="text-destructive"
            label="Rechazados"
            valor={progreso.cantidadPorEstado.rechazado}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Columna
          titulo="Pendientes"
          subtitulo="Te toca reportar o esperan revision del jefe"
          icono={<CircleDashed className="h-4 w-4 text-muted-foreground" />}
          items={pendientes}
          onReportar={(view) => setActivo(view)}
          empty="Nada pendiente. Buena."
        />
        <Columna
          titulo="Completados"
          subtitulo="Aprobados o marcados como no aplica"
          icono={<CheckCircle2 className="h-4 w-4 text-success" />}
          items={completados}
          onReportar={() => {}}
          empty="Aun no hay hitos cerrados este mes."
        />
      </div>

      {activo && activo.instanciaId && (
        <ModalReportarHito
          open={!!activo}
          onOpenChange={(o) => {
            if (!o) setActivo(null);
          }}
          instanciaId={activo.instanciaId}
          codigo={activo.hito.codigo}
          nombre={activo.hito.nombre}
          descripcion={activo.hito.descripcion}
        />
      )}
    </div>
  );
}

function Columna({
  titulo,
  subtitulo,
  icono,
  items,
  onReportar,
  empty,
}: {
  titulo: string;
  subtitulo: string;
  icono: React.ReactNode;
  items: HitoView[];
  onReportar: (view: HitoView) => void;
  empty: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="mb-3 flex items-center gap-2">
        {icono}
        <div>
          <h3 className="text-sm font-semibold">{titulo}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitulo}</p>
        </div>
        <span className="ml-auto text-xs font-mono text-muted-foreground">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((view, idx) => (
            <HitoKanbanCard
              key={`${view.hito.asignacionMesId}-${view.instanciaId ?? idx}`}
              view={view}
              onReportar={() => onReportar(view)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Resumen({
  color,
  label,
  valor,
}: {
  color: string;
  label: string;
  valor: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className={`text-2xl font-semibold tabular-nums leading-none ${color}`}>
        {valor}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
