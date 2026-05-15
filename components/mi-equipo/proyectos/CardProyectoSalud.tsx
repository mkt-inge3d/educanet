import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XOctagon,
  Lock,
  PauseCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProyectoConSalud, SaludProyecto } from "@/lib/proyectos/queries-jefe";
import { BarraTiempoVsAvance } from "./BarraTiempoVsAvance";

const SALUD_CONFIG: Record<
  SaludProyecto,
  { label: string; dot: string; bg: string; text: string }
> = {
  VERDE: {
    label: "En curso",
    dot: "bg-success",
    bg: "bg-success/10",
    text: "text-success",
  },
  AMARILLO: {
    label: "En riesgo",
    dot: "bg-warning",
    bg: "bg-warning/10",
    text: "text-warning",
  },
  ROJO: {
    label: "Crítico",
    dot: "bg-destructive",
    bg: "bg-destructive/10",
    text: "text-destructive",
  },
  SIN_DATOS: {
    label: "Sin tareas",
    dot: "bg-muted-foreground",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
};

const CATEGORIA_LABEL: Record<string, string> = {
  WEBINAR: "Webinar",
  CAMPANA_MARKETING: "Campaña",
  LANZAMIENTO_CURSO: "Lanzamiento",
  EVENTO_PRESENCIAL: "Evento",
  GENERICO: "Genérico",
};

type Props = {
  proyecto: ProyectoConSalud;
};

export function CardProyectoSalud({ proyecto: p }: Props) {
  const salud = SALUD_CONFIG[p.salud];
  const totalNoOmitidas = p.total - p.omitidas;
  const fechaFmt = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
  }).format(p.fechaHito);

  const tonoDias =
    p.diasRestantes < 0
      ? "text-destructive"
      : p.diasRestantes <= 3
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="line-clamp-1 text-base font-semibold leading-tight">
              {p.nombre}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                {CATEGORIA_LABEL[p.categoria] ?? p.categoria}
              </Badge>
              {p.contextoMarca && (
                <Badge variant="outline" className="text-[10px]">
                  {p.contextoMarca}
                </Badge>
              )}
              {p.estadoGeneral === "PAUSADO" && (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <PauseCircle className="h-3 w-3" />
                  Pausado
                </Badge>
              )}
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${salud.bg} ${salud.text}`}
            aria-label={`Salud: ${salud.label}`}
          >
            <span className={`h-2 w-2 rounded-full ${salud.dot}`} aria-hidden />
            {salud.label}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
            <span>Avance</span>
            <span className="tabular-nums">
              <span className="font-semibold text-foreground">{p.completadas}</span>
              {" / "}
              {totalNoOmitidas}{" "}
              {totalNoOmitidas === 1 ? "tarea" : "tareas"}
            </span>
          </div>
          <BarraTiempoVsAvance
            porcentajeAvance={p.porcentajeAvance}
            porcentajeTiempo={p.porcentajeTiempo}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <StatLine
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-success" />}
            label="En progreso"
            value={p.enProgreso}
          />
          <StatLine
            icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Pendientes"
            value={p.pendientes}
          />
          <StatLine
            icon={<AlertTriangle className="h-3.5 w-3.5 text-warning" />}
            label="Bloqueadas"
            value={p.bloqueadas}
            highlight={p.bloqueadas > 0 ? "warning" : undefined}
          />
          <StatLine
            icon={<XOctagon className="h-3.5 w-3.5 text-destructive" />}
            label="Vencidas"
            value={p.vencidas}
            highlight={p.vencidas > 0 ? "destructive" : undefined}
          />
        </div>

        {p.cargaPorMiembro.length > 0 && (
          <TooltipProvider>
            <div className="flex items-center justify-between gap-2">
              <AvatarGroup className="-space-x-1.5">
                {p.cargaPorMiembro.slice(0, 5).map((m) => {
                  const iniciales = `${m.nombre[0] ?? ""}${m.apellido[0] ?? ""}`.toUpperCase();
                  const hayProblemas = m.vencidas > 0;
                  return (
                    <Tooltip key={m.userId}>
                      <TooltipTrigger
                        render={
                          <Avatar
                            size="sm"
                            className={
                              hayProblemas ? "ring-2 ring-destructive/50" : undefined
                            }
                          />
                        }
                      >
                        {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
                        <AvatarFallback>{iniciales}</AvatarFallback>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="font-medium">
                          {m.nombre} {m.apellido}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {m.activas} activas · {m.completadas} OK
                          {m.vencidas > 0 ? ` · ${m.vencidas} vencidas` : ""}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {p.cargaPorMiembro.length > 5 && (
                  <AvatarGroupCount className="size-6 text-[10px]">
                    +{p.cargaPorMiembro.length - 5}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
              <span className="text-[11px] text-muted-foreground">
                Resp.{" "}
                <span className="text-foreground">
                  {p.responsable.nombre} {p.responsable.apellido[0]}.
                </span>
              </span>
            </div>
          </TooltipProvider>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className={`flex items-center gap-1.5 text-xs ${tonoDias}`}>
            <Lock className="h-3 w-3" aria-hidden />
            <span>
              {p.diasRestantes < 0
                ? `Vencido hace ${Math.abs(p.diasRestantes)}d`
                : p.diasRestantes === 0
                  ? "Hito hoy"
                  : `${p.diasRestantes}d hasta ${fechaFmt}`}
            </span>
          </div>
          <Link
            href={`/proyectos/${p.id}/gantt`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver tablero
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function StatLine({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: "warning" | "destructive";
}) {
  const tone =
    highlight === "destructive"
      ? "text-destructive"
      : highlight === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-muted-foreground">{label}</span>
      <span className={`ml-auto font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}
