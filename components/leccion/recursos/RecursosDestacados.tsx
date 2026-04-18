import Link from "next/link";
import { FileText, Link2, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TipoRecurso } from "@prisma/client";

type RecursoDestacado = {
  id: string;
  nombre: string;
  url: string;
  tipo: TipoRecurso;
};

const iconos: Record<TipoRecurso, typeof FileText> = {
  PDF: FileText,
  ENLACE: Link2,
  DESCARGA: Download,
};

const etiquetas: Record<TipoRecurso, string> = {
  PDF: "PDF",
  ENLACE: "Enlace externo",
  DESCARGA: "Descarga",
};

export function RecursosDestacados({
  recursos,
}: {
  recursos: RecursoDestacado[];
}) {
  if (recursos.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Lecturas recomendadas</h2>
        <p className="text-sm text-muted-foreground">
          Recursos complementarios para profundizar.
        </p>
      </div>

      <div className="space-y-2">
        {recursos.map((r) => {
          const Icon = iconos[r.tipo];
          const esExterno = r.tipo === "ENLACE";
          return (
            <Link
              key={r.id}
              href={r.url}
              target={esExterno ? "_blank" : undefined}
              rel={esExterno ? "noopener noreferrer" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg border border-border bg-card p-4",
                "transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted transition-colors",
                  "group-hover:bg-primary/10 group-hover:text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  {r.nombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  {etiquetas[r.tipo]}
                </p>
              </div>

              <div className="flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
                {esExterno ? (
                  <ExternalLink className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
