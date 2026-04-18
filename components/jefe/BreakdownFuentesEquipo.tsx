import { cn } from "@/lib/utils";

type Props = {
  breakdown: {
    kpis: number;
    cursos: number;
    compromisos: number;
    reconocimientos: number;
    misiones: number;
  };
};

const BARRAS = [
  { key: "kpis" as const, label: "KPIs", color: "bg-primary" },
  { key: "cursos" as const, label: "Cursos", color: "bg-blue-500" },
  { key: "compromisos" as const, label: "Compromisos", color: "bg-emerald-500" },
  {
    key: "reconocimientos" as const,
    label: "Reconocimientos",
    color: "bg-rose-500",
  },
  { key: "misiones" as const, label: "Misiones", color: "bg-amber-500" },
];

export function BreakdownFuentesEquipo({ breakdown }: Props) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const mayor = BARRAS.reduce((best, b) =>
    breakdown[b.key] > breakdown[best.key] ? b : best
  , BARRAS[0]);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Fuentes de puntos del equipo</h3>
        <span className="text-xs text-muted-foreground">
          Total: <span className="font-medium text-foreground">{total} pts</span>
        </span>
      </div>
      <div className="space-y-3">
        {BARRAS.map((b) => {
          const valor = breakdown[b.key];
          const pct = total > 0 ? (valor / total) * 100 : 0;
          return (
            <div key={b.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{b.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {valor} pts · {Math.round(pct)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", b.color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <p className="mt-4 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
          El equipo genera la mayor parte del XP en <strong className="text-foreground">{mayor.label}</strong>.
        </p>
      )}
    </div>
  );
}
