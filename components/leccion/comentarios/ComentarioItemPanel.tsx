"use client";

import { useState } from "react";
import { Reply, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ComentarioConDetalle,
  ComentarioRespuesta,
} from "@/types/comentarios";
import { BotonLike } from "./BotonLike";
import { ComentarioMenu } from "./ComentarioMenu";
import { FormComentarioCompacto } from "./FormComentarioCompacto";

export function ComentarioItemPanel({
  comentario,
  currentUserId,
  esAdmin,
  respuestas = [],
  esRespuesta = false,
  onCambio,
}: {
  comentario: ComentarioConDetalle | ComentarioRespuesta;
  currentUserId: string;
  esAdmin: boolean;
  respuestas?: ComentarioRespuesta[];
  esRespuesta?: boolean;
  onCambio?: () => void;
}) {
  const [respondiendo, setRespondiendo] = useState(false);
  const [expandidas, setExpandidas] = useState(false);

  const { user } = comentario;
  const iniciales = `${user.nombre[0] ?? ""}${user.apellido[0] ?? ""}`.toUpperCase();
  const esPropio = comentario.userId === currentUserId;
  const fecha = formatDistanceToNow(new Date(comentario.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="flex gap-2.5">
      <Avatar
        className={cn(
          "flex-shrink-0",
          esRespuesta ? "h-7 w-7" : "h-8 w-8"
        )}
      >
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
          {iniciales}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="font-semibold text-foreground cursor-default">
                    {user.nombre} {user.apellido}
                  </span>
                }
              />
              {user.puesto && (
                <TooltipContent side="top">{user.puesto.nombre}</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <span className="text-muted-foreground">·</span>
          <time className="text-muted-foreground">{fecha}</time>
          {comentario.editado && (
            <span className="italic text-muted-foreground">(editado)</span>
          )}
          <div className="ml-auto">
            <ComentarioMenu
              id={comentario.id}
              contenido={comentario.contenido}
              esPropio={esPropio}
              esAdmin={esAdmin}
            />
          </div>
        </div>

        <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground break-words">
          {comentario.contenido}
        </p>

        <div className="mt-1.5 flex items-center gap-3 text-xs">
          <BotonLike
            comentarioId={comentario.id}
            totalLikes={comentario.totalLikes}
            conLike={comentario.usuarioDioLike}
            deshabilitado={esPropio}
            razonDeshabilitado={
              esPropio ? "No puedes dar like a tu propio comentario" : undefined
            }
          />

          {!esRespuesta && (
            <button
              type="button"
              onClick={() => setRespondiendo((s) => !s)}
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Reply className="h-3 w-3" />
              Responder
            </button>
          )}

          {!esRespuesta &&
            "totalRespuestas" in comentario &&
            comentario.totalRespuestas > 0 && (
              <button
                type="button"
                onClick={() => setExpandidas((s) => !s)}
                className="flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    expandidas && "rotate-180"
                  )}
                />
                {expandidas
                  ? "Ocultar"
                  : `Ver ${comentario.totalRespuestas}`}
              </button>
            )}
        </div>

        {respondiendo && !esRespuesta && (
          <div className="mt-2">
            <FormComentarioCompacto
              leccionId={comentario.leccionId}
              comentarioPadreId={comentario.id}
              placeholder="Tu respuesta..."
              onExito={() => {
                setRespondiendo(false);
                onCambio?.();
              }}
              onCancelar={() => setRespondiendo(false)}
            />
          </div>
        )}

        {!esRespuesta && expandidas && respuestas.length > 0 && (
          <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
            {respuestas.map((r) => (
              <ComentarioItemPanel
                key={r.id}
                comentario={r}
                currentUserId={currentUserId}
                esAdmin={esAdmin}
                esRespuesta
                onCambio={onCambio}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
