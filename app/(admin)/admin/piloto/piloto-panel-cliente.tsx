"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Beaker, Users, Sparkles, FileDown, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  actualizarConfiguracionPiloto,
  evaluarBonusManual,
} from "@/lib/piloto/actions";
import type { TipoRango } from "@prisma/client";

type Config = {
  id: string;
  areaId: string;
  areaNombre: string;
  activo: boolean;
  fechaInicio: string;
  fechaFin: string;
  mostrarBannerPiloto: boolean;
  fechaFinBanner: string | null;
  anonimizarParaJefe: boolean;
  fechaFinAnonimizacion: string | null;
  metaCumplimientoKpis: number;
  bonusEquipoPuntos: number;
  bonusYaOtorgadoMes: number | null;
  bonusYaOtorgadoAnio: number | null;
  notas: string;
};

type Props = {
  config: Config;
  dashboard: {
    totalMiembros: number;
    promedioPuntos: number;
    promedioCumplimientoKpis: number;
    distribucionRangos: Record<TipoRango, number>;
  } | null;
  adopcion: {
    pctReporteKpi: number;
    pctReconocimiento: number;
    pctCompromiso: number;
    pctMisionCompletada: number;
    miembros: number;
  };
  bonus: {
    promedio: number;
    meta: number;
    bonusPuntos: number;
    yaOtorgado: boolean;
    alcanzado: boolean;
    miembros: number;
  } | null;
  encuestas: {
    totalRespuestas: number;
    miembrosActivos: number;
    tasaRespuesta: number;
    promedios: {
      justiciaKpis: number;
      motivacionSistema: number;
      claridadProgreso: number;
    };
    porSemana: Array<{
      semana: number;
      total: number;
      justiciaKpis: number;
      motivacionSistema: number;
      claridadProgreso: number;
    }>;
    comentarios: Array<{ texto: string; semana: number }>;
    kpisMasJustos: Array<{ nombre: string; cuenta: number }>;
    kpisMenosJustos: Array<{ nombre: string; cuenta: number }>;
  };
  mes: number;
  anio: number;
};

function toLocalDateInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function recomendacion(props: Props) {
  const { adopcion, encuestas, dashboard } = props;
  const adopcionPromedio =
    (adopcion.pctReporteKpi +
      adopcion.pctReconocimiento +
      adopcion.pctCompromiso +
      adopcion.pctMisionCompletada) /
    4;
  const motivacion = encuestas.promedios.motivacionSistema;
  const justicia = encuestas.promedios.justiciaKpis;
  const cumpl = dashboard?.promedioCumplimientoKpis ?? 0;

  if (adopcionPromedio < 30 || motivacion < 2.5) {
    return {
      nivel: "negativo" as const,
      titulo: "Reconsiderar el sistema",
      razones: [
        adopcionPromedio < 30 ? `Adopcion promedio ${adopcionPromedio.toFixed(0)}% (<30%)` : null,
        motivacion < 2.5 ? `Motivacion percibida ${motivacion.toFixed(1)}/5` : null,
      ].filter(Boolean) as string[],
    };
  }

  if (adopcionPromedio < 50 || justicia < 3 || cumpl < 60) {
    return {
      nivel: "iterar" as const,
      titulo: "Iterar antes de escalar",
      razones: [
        adopcionPromedio < 50 ? `Adopcion promedio ${adopcionPromedio.toFixed(0)}%` : null,
        justicia < 3 ? `Justicia percibida ${justicia.toFixed(1)}/5` : null,
        cumpl < 60 ? `Cumplimiento KPIs ${cumpl.toFixed(0)}%` : null,
      ].filter(Boolean) as string[],
    };
  }

  return {
    nivel: "positivo" as const,
    titulo: "Escalable a otros equipos",
    razones: [
      `Adopcion ${adopcionPromedio.toFixed(0)}%`,
      `Justicia ${justicia.toFixed(1)}/5`,
      `Motivacion ${motivacion.toFixed(1)}/5`,
      `Cumplimiento ${cumpl.toFixed(0)}%`,
    ],
  };
}

export function PilotoPanelCliente(props: Props) {
  const { config } = props;
  const [editable, setEditable] = useState(config);
  const [isPending, startTransition] = useTransition();
  const [bonusResult, setBonusResult] = useState<string | null>(null);

  const guardar = () => {
    startTransition(async () => {
      const res = await actualizarConfiguracionPiloto({
        areaId: config.areaId,
        activo: editable.activo,
        fechaInicio: editable.fechaInicio,
        fechaFin: editable.fechaFin,
        mostrarBannerPiloto: editable.mostrarBannerPiloto,
        fechaFinBanner: editable.fechaFinBanner,
        anonimizarParaJefe: editable.anonimizarParaJefe,
        fechaFinAnonimizacion: editable.fechaFinAnonimizacion,
        metaCumplimientoKpis: editable.metaCumplimientoKpis,
        bonusEquipoPuntos: editable.bonusEquipoPuntos,
        notas: editable.notas,
      });
      if (res.success) toast.success("Configuracion guardada");
      else toast.error(res.error);
    });
  };

  const evaluar = (deMesAnterior: boolean) => {
    const mes = deMesAnterior ? (props.mes === 1 ? 12 : props.mes - 1) : props.mes;
    const anio = deMesAnterior && props.mes === 1 ? props.anio - 1 : props.anio;
    startTransition(async () => {
      const res = await evaluarBonusManual({
        areaId: config.areaId,
        mes,
        anio,
      });
      if (res.success && res.data) {
        if (res.data.otorgado) {
          toast.success(
            `Bonus otorgado a ${res.data.miembrosBeneficiados} miembros`
          );
          setBonusResult(
            `Otorgado (+${res.data.puntos} pts x ${res.data.miembrosBeneficiados})`
          );
        } else {
          toast.info(res.data.razon ?? "No se otorgo");
          setBonusResult(res.data.razon ?? "No se otorgo");
        }
      } else if (!res.success) {
        toast.error(res.error);
      }
    });
  };

  const exportCsv = () => {
    const rows = [
      ["Metrica", "Valor"],
      ["Miembros", String(props.dashboard?.totalMiembros ?? 0)],
      [
        "Cumplimiento KPIs promedio %",
        (props.dashboard?.promedioCumplimientoKpis ?? 0).toFixed(1),
      ],
      [
        "Puntos promedio",
        (props.dashboard?.promedioPuntos ?? 0).toFixed(0),
      ],
      ["Adopcion: reporte KPI", `${props.adopcion.pctReporteKpi}%`],
      ["Adopcion: reconocimiento", `${props.adopcion.pctReconocimiento}%`],
      ["Adopcion: compromiso", `${props.adopcion.pctCompromiso}%`],
      ["Adopcion: mision", `${props.adopcion.pctMisionCompletada}%`],
      ["Encuestas respuestas", String(props.encuestas.totalRespuestas)],
      [
        "Justicia KPIs /5",
        props.encuestas.promedios.justiciaKpis.toFixed(2),
      ],
      [
        "Motivacion /5",
        props.encuestas.promedios.motivacionSistema.toFixed(2),
      ],
      [
        "Claridad /5",
        props.encuestas.promedios.claridadProgreso.toFixed(2),
      ],
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `piloto-${config.areaNombre}-${props.mes}-${props.anio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rec = recomendacion(props);
  const colorRec =
    rec.nivel === "positivo"
      ? "border-primary/40 bg-primary/5"
      : rec.nivel === "iterar"
        ? "border-amber-300/40 bg-amber-50 dark:bg-amber-950/20"
        : "border-destructive/40 bg-destructive/5";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Beaker className="h-5 w-5 text-primary" />
            Piloto · {config.areaNombre}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(config.fechaInicio), "d MMM", { locale: es })} —{" "}
            {format(new Date(config.fechaFin), "d MMM yyyy", { locale: es })} ·
            {config.activo ? " Activo" : " Inactivo"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <FileDown className="mr-1 h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      {/* Recomendacion */}
      <Card className={`border ${colorRec} p-5`}>
        <h3 className="text-base font-semibold">{rec.titulo}</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {rec.razones.map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
      </Card>

      {/* Stats del equipo */}
      {props.dashboard && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Miembros
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {props.dashboard.totalMiembros}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Cumplimiento KPIs</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {Math.round(props.dashboard.promedioCumplimientoKpis)}%
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Puntos promedio</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {Math.round(props.dashboard.promedioPuntos)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Encuestas</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {props.encuestas.totalRespuestas}/{props.encuestas.miembrosActivos}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(props.encuestas.tasaRespuesta)}% tasa
            </p>
          </Card>
        </div>
      )}

      {/* Adopcion */}
      <Card className="p-5">
        <h3 className="text-base font-semibold">Adopcion</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Reportaron KPIs", props.adopcion.pctReporteKpi],
            ["Dieron reconocimiento", props.adopcion.pctReconocimiento],
            ["Crearon compromiso", props.adopcion.pctCompromiso],
            ["Completaron mision", props.adopcion.pctMisionCompletada],
          ].map(([label, pct]) => (
            <div key={label as string}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label as string}</span>
                <span className="font-medium">{pct as number}%</span>
              </div>
              <Progress value={pct as number} className="h-1.5" />
            </div>
          ))}
        </div>
      </Card>

      {/* Encuestas */}
      <Card className="p-5">
        <h3 className="text-base font-semibold">Percepcion del equipo</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Siempre anonimizado, nunca se muestra el autor del comentario.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Justicia KPIs", props.encuestas.promedios.justiciaKpis],
            ["Motivacion", props.encuestas.promedios.motivacionSistema],
            ["Claridad progreso", props.encuestas.promedios.claridadProgreso],
          ].map(([label, val]) => (
            <div key={label as string} className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{label as string}</p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {(val as number).toFixed(1)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  /5
                </span>
              </p>
            </div>
          ))}
        </div>

        {(props.encuestas.kpisMasJustos.length > 0 ||
          props.encuestas.kpisMenosJustos.length > 0) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                KPIs mas justos
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {props.encuestas.kpisMasJustos.map((k) => (
                  <Badge key={k.nombre} variant="outline">
                    {k.nombre} · {k.cuenta}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                KPIs menos justos
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {props.encuestas.kpisMenosJustos.map((k) => (
                  <Badge key={k.nombre} variant="outline">
                    {k.nombre} · {k.cuenta}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {props.encuestas.comentarios.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Comentarios (anonimos)
            </p>
            <div className="mt-2 space-y-2">
              {props.encuestas.comentarios.map((c, i) => (
                <div
                  key={i}
                  className="rounded-md border bg-muted/20 p-3 text-sm"
                >
                  <p className="whitespace-pre-wrap">{c.texto}</p>
                  <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                    Semana {c.semana}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Bonus de equipo */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Bonus de equipo
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Si el equipo alcanza {config.metaCumplimientoKpis}% promedio, cada
              miembro recibe +{config.bonusEquipoPuntos} pts en la fuente EQUIPO.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={() => evaluar(false)}
              disabled={isPending}
            >
              <PlayCircle className="mr-1 h-3.5 w-3.5" />
              Evaluar mes actual
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => evaluar(true)}
              disabled={isPending}
            >
              Evaluar mes anterior
            </Button>
          </div>
        </div>
        {props.bonus && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Promedio del equipo</span>
              <span className="font-medium">
                {props.bonus.promedio.toFixed(1)}% / {props.bonus.meta}%
              </span>
            </div>
            <Progress
              value={Math.min(100, (props.bonus.promedio / props.bonus.meta) * 100)}
            />
            {props.bonus.yaOtorgado && (
              <p className="text-sm text-primary">
                Ya otorgado este mes ({props.bonus.miembros} miembros)
              </p>
            )}
          </div>
        )}
        {bonusResult && (
          <p className="mt-3 rounded-md border bg-muted/30 p-2 text-xs">
            Resultado: {bonusResult}
          </p>
        )}
      </Card>

      {/* Configuracion */}
      <Card className="p-5">
        <h3 className="text-base font-semibold">Configuracion del piloto</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Fecha inicio</Label>
            <Input
              type="date"
              value={toLocalDateInput(editable.fechaInicio)}
              onChange={(e) =>
                setEditable({
                  ...editable,
                  fechaInicio: new Date(e.target.value).toISOString(),
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Fecha fin</Label>
            <Input
              type="date"
              value={toLocalDateInput(editable.fechaFin)}
              onChange={(e) =>
                setEditable({
                  ...editable,
                  fechaFin: new Date(e.target.value).toISOString(),
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Fin banner piloto</Label>
            <Input
              type="date"
              value={toLocalDateInput(editable.fechaFinBanner)}
              onChange={(e) =>
                setEditable({
                  ...editable,
                  fechaFinBanner: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Fin anonimizacion jefe</Label>
            <Input
              type="date"
              value={toLocalDateInput(editable.fechaFinAnonimizacion)}
              onChange={(e) =>
                setEditable({
                  ...editable,
                  fechaFinAnonimizacion: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Meta % cumplimiento KPIs</Label>
            <Input
              type="number"
              value={editable.metaCumplimientoKpis}
              onChange={(e) =>
                setEditable({
                  ...editable,
                  metaCumplimientoKpis: Number(e.target.value),
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Bonus equipo (pts)</Label>
            <Input
              type="number"
              value={editable.bonusEquipoPuntos}
              onChange={(e) =>
                setEditable({
                  ...editable,
                  bonusEquipoPuntos: Number(e.target.value),
                })
              }
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editable.activo}
              onChange={(e) =>
                setEditable({ ...editable, activo: e.target.checked })
              }
            />
            Piloto activo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editable.mostrarBannerPiloto}
              onChange={(e) =>
                setEditable({
                  ...editable,
                  mostrarBannerPiloto: e.target.checked,
                })
              }
            />
            Mostrar banner
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editable.anonimizarParaJefe}
              onChange={(e) =>
                setEditable({
                  ...editable,
                  anonimizarParaJefe: e.target.checked,
                })
              }
            />
            Anonimizar vista del jefe
          </label>
        </div>

        <div className="mt-4">
          <Label className="text-xs">Notas</Label>
          <Textarea
            value={editable.notas}
            onChange={(e) =>
              setEditable({ ...editable, notas: e.target.value })
            }
            rows={2}
            className="mt-1"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={guardar} disabled={isPending}>
            Guardar cambios
          </Button>
        </div>
      </Card>
    </div>
  );
}
