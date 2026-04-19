"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marcarLeccionCompletada } from "@/lib/cursos/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { LeccionAdyacente } from "@/types/lecciones";
import type { TipoLeccion } from "@prisma/client";

export function LeccionNavegacion({
  cursoSlug,
  anterior,
  siguiente,
  completada,
  tipo,
  leccionId,
}: {
  cursoSlug: string;
  anterior: LeccionAdyacente | null;
  siguiente: LeccionAdyacente | null;
  completada: boolean;
  tipo: TipoLeccion;
  leccionId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const showMarcar = !completada && tipo === "LECTURA";

  const handleMarcar = () => {
    startTransition(async () => {
      try {
        const res = await marcarLeccionCompletada(leccionId);
        if ("error" in res) {
          toast.error("Error al marcar leccion");
          return;
        }
        toast.success(`Leccion completada! +${res.puntosGanados} puntos`);
        router.refresh();
      } catch {
        toast.error("Error de conexion");
      }
    });
  };

  return (
    <div className="sticky bottom-0 border-t bg-card px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        {anterior ? (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/cursos/${cursoSlug}/${anterior.slug}`} prefetch />}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
        ) : (
          <div />
        )}

        {showMarcar && (
          <Button
            size="sm"
            onClick={handleMarcar}
            disabled={isPending}
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Marcar completada
          </Button>
        )}

        {siguiente ? (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/cursos/${cursoSlug}/${siguiente.slug}`} prefetch />}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/cursos/${cursoSlug}`} />}
          >
            Volver al curso
          </Button>
        )}
      </div>
    </div>
  );
}
