"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2, Flag, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  eliminarComentario,
  ocultarComentario,
} from "@/lib/comentarios/actions";
import { ModalEditar } from "./ModalEditar";
import { ModalReportar } from "./ModalReportar";

export function ComentarioMenu({
  id,
  contenido,
  esPropio,
  esAdmin,
}: {
  id: string;
  contenido: string;
  esPropio: boolean;
  esAdmin: boolean;
}) {
  const [editarAbierto, setEditarAbierto] = useState(false);
  const [reportarAbierto, setReportarAbierto] = useState(false);
  const [, startTransition] = useTransition();

  const eliminar = () => {
    if (!confirm("Eliminar este comentario? Esta accion no se puede deshacer."))
      return;
    startTransition(async () => {
      const res = await eliminarComentario(id);
      if (res.success) toast.success("Comentario eliminado");
      else toast.error(res.error);
    });
  };

  const ocultar = () => {
    if (!confirm("Ocultar este comentario para los usuarios?")) return;
    startTransition(async () => {
      const res = await ocultarComentario(id);
      if (res.success) toast.success("Comentario oculto");
      else toast.error(res.error);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Opciones del comentario"
              className="h-7 w-7"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          {esPropio && (
            <>
              <DropdownMenuItem onClick={() => setEditarAbierto(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={eliminar} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
          {!esPropio && (
            <DropdownMenuItem onClick={() => setReportarAbierto(true)}>
              <Flag className="mr-2 h-4 w-4" />
              Reportar
            </DropdownMenuItem>
          )}
          {esAdmin && !esPropio && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={ocultar}>
                <EyeOff className="mr-2 h-4 w-4" />
                Ocultar (admin)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ModalEditar
        id={id}
        contenidoInicial={contenido}
        abierto={editarAbierto}
        onCerrar={() => setEditarAbierto(false)}
      />
      <ModalReportar
        comentarioId={id}
        abierto={reportarAbierto}
        onCerrar={() => setReportarAbierto(false)}
      />
    </>
  );
}
