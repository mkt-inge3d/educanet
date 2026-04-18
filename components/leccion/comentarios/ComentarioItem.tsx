"use client";

import { useState } from "react";
import { Reply, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type {
  ComentarioConDetalle,
  ComentarioRespuesta,
} from "@/types/comentarios";
import { BotonLike } from "./BotonLike";
import { ComentarioMenu } from "./ComentarioMenu";
import { FormComentario } from "./FormComentario";

type Props = {
  comentario: ComentarioConDetalle | ComentarioRespuesta;
  currentUserId: string;
  currentUserNombre: string;
  currentUserApellido: string;
  currentUserAvatar: string | null;
  esAdmin: boolean;
  respuestas?: ComentarioRespuesta[];
  esRespuesta?: boolean;
};

export function ComentarioItem({
  comentario,
  currentUserId,
  currentUserNombre,
  currentUserApellido,
  currentUserAvatar,
  esAdmin,
  respuestas = [],
  esRespuesta = false,
}: Props) {
  const [respondiendo, setRespondiendo] = useState(false);
  const [respuestasExpandidas, setRespuestasExpandidas] = useState(false);

  const { user } = comentario;
  const iniciales = `${user.nombre[0] ?? ""}${user.apellido[0] ?? ""}`.toUpperCase();
  const esPropio = comentario.userId === currentUserId;
  const fecha = formatDistanceToNow(new Date(comentario.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="group flex gap-3 py-3">
      <Avatar className={cn(esRespuesta ? "h-8 w-8" : "h-10 w-10", "flex-shrink-0")}>
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {iniciales}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-sm flex-wrap">
          <span className="font-semibold text-foreground">
            {user.nombre} {user.apellido}
          </span>
          {user.puesto && (
            <span className="text-xs text-muted-foreground">
              {user.puesto.nombre}
            </span>
          )}
          <span className="text-xs text-muted-foreground">·</span>
          <time className="text-xs text-muted-foreground">{fecha}</time>
          {comentario.editado && (
            <span className="text-xs italic text-muted-foreground">
              (editado)
            </span>
          )}
        </div>

        <div className="mt-1 whitespace-pre-wrap text-sm text-foreground">
          {comentario.contenido}
        </div>

        <div className="mt-2 flex items-center gap-4 text-sm">
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
              <Reply className="h-3.5 w-3.5" />
              Responder
            </button>
          )}

          {!esRespuesta && "totalRespuestas" in comentario && comentario.totalRespuestas > 0 && (
            <button
              type="button"
              onClick={() => setRespuestasExpandidas((s) => !s)}
              className="flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  respuestasExpandidas && "rotate-180"
                )}
              />
              {respuestasExpandidas
                ? "Ocultar"
                : `Ver ${comentario.totalRespuestas} respuesta${comentario.totalRespuestas > 1 ? "s" : ""}`}
            </button>
          )}

          <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <ComentarioMenu
              id={comentario.id}
              contenido={comentario.contenido}
              esPropio={esPropio}
              esAdmin={esAdmin}
            />
          </div>
        </div>

        {respondiendo && !esRespuesta && (
          <div className="mt-3">
            <FormComentario
              leccionId={comentario.leccionId}
              user={{
                nombre: currentUserNombre,
                apellido: currentUserApellido,
                avatarUrl: currentUserAvatar,
              }}
              comentarioPadreId={comentario.id}
              placeholder="Escribe tu respuesta..."
              compacto
              onExito={() => setRespondiendo(false)}
              onCancelar={() => setRespondiendo(false)}
            />
          </div>
        )}

        {!esRespuesta && respuestasExpandidas && respuestas.length > 0 && (
          <div className="mt-3 space-y-0 border-l-2 border-border pl-4">
            {respuestas.map((r) => (
              <ComentarioItem
                key={r.id}
                comentario={r}
                currentUserId={currentUserId}
                currentUserNombre={currentUserNombre}
                currentUserApellido={currentUserApellido}
                currentUserAvatar={currentUserAvatar}
                esAdmin={esAdmin}
                esRespuesta
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
