import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ModuloConLeccionesYProgreso } from "@/types/lecciones";
import { TimelineSidebar } from "./sidebar/TimelineSidebar";
import { ScrollALeccionActual } from "./sidebar/ScrollALeccionActual";

export function LeccionSidebarIzq({
  estructura,
  cursoSlug,
  cursoTitulo,
  leccionActualSlug,
  leccionActualId,
  totalLecciones,
  completadas,
}: {
  estructura: ModuloConLeccionesYProgreso[];
  cursoSlug: string;
  cursoTitulo: string;
  leccionActualSlug: string;
  leccionActualId: string;
  totalLecciones: number;
  completadas: number;
}) {
  const porcentaje =
    totalLecciones > 0 ? Math.round((completadas / totalLecciones) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Link
          href={`/cursos/${cursoSlug}`}
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al curso
        </Link>
        <h2 className="line-clamp-2 text-sm font-semibold">{cursoTitulo}</h2>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completadas} / {totalLecciones} lecciones
            </span>
            <span className="font-medium text-foreground">{porcentaje}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-3 pr-2">
          <TimelineSidebar
            estructura={estructura}
            cursoSlug={cursoSlug}
            leccionActualSlug={leccionActualSlug}
          />
        </div>
      </ScrollArea>

      <ScrollALeccionActual leccionId={leccionActualId} />
    </div>
  );
}
