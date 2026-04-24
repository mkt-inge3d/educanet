"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editarTareaInstancia } from "@/lib/tareas/actions";
import { SelectorNegocio } from "./SelectorNegocio";
import type { Negocio, Prisma } from "@prisma/client";

type Tarea = Prisma.TareaInstanciaGetPayload<{
  include: { catalogoTarea: true };
}>;

export function ModalEditarTarea({ tarea }: { tarea: Tarea }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const esAdHoc = !tarea.catalogoTareaId;

  const [negocio, setNegocio] = useState<Negocio | null>(tarea.negocio ?? null);
  const [nombre, setNombre] = useState(tarea.nombreAdHoc ?? "");
  const [descripcion, setDescripcion] = useState(tarea.descripcionAdHoc ?? "");
  const [puntos, setPuntos] = useState(tarea.puntosBaseAdHoc ?? 5);
  const [tiempoMin, setTiempoMin] = useState(tarea.tiempoEstimadoMinAdHoc ?? 15);
  const [tiempoMax, setTiempoMax] = useState(tarea.tiempoEstimadoMaxAdHoc ?? 45);
  const [fechaInicio, setFechaInicio] = useState(
    tarea.fechaEstimadaInicio.toISOString().slice(0, 10),
  );
  const [fechaFin, setFechaFin] = useState(
    tarea.fechaEstimadaFin.toISOString().slice(0, 10),
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await editarTareaInstancia({
        tareaId: tarea.id,
        negocio,
        fechaEstimadaInicio: new Date(fechaInicio),
        fechaEstimadaFin: new Date(fechaFin),
        ...(esAdHoc
          ? {
              nombreAdHoc: nombre,
              descripcionAdHoc: descripcion,
              puntosBaseAdHoc: puntos,
              tiempoEstimadoMinAdHoc: tiempoMin,
              tiempoEstimadoMaxAdHoc: tiempoMax,
            }
          : {}),
      });
      if (!res.success) {
        toast.error(res.error ?? "Error");
        return;
      }
      toast.success("Tarea actualizada");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="subtle" size="sm">
            <Pencil />
            Editar
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
          <DialogDescription>
            {esAdHoc
              ? "Tarea ad-hoc — podés editar nombre, descripción, puntos, tiempos y negocio."
              : "Tarea del catálogo — podés editar negocio, fechas y notas de ejecución."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {esAdHoc && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ed-n">Nombre</Label>
                <Input
                  id="ed-n"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-d">Descripción</Label>
                <Textarea
                  id="ed-d"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ed-p" className="text-xs">Puntos</Label>
                  <Input
                    id="ed-p"
                    type="number"
                    min={1}
                    max={50}
                    value={puntos}
                    onChange={(e) => setPuntos(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ed-tmin" className="text-xs">T. mín</Label>
                  <Input
                    id="ed-tmin"
                    type="number"
                    min={1}
                    value={tiempoMin}
                    onChange={(e) => setTiempoMin(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ed-tmax" className="text-xs">T. máx</Label>
                  <Input
                    id="ed-tmax"
                    type="number"
                    min={tiempoMin}
                    value={tiempoMax}
                    onChange={(e) =>
                      setTiempoMax(parseInt(e.target.value, 10) || tiempoMin)
                    }
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="ed-neg">Negocio</Label>
            <SelectorNegocio id="ed-neg" value={negocio} onChange={setNegocio} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ed-fi" className="text-xs">Fecha inicio</Label>
              <Input
                id="ed-fi"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ed-ff" className="text-xs">Fecha fin</Label>
              <Input
                id="ed-ff"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
