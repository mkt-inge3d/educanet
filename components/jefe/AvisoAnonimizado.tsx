import { Lock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function AvisoAnonimizado({
  fechaFin,
}: {
  fechaFin: Date | null;
}) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold">
            Vista anonimizada · Primer mes del piloto
          </h4>
          <p className="text-muted-foreground">
            Durante el primer mes estas viendo <strong>tendencias del equipo</strong>,
            no individuales. Esto protege al equipo de sentirse observado
            mientras se adapta al sistema.
          </p>
          {fechaFin && (
            <p className="text-muted-foreground">
              A partir del{" "}
              <strong>{format(fechaFin, "d 'de' MMMM", { locale: es })}</strong>{" "}
              podras ver el detalle individual.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Para validar compromisos pendientes sigues viendo los nombres
            como siempre.
          </p>
        </div>
      </div>
    </div>
  );
}
