"use client";

import { useState, useTransition } from "react";
import { X, Plus, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  agregarCursoRelacionado,
  eliminarCursoRelacionado,
  reordenarCursosRelacionados,
} from "@/lib/admin/cursos-relacionados-actions";
import { useRouter } from "next/navigation";

type Relacionado = {
  cursoDestinoId: string;
  orden: number;
  titulo: string;
  area: string | null;
  publicado: boolean;
};

type Opcion = { id: string; titulo: string; area: string | null };

export function RelacionadosEditor({
  cursoOrigenId,
  relacionados,
  opciones,
}: {
  cursoOrigenId: string;
  relacionados: Relacionado[];
  opciones: Opcion[];
}) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState("");
  const [isPending, startTransition] = useTransition();

  const agregar = () => {
    if (!seleccion) return;
    startTransition(async () => {
      const res = await agregarCursoRelacionado(cursoOrigenId, seleccion);
      if (res.success) {
        toast.success("Curso agregado");
        setSeleccion("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const eliminar = (destinoId: string) => {
    startTransition(async () => {
      const res = await eliminarCursoRelacionado(cursoOrigenId, destinoId);
      if (res.success) {
        toast.success("Curso removido");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const mover = (indice: number, direccion: -1 | 1) => {
    const nuevoIndice = indice + direccion;
    if (nuevoIndice < 0 || nuevoIndice >= relacionados.length) return;
    const ids = relacionados.map((r) => r.cursoDestinoId);
    [ids[indice], ids[nuevoIndice]] = [ids[nuevoIndice], ids[indice]];
    startTransition(async () => {
      const res = await reordenarCursosRelacionados(cursoOrigenId, ids);
      if (res.success) router.refresh();
      else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium">
            Agregar curso relacionado
          </label>
          <Select value={seleccion} onValueChange={(v) => setSeleccion(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un curso..." />
            </SelectTrigger>
            <SelectContent>
              {opciones.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  No quedan cursos disponibles.
                </div>
              ) : (
                opciones.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.titulo}
                    {o.area && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({o.area})
                      </span>
                    )}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={agregar} disabled={!seleccion || isPending}>
          <Plus className="mr-1 h-4 w-4" />
          Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {relacionados.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aun no has seleccionado cursos. Se usara el fallback automatico.
          </p>
        ) : (
          relacionados.map((r, idx) => (
            <div
              key={r.cursoDestinoId}
              className="flex items-center gap-3 rounded-md border bg-card p-3"
            >
              <span className="text-sm font-medium text-muted-foreground tabular-nums w-6 text-center">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.titulo}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {r.area && <span>{r.area}</span>}
                  {!r.publicado && (
                    <span className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      No publicado
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={idx === 0 || isPending}
                  onClick={() => mover(idx, -1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={idx === relacionados.length - 1 || isPending}
                  onClick={() => mover(idx, 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => eliminar(r.cursoDestinoId)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
