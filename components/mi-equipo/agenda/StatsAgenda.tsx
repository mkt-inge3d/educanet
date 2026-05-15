import { CalendarDays, Users, AlertTriangle, UserMinus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ResumenAgenda } from "@/lib/equipo/agenda-utils";

type Props = {
  resumen: ResumenAgenda;
};

export function StatsAgenda({ resumen }: Props) {
  const items = [
    {
      label: "Tareas planificadas",
      value: resumen.totalTareas,
      icon: <CalendarDays className="h-4 w-4 text-primary" />,
    },
    {
      label: "Miembros con carga",
      value: resumen.miembrosActivos,
      sub: `de ${resumen.totalMiembros}`,
      icon: <Users className="h-4 w-4 text-success" />,
    },
    {
      label: "Sobrecargados",
      value: resumen.miembrosSobrecargados,
      icon: <AlertTriangle className="h-4 w-4 text-warning" />,
    },
    {
      label: "Sin asignación",
      value: resumen.miembrosSinTareas,
      icon: <UserMinus className="h-4 w-4 text-muted-foreground" />,
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
