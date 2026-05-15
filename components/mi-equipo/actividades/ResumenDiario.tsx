import { Activity, CheckCircle2, ClipboardCheck, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ResumenActividad } from "@/lib/equipo/actividades";

type Props = {
  resumen: ResumenActividad;
  totalMiembros: number;
};

export function ResumenDiario({ resumen, totalMiembros }: Props) {
  const items: Array<{
    label: string;
    value: number;
    icon: React.ReactNode;
    sub?: string;
  }> = [
    {
      label: "Eventos del día",
      value: resumen.totalEventos,
      icon: <Activity className="h-4 w-4 text-primary" />,
    },
    {
      label: "Tareas completadas",
      value: resumen.porTipo.TAREA_COMPLETADA,
      icon: <CheckCircle2 className="h-4 w-4 text-success" />,
    },
    {
      label: "KPIs aprobados",
      value: resumen.porTipo.KPI_APROBADO,
      icon: <ClipboardCheck className="h-4 w-4 text-primary" />,
    },
    {
      label: "Aprendizaje",
      value: resumen.porTipo.LECCION,
      icon: <Sparkles className="h-4 w-4 text-warning" />,
    },
    {
      label: "Miembros activos",
      value: resumen.miembrosActivos,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      sub: `de ${totalMiembros}`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((it) => (
        <Card key={it.label} className="ring-1 ring-border/40">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {it.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {it.value}
                {it.sub && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {it.sub}
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-md bg-muted/60 p-2">{it.icon}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
