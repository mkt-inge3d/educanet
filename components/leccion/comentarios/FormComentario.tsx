"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { crearComentario } from "@/lib/comentarios/actions";

export function FormComentario({
  leccionId,
  user,
  comentarioPadreId,
  placeholder = "Escribe tu comentario o aporte...",
  compacto = false,
  onExito,
  onCancelar,
}: {
  leccionId: string;
  user: {
    nombre: string;
    apellido: string;
    avatarUrl: string | null;
  };
  comentarioPadreId?: string;
  placeholder?: string;
  compacto?: boolean;
  onExito?: () => void;
  onCancelar?: () => void;
}) {
  const [contenido, setContenido] = useState("");
  const [focused, setFocused] = useState(compacto);
  const [isPending, startTransition] = useTransition();

  const iniciales = `${user.nombre[0] ?? ""}${user.apellido[0] ?? ""}`.toUpperCase();

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
        setFocused(compacto);
        onExito?.();
      } else {
        toast.error(res.error);
      }
    });
  };

  const cancelar = () => {
    setContenido("");
    setFocused(compacto);
    onCancelar?.();
  };

  return (
    <div className="flex gap-3">
      <Avatar className={compacto ? "h-8 w-8" : "h-10 w-10"}>
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {iniciales}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
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
          rows={focused ? (compacto ? 2 : 3) : 1}
          className="resize-none"
        />

        {focused && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {contenido.length}/2000
              <span className="ml-2 hidden md:inline">
                Ctrl+Enter para publicar
              </span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelar}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={publicar}
                disabled={isPending || contenido.trim().length === 0}
              >
                {isPending ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
