type Props = {
  porcentajeAvance: number;
  porcentajeTiempo: number;
};

export function BarraTiempoVsAvance({ porcentajeAvance, porcentajeTiempo }: Props) {
  const gap = porcentajeTiempo - porcentajeAvance;
  const tono =
    gap > 20
      ? "bg-destructive"
      : gap > 10
        ? "bg-warning"
        : "bg-success";

  return (
    <div className="space-y-1.5" aria-label="Avance real versus tiempo transcurrido">
      <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`absolute inset-y-0 left-0 ${tono} transition-[width] duration-500`}
          style={{ width: `${porcentajeAvance}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-foreground/50"
          style={{ left: `${porcentajeTiempo}%` }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>
          Avance <span className="font-medium text-foreground">{porcentajeAvance}%</span>
        </span>
        <span>
          Tiempo <span className="font-medium text-foreground">{porcentajeTiempo}%</span>
        </span>
      </div>
    </div>
  );
}
