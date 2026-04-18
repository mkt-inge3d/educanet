import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  PlayCircle,
  Sparkles,
  FileText,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeccionConProgreso } from "@/types/cursos";
import { TimelineNodo, type EstadoLeccion } from "./TimelineNodo";

const tipoIcono = {
  VIDEO: PlayCircle,
  LECTURA: FileText,
  QUIZ: HelpCircle,
};

function formatDuracion(segundos: number): string {
  if (segundos === 0) return "";
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function TimelineLeccionItem({
  leccion,
  numero,
  estado,
  cursoSlug,
  thumbnailFallback,
  instructorAvatarUrl,
}: {
  leccion: LeccionConProgreso;
  numero: number;
  estado: EstadoLeccion;
  cursoSlug: string;
  thumbnailFallback: string | null;
  instructorAvatarUrl: string | null;
}) {
  const TipoIcon = tipoIcono[leccion.tipo];
  const duracion = formatDuracion(leccion.duracionSegundos);
  const thumbSrc = thumbnailFallback ?? instructorAvatarUrl;

  return (
    <Link
      href={`/cursos/${cursoSlug}/${leccion.slug}`}
      className="group relative flex items-center gap-4 rounded-lg py-2.5 pr-3 transition-colors hover:bg-muted/50"
    >
      <div className="relative flex-shrink-0">
        <TimelineNodo numero={numero} estado={estado} />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            "relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 transition-transform duration-200 sm:h-14 sm:w-24",
            "group-hover:scale-[1.03]"
          )}
        >
          {thumbSrc && (
            <Image
              src={thumbSrc}
              alt=""
              fill
              sizes="96px"
              className={cn(
                "object-cover transition-opacity duration-200",
                estado === "bloqueado" && "opacity-60"
              )}
            />
          )}
          {estado === "bloqueado" && (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-background/30"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-primary-foreground"
          >
            <TipoIcon
              className={cn(
                "h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
                estado === "bloqueado"
                  ? "text-muted-foreground/80"
                  : "text-white/90"
              )}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium transition-colors",
              estado === "bloqueado"
                ? "text-muted-foreground"
                : "text-foreground group-hover:text-primary"
            )}
          >
            {leccion.titulo}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            {estado === "completado" && (
              <span className="flex items-center gap-1 font-medium text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completado
              </span>
            )}
            {estado === "en-progreso" && (
              <span className="flex items-center gap-1 font-medium text-primary">
                <PlayCircle className="h-3.5 w-3.5" />
                En progreso
                {leccion.porcentajeVisto > 0 && (
                  <span className="text-muted-foreground">
                    {" · "}
                    {leccion.porcentajeVisto}%
                  </span>
                )}
              </span>
            )}
            {estado === "proximo" && (
              <span className="flex items-center gap-1 font-medium text-primary/90">
                <Sparkles className="h-3.5 w-3.5" />
                Siguiente
              </span>
            )}
            {estado === "bloqueado" && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <TipoIcon className="h-3.5 w-3.5" />
                {duracion || "Pendiente"}
              </span>
            )}
            {leccion.tieneQuiz && estado !== "bloqueado" && (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                Quiz
              </span>
            )}
            {duracion && estado !== "bloqueado" && (
              <span className="text-muted-foreground">{duracion}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
