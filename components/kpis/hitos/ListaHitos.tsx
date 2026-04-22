import { HitoCard } from "./HitoCard";
import type { HitoConInstancia } from "@/lib/kpis/hitos-queries";

type Props = {
  titulo: string;
  subtitulo: string;
  hitos: HitoConInstancia[];
  semanaActual: number;
};

export function ListaHitos({ titulo, subtitulo, hitos, semanaActual }: Props) {
  if (hitos.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold tracking-tight">{titulo}</h2>
        <p className="text-xs text-muted-foreground">{subtitulo}</p>
        <div className="mt-3 rounded-xl border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground">Sin hitos de este tipo este mes.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold tracking-tight">{titulo}</h2>
      <p className="text-xs text-muted-foreground">{subtitulo}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hitos.map((h) => (
          <HitoCard key={h.asignacionMesId} hito={h} semanaActual={semanaActual} />
        ))}
      </div>
    </section>
  );
}
