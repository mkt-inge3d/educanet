"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { reportarComentario } from "@/lib/comentarios/actions";

const RAZONES_RAPIDAS = [
  "Spam o publicidad",
  "Lenguaje ofensivo",
  "Fuera de tema",
  "Informacion incorrecta",
] as const;

export function ModalReportar({
  comentarioId,
  abierto,
  onCerrar,
}: {
  comentarioId: string;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const [razon, setRazon] = useState("");
  const [isPending, startTransition] = useTransition();

  const enviar = () => {
    if (razon.trim().length < 10) {
      toast.error("Describe el motivo con al menos 10 caracteres");
      return;
    }
    startTransition(async () => {
      const res = await reportarComentario({ comentarioId, razon: razon.trim() });
      if (res.success) {
        toast.success("Reporte enviado. Un moderador lo revisara.");
        setRazon("");
        onCerrar();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            Reportar comentario
          </DialogTitle>
          <DialogDescription>
            Tu reporte llegara al equipo de moderacion. El comentario se
            mantiene visible hasta su revision.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {RAZONES_RAPIDAS.map((r) => (
            <Badge
              key={r}
              variant="outline"
              className="cursor-pointer hover:bg-muted"
              onClick={() => setRazon(r)}
            >
              {r}
            </Badge>
          ))}
        </div>

        <Textarea
          value={razon}
          onChange={(e) => setRazon(e.target.value)}
          placeholder="Describe brevemente por que reportas este comentario (min. 10 caracteres)"
          maxLength={500}
          rows={4}
        />
        <p className="text-xs text-muted-foreground text-right">
          {razon.length}/500
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={enviar} disabled={isPending}>
            {isPending ? "Enviando..." : "Enviar reporte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
