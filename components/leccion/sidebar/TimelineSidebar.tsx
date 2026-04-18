import { calcularEstadosLecciones } from "@/lib/leccion/estado-timeline";
import type { ModuloConLeccionesYProgreso } from "@/types/lecciones";
import { ModuloHeaderSidebar } from "./ModuloHeaderSidebar";
import { LeccionItemSidebar } from "./LeccionItemSidebar";
import { TimelineLineaProgresoSidebar } from "./TimelineLineaProgresoSidebar";

const CONTAINER_ID = "sidebar-timeline";

export function TimelineSidebar({
  estructura,
  cursoSlug,
  leccionActualSlug,
}: {
  estructura: ModuloConLeccionesYProgreso[];
  cursoSlug: string;
  leccionActualSlug: string;
}) {
  const todas = estructura.flatMap((m) => m.lecciones);
  const estados = calcularEstadosLecciones(todas);
  const hayActivo = todas.some(
    (l) => estados.get(l.id) === "completado" || estados.get(l.id) === "en-progreso"
  );

  return (
    <div id={CONTAINER_ID} className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[21px] top-0 bottom-0 w-[1.5px] -translate-x-1/2 bg-border"
      />

      <TimelineLineaProgresoSidebar
        containerSelector={`#${CONTAINER_ID}`}
        hayActivo={hayActivo}
      />

      <div className="relative">
        {estructura.map((modulo, mi) => (
          <div key={modulo.id}>
            <ModuloHeaderSidebar titulo={modulo.titulo} indice={mi} />
            <div>
              {modulo.lecciones.map((lec) => (
                <LeccionItemSidebar
                  key={lec.id}
                  leccion={lec}
                  estado={estados.get(lec.id) ?? "bloqueado"}
                  esActual={lec.slug === leccionActualSlug}
                  cursoSlug={cursoSlug}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
