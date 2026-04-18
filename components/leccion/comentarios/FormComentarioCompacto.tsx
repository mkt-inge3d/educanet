"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { crearComentario } from "@/lib/comentarios/actions";

export function FormComentarioCompacto({
  leccionId,
  comentarioPadreId,
  placeholder = "Escribe un comentario o aporte...",
  onExito,
  onCancelar,
}: {
  leccionId: string;
  comentarioPadreId?: string;
  placeholder?: string;
  onExito?: () => void;
  onCancelar?: () => void;
}) {
  const [contenido, setContenido] = useState("");
  const [focused, setFocused] = useState(false);
  const [isPending, startTransition] = useTransition();

  const publicar = () => {
    if (contenido.trim().length < 1) return;
    startTransition(async () => {
      const res = await crearComentario({
        leccionId,
        contenido,
        comentarioPadreId,
      });
      if (res.success) {
        setContenido("");
        setFocused(false);
        onExito?.();
      } else {
        toast.error(res.error);
      }
    });
  };

  const cancelar = () => {
    setContenido("");
    setFocused(false);
    onCancelar?.();
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            publicar();
          }
        }}
        placeholder={placeholder}
        maxLength={2000}
        rows={focused ? 3 : 1}
        className="resize-none text-sm"
      />

      {focused && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {contenido.length}/2000 · Ctrl+Enter
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelar}
              disabled={isPending}
              className="h-7 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={publicar}
              disabled={isPending || contenido.trim().length === 0}
              className="h-7 text-xs"
            >
              {isPending ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
