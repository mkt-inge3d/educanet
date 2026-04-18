import type { CursoDetalleCompleto } from "@/types/cursos";
import { calcularEstadosLecciones } from "@/lib/leccion/estado-timeline";
import { TimelineModuloHeader } from "./TimelineModuloHeader";
import { TimelineLeccionItem } from "./TimelineLeccionItem";
import { TimelineLineaProgreso } from "./TimelineLineaProgreso";
import { TimelineItemReveal } from "./TimelineItemReveal";

const CONTAINER_ID = "curso-timeline";

export function TimelineContenido({
  curso,
}: {
  curso: CursoDetalleCompleto;
}) {
  const todasLecciones = curso.modulos.flatMap((m) => m.lecciones);
  const estados = calcularEstadosLecciones(todasLecciones);

  const hayEnProgreso = todasLecciones.some(
    (l) => estados.get(l.id) === "en-progreso"
  );
  const hayCompletado = todasLecciones.some(
    (l) => estados.get(l.id) === "completado"
  );
  const estadoActivo = hayEnProgreso
    ? "en-progreso"
    : hayCompletado
      ? "completado"
      : "ninguno";

  const modulosMeta = (() => {
    const meta: Array<{
      moduloId: string;
      headerRevealIndex: number;
      lecciones: Array<{ leccionId: string; numero: number; revealIndex: number }>;
    }> = [];
    let numeroGlobal = 0;
    let revealIndex = 0;
    for (const modulo of curso.modulos) {
      const headerRevealIndex = revealIndex++;
      const leccionesMeta = modulo.lecciones.map((leccion) => {
        numeroGlobal += 1;
        return {
          leccionId: leccion.id,
          numero: numeroGlobal,
          revealIndex: revealIndex++,
        };
      });
      meta.push({
        moduloId: modulo.id,
        headerRevealIndex,
        lecciones: leccionesMeta,
      });
    }
    return meta;
  })();

  return (
    <div id={CONTAINER_ID} className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-muted-foreground/20 dark:bg-muted-foreground/15"
      />

      <TimelineLineaProgreso
        containerSelector={`#${CONTAINER_ID}`}
        estadoActivo={estadoActivo}
      />

      <div className="relative">
        {curso.modulos.map((modulo, mi) => {
          const meta = modulosMeta[mi];
          return (
            <div key={modulo.id}>
              <TimelineItemReveal index={meta.headerRevealIndex}>
                <TimelineModuloHeader
                  titulo={modulo.titulo}
                  descripcion={modulo.descripcion}
                  indice={mi}
                />
              </TimelineItemReveal>
              <div className="space-y-1">
                {modulo.lecciones.map((leccion, li) => {
                  const lmeta = meta.lecciones[li];
                  return (
                    <TimelineItemReveal
                      key={leccion.id}
                      index={lmeta.revealIndex}
                    >
                      <TimelineLeccionItem
                        leccion={leccion}
                        numero={lmeta.numero}
                        estado={estados.get(leccion.id) ?? "bloqueado"}
                        cursoSlug={curso.slug}
                        thumbnailFallback={curso.thumbnailUrl}
                        instructorAvatarUrl={curso.instructorAvatarUrl}
                      />
                    </TimelineItemReveal>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
