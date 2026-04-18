"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cargarPaginaComentarios } from "@/lib/comentarios/public-actions";
import type {
  ComentarioConDetalle,
  OrdenComentarios,
} from "@/types/comentarios";
import { FiltroChip } from "./FiltroChip";
import { FormComentarioCompacto } from "./FormComentarioCompacto";
import { ComentarioItemPanel } from "./ComentarioItemPanel";

export function PanelComentariosCliente({
  leccionId,
  comentariosIniciales,
  cursorInicial,
  total,
  currentUserId,
  esAdmin,
}: {
  leccionId: string;
  comentariosIniciales: ComentarioConDetalle[];
  cursorInicial: string | null;
  total: number;
  currentUserId: string;
  esAdmin: boolean;
}) {
  const [comentarios, setComentarios] = useState(comentariosIniciales);
  const [cursor, setCursor] = useState<string | null>(cursorInicial);
  const [orden, setOrden] = useState<OrdenComentarios>("nuevos");
  const [isPending, startTransition] = useTransition();

  const cambiarOrden = (nuevo: OrdenComentarios) => {
    if (nuevo === orden) return;
    setOrden(nuevo);
    startTransition(async () => {
      const res = await cargarPaginaComentarios({
        leccionId,
        orden: nuevo,
      });
      setComentarios(res.comentarios);
      setCursor(res.siguienteCursor);
    });
  };

  const recargar = () => {
    startTransition(async () => {
      const res = await cargarPaginaComentarios({ leccionId, orden });
      setComentarios(res.comentarios);
      setCursor(res.siguienteCursor);
    });
  };

  const cargarMas = () => {
    if (!cursor) return;
    startTransition(async () => {
      const res = await cargarPaginaComentarios({
        leccionId,
        orden,
        cursor,
      });
      setComentarios((prev) => [...prev, ...res.comentarios]);
      setCursor(res.siguienteCursor);
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 space-y-3 border-b border-border px-3 pb-3">
        {/* TODO: integrar asistente IA real cuando esté disponible */}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Obten respuestas inmediatas
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pregunta sobre esta leccion
            </p>
          </div>
          <Button size="sm" disabled className="flex-shrink-0">
            Preguntar
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-2 text-sm font-semibold">
            Comentarios
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({total})
            </span>
          </span>
          <div className="ml-auto flex gap-1">
            <FiltroChip
              label="Mas votados"
              activo={orden === "mas-votados"}
              onClick={() => cambiarOrden("mas-votados")}
            />
            <FiltroChip
              label="Nuevos"
              activo={orden === "nuevos"}
              onClick={() => cambiarOrden("nuevos")}
            />
            <FiltroChip
              label="Favoritos"
              activo={orden === "favoritos"}
              onClick={() => cambiarOrden("favoritos")}
            />
          </div>
        </div>

        <FormComentarioCompacto leccionId={leccionId} onExito={recargar} />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-3 py-3">
          {comentarios.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {orden === "favoritos"
                  ? "Aun no tienes comentarios favoritos"
                  : "Se el primero en comentar"}
              </p>
            </div>
          ) : (
            comentarios.map((c) => (
              <ComentarioItemPanel
                key={c.id}
                comentario={c}
                respuestas={c.respuestas}
                currentUserId={currentUserId}
                esAdmin={esAdmin}
                onCambio={recargar}
              />
            ))
          )}

          {cursor && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={cargarMas}
                disabled={isPending}
                className="text-xs"
              >
                {isPending ? "Cargando..." : "Cargar mas"}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
