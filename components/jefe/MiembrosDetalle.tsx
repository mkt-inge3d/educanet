import { Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TipoRango } from "@prisma/client";

const RANGO_BADGE: Record<TipoRango, string> = {
  BRONCE: "bg-amber-700/20 text-amber-900 dark:text-amber-200",
  PLATA: "bg-slate-400/20 text-slate-800 dark:text-slate-200",
  ORO: "bg-amber-400/20 text-amber-900 dark:text-amber-100",
  DIAMANTE: "bg-cyan-400/20 text-cyan-900 dark:text-cyan-100",
};

type Miembro = {
  userId: string;
  nombre: string;
  avatarUrl: string | null;
  puesto: string | null;
  puntosTotales: number;
  rango: TipoRango;
  cumplimientoKpis: number;
};

export function MiembrosDetalle({
  miembros,
}: {
  miembros: Miembro[] | null;
}) {
  if (miembros === null) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 font-medium">Vista individual bloqueada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Disponible cuando termine la fase anonimizada
        </p>
      </div>
    );
  }

  if (miembros.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Aun no hay datos individuales este mes.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <h3 className="text-base font-semibold">Miembros del equipo</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Vista individual disponible porque el periodo anonimizado termino.
        </p>
      </div>
      <div className="divide-y">
        {miembros.map((m) => (
          <div key={m.userId} className="flex items-center gap-3 p-4">
            <Avatar className="h-9 w-9">
              {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
              <AvatarFallback className="text-xs">
                {m.nombre
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.nombre}</p>
              {m.puesto && (
                <p className="truncate text-xs text-muted-foreground">
                  {m.puesto}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">
                {m.puntosTotales} pts
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                KPIs {Math.round(m.cumplimientoKpis)}%
              </p>
            </div>
            <Badge className={cn("ml-2", RANGO_BADGE[m.rango])}>
              {m.rango}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
