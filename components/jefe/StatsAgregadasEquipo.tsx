import { Users, Target, Sparkles, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TipoRango } from "@prisma/client";

export function StatsAgregadasEquipo({
  totalMiembros,
  promedioPuntos,
  promedioCumplimientoKpis,
  distribucionRangos,
}: {
  totalMiembros: number;
  promedioPuntos: number;
  promedioCumplimientoKpis: number;
  distribucionRangos: Record<TipoRango, number>;
}) {
  const rangoMasComun: TipoRango =
    (Object.entries(distribucionRangos) as [TipoRango, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "BRONCE";

  const cards = [
    {
      icono: Users,
      label: "Miembros del equipo",
      valor: totalMiembros.toString(),
      sub: "activos en el piloto",
    },
    {
      icono: Target,
      label: "Cumplimiento KPIs",
      valor: `${Math.round(promedioCumplimientoKpis)}%`,
      sub: "promedio del mes",
    },
    {
      icono: Sparkles,
      label: "Puntos promedio",
      valor: Math.round(promedioPuntos).toString(),
      sub: "por miembro del equipo",
    },
    {
      icono: Trophy,
      label: "Rango mas comun",
      valor: rangoMasComun,
      sub: "del mes actual",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icono;
        return (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              {c.label}
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{c.valor}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.sub}</p>
          </Card>
        );
      })}
    </div>
  );
}
