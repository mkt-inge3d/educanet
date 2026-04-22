"use client";

import { useState, useTransition } from "react";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { reportarInstancia } from "@/lib/kpis/hitos-actions";
import { TIPOS_PERMITIDOS, TAMANO_MAX_BYTES } from "@/lib/kpis/evidencia-storage";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanciaId: string;
  codigo: string;
  nombre: string;
  descripcion: string;
};

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // FileReader devuelve "data:image/png;base64,..." → quitar prefijo
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ModalReportarHito({
  open,
  onOpenChange,
  instanciaId,
  codigo,
  nombre,
  descripcion,
}: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [comentario, setComentario] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFile(f: File | null) {
    if (!f) {
      setArchivo(null);
      return;
    }
    if (!TIPOS_PERMITIDOS.includes(f.type)) {
      toast.error(`Tipo no permitido: ${f.type}. Solo PNG/JPG/WEBP/PDF.`);
      return;
    }
    if (f.size > TAMANO_MAX_BYTES) {
      toast.error("El archivo supera los 5MB");
      return;
    }
    setArchivo(f);
  }

  function reset() {
    setArchivo(null);
    setComentario("");
  }

  async function submit() {
    startTransition(async () => {
      let archivoData: { tipo: string; data: string } | undefined;
      if (archivo) {
        try {
          archivoData = {
            tipo: archivo.type,
            data: await archivoABase64(archivo),
          };
        } catch {
          toast.error("No se pudo leer el archivo");
          return;
        }
      }

      const r = await reportarInstancia({
        instanciaId,
        comentario: comentario.trim() || undefined,
        archivo: archivoData,
      });

      if (!r.success) {
        toast.error(r.error ?? "No se pudo reportar");
        return;
      }
      toast.success("Reportado. Tu jefe lo revisara en breve.");
      reset();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="font-mono text-xs text-muted-foreground">
              {codigo}
            </span>{" "}
            {nombre}
          </DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Drop zone */}
          {!archivo ? (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors hover:border-foreground/30 hover:bg-muted/40">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">Subir evidencia</span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG, WEBP o PDF · max 5MB
              </span>
              <input
                type="file"
                className="sr-only"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{archivo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(archivo.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setArchivo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Textarea
            placeholder="Comentario opcional para el jefe..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar a revision
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
