import Link from "next/link";
import { PlayCircle, FileText, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EstadoLeccion } from "@/lib/leccion/estado-timeline";
import type { TipoLeccion } from "@prisma/client";
import { NodoCompacto } from "./NodoCompacto";

const iconos = {
  VIDEO: PlayCircle,
  LECTURA: FileText,
  QUIZ: HelpCircle,
};

export function LeccionItemSidebar({
  leccion,
  estado,
  esActual,
  cursoSlug,
}: {
  leccion: {
    id: string;
    slug: string;
    titulo: string;
    tipo: TipoLeccion;
  };
  estado: EstadoLeccion;
  esActual: boolean;
  cursoSlug: string;
}) {
  const Icon = iconos[leccion.tipo];

  return (
    <Link
      href={`/cursos/${cursoSlug}/${leccion.slug}`}
      data-leccion-id={leccion.id}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md py-1.5 pl-3 pr-2 transition-colors",
        esActual && "bg-primary/10",
        !esActual && "hover:bg-muted/50"
      )}
    >
      <div className="relative z-10 flex-shrink-0">
        <NodoCompacto estado={estado} esActual={esActual} />
      </div>

      <Icon
        className={cn(
          "h-3.5 w-3.5 flex-shrink-0 transition-colors",
          esActual ? "text-primary" : "text-muted-foreground"
        )}
      />

      <span
        className={cn(
          "flex-1 truncate text-sm transition-colors",
          esActual && "font-semibold text-primary",
          !esActual && estado === "completado" && "text-foreground",
          !esActual &&
            estado !== "completado" &&
            estado !== "bloqueado" &&
            "text-muted-foreground group-hover:text-foreground",
          estado === "bloqueado" && !esActual && "text-muted-foreground/70"
        )}
      >
        {leccion.titulo}
      </span>
    </Link>
  );
}
