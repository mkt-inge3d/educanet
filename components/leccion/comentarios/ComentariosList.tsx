"use client";

import { useState, useTransition } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cargarPaginaComentarios } from "@/lib/comentarios/public-actions";
import type {
  ComentarioConDetalle,
  OrdenComentarios,
} from "@/types/comentarios";
import { ComentarioItem } from "./ComentarioItem";
import { FormComentario } from "./FormComentario";
import { cn } from "@/lib/utils";

const FILTROS: { value: OrdenComentarios; label: string }[] = [
  { value: "mas-votados", label: "Mas votados" },
  { value: "nuevos", label: "Nuevos" },
  { value: "favoritos", label: "Favoritos" },
];

export function ComentariosList({
  leccionId,
  comentariosIniciales,
  cursorInicial,
  ordenInicial,
  currentUser,
  esAdmin,
  total,
}: {
  leccionId: string;
  comentariosIniciales: ComentarioConDetalle[];
  cursorInicial: string | null;
  ordenInicial: OrdenComentarios;
  currentUser: {
    id: string;
    nombre: string;
    apellido: string;
    avatarUrl: string | null;
  };
  esAdmin: boolean;
  total: number;
}) {
  const [comentarios, setComentarios] = useState(comentariosIniciales);
  const [cursor, setCursor] = useState<string | null>(cursorInicial);
  const [orden, setOrden] = useState<OrdenComentarios>(ordenInicial);
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

  const recargarDespuesDePost = () => {
    startTransition(async () => {
      const res = await cargarPaginaComentarios({ leccionId, orden });
      setComentarios(res.comentarios);
      setCursor(res.siguienteCursor);
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          Comentarios
          <span className="text-sm font-normal text-muted-foreground">
            ({total})
          </span>
        </h2>

        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => cambiarOrden(f.value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                orden === f.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <FormComentario
          leccionId={leccionId}
          user={currentUser}
          onExito={recargarDespuesDePost}
        />
      </div>

      {comentarios.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {orden === "favoritos"
              ? "No tienes comentarios favoritos en esta leccion."
              : "Se el primero en comentar esta leccion."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {comentarios.map((c) => (
            <ComentarioItem
              key={c.id}
              comentario={c}
              respuestas={c.respuestas}
              currentUserId={currentUser.id}
              currentUserNombre={currentUser.nombre}
              currentUserApellido={currentUser.apellido}
              currentUserAvatar={currentUser.avatarUrl}
              esAdmin={esAdmin}
            />
          ))}
        </div>
      )}

      {cursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={cargarMas}
            disabled={isPending}
          >
            {isPending ? "Cargando..." : "Cargar mas comentarios"}
          </Button>
        </div>
      )}
    </section>
  );
}
