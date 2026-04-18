"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { actualizarComentario } from "@/lib/comentarios/actions";

export function ModalEditar({
  id,
  contenidoInicial,
  abierto,
  onCerrar,
}: {
  id: string;
  contenidoInicial: string;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const [contenido, setContenido] = useState(contenidoInicial);
  const [isPending, startTransition] = useTransition();

  const guardar = () => {
    if (contenido.trim().length < 1) {
      toast.error("El comentario no puede estar vacio");
      return;
    }
    startTransition(async () => {
      const res = await actualizarComentario({ id, contenido });
      if (res.success) {
        toast.success("Comentario actualizado");
        onCerrar();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar comentario</DialogTitle>
        </DialogHeader>
        <Textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          maxLength={2000}
          rows={5}
        />
        <p className="text-xs text-muted-foreground text-right">
          {contenido.length}/2000
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
