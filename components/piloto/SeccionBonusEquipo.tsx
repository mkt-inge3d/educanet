import { Users2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { obtenerProgresoBonusEquipo } from "@/lib/piloto/bonus-equipo";

export async function SeccionBonusEquipo({
  areaId,
  mes,
  anio,
}: {
  areaId: string;
  mes: number;
  anio: number;
}) {
  const info = await obtenerProgresoBonusEquipo(areaId, mes, anio);
  if (!info) return null;

  const pct = Math.min(100, (info.promedio / info.meta) * 100);

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Users2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">
              Bonus de equipo del mes
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Si todo el equipo alcanza{" "}
              <strong>{info.meta}%</strong> promedio en KPIs, todos ganan{" "}
              <strong>+{info.bonusPuntos} pts</strong>.
            </p>
          </div>
        </div>
        {info.yaOtorgado && (
          <span className="flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            Ya otorgado
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Cumplimiento del equipo
          </span>
          <span className="font-semibold tabular-nums">
            {info.promedio.toFixed(0)}% / {info.meta}%
          </span>
        </div>
        <Progress value={pct} className="h-2" />

        {info.alcanzado ? (
          <p className="flex items-center gap-1 pt-1 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Meta alcanzada · El bonus se otorga al cierre del mes
          </p>
        ) : (
          <p className="pt-1 text-xs text-muted-foreground">
            Faltan {(info.meta - info.promedio).toFixed(0)} puntos porcentuales.
            El equipo puede lograrlo apoyandose.
          </p>
        )}
      </div>
    </section>
  );
}
