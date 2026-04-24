"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { asignarTareaDirecta } from "@/lib/tareas/actions";
import { SelectorNegocio } from "@/components/tareas/SelectorNegocio";
import type { Negocio } from "@prisma/client";

type CatalogoItem = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  tiempoMinimoMin: number;
  tiempoMaximoMin: number;
  puntosBase: number;
};

export function ModalAsignarTarea({
  asignadoAId,
  asignadoANombre,
  catalogoAsignable,
}: {
  asignadoAId: string;
  asignadoANombre: string;
  catalogoAsignable: CatalogoItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState<"catalogo" | "adhoc">("catalogo");
  const [catalogoId, setCatalogoId] = useState("");

  // Ad-hoc
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntos, setPuntos] = useState(10);
  const [tiempoMin, setTiempoMin] = useState(15);
  const [tiempoMax, setTiempoMax] = useState(45);

  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [negocio, setNegocio] = useState<Negocio | null>(null);

  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setCatalogoId("");
    setNombre("");
    setDescripcion("");
    setPuntos(10);
    setTiempoMin(15);
    setTiempoMax(45);
    setFechaInicio(new Date().toISOString().slice(0, 10));
    setNegocio(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === "catalogo" && !catalogoId) {
      toast.error("Elegí una tarea del catálogo");
      return;
    }
    if (modo === "adhoc" && !nombre.trim()) {
      toast.error("Nombre requerido");
      return;
    }

    startTransition(async () => {
      const res = await asignarTareaDirecta({
        asignadoAId,
        fechaEstimadaInicio: new Date(fechaInicio),
        negocio,
        ...(modo === "catalogo"
          ? { catalogoTareaId: catalogoId }
          : {
              nombreAdHoc: nombre.trim(),
              descripcionAdHoc: descripcion.trim() || undefined,
              puntosBaseAdHoc: puntos,
              tiempoEstimadoMinAdHoc: tiempoMin,
              tiempoEstimadoMaxAdHoc: tiempoMax,
            }),
      });

      if (!res.success) {
        toast.error(res.error ?? "Error");
        return;
      }
      toast.success(`Tarea asignada a ${asignadoANombre}`);
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus />
            Asignar tarea
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar tarea a {asignadoANombre}</DialogTitle>
          <DialogDescription>
            Elegí una tarea del catálogo o definila ad-hoc.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={modo === "catalogo" ? "default" : "outline"}
            onClick={() => setModo("catalogo")}
          >
            Del catálogo ({catalogoAsignable.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={modo === "adhoc" ? "default" : "outline"}
            onClick={() => setModo("adhoc")}
          >
            Ad-hoc
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {modo === "catalogo" && (
            <div className="space-y-2">
              <Label htmlFor="cat">Tarea</Label>
              <Select value={catalogoId} onValueChange={(v) => setCatalogoId(v ?? "")}>
                <SelectTrigger id="cat">
                  <SelectValue placeholder="Buscá una tarea" />
                </SelectTrigger>
                <SelectContent>
                  {catalogoAsignable.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} · {c.puntosBase}pts · {c.tiempoMinimoMin}-{c.tiempoMaximoMin}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {catalogoAsignable.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  El puesto del miembro no tiene tareas en el catálogo. Creá una
                  ad-hoc.
                </p>
              )}
            </div>
          )}

          {modo === "adhoc" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="n">Nombre</Label>
                <Input
                  id="n"
                  placeholder="Ej: Reportar incidente con proveedor X"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d">Descripción</Label>
                <Textarea
                  id="d"
                  rows={2}
                  placeholder="Contexto opcional"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="p" className="text-xs">Puntos (1-50)</Label>
                  <Input
                    id="p"
                    type="number"
                    min={1}
                    max={50}
                    value={puntos}
                    onChange={(e) => setPuntos(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tmin" className="text-xs">T. mín (m)</Label>
                  <Input
                    id="tmin"
                    type="number"
                    min={1}
                    value={tiempoMin}
                    onChange={(e) => setTiempoMin(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tmax" className="text-xs">T. máx (m)</Label>
                  <Input
                    id="tmax"
                    type="number"
                    min={tiempoMin}
                    value={tiempoMax}
                    onChange={(e) => setTiempoMax(parseInt(e.target.value, 10) || tiempoMin)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fi">Fecha de inicio</Label>
              <Input
                id="fi"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neg-asig">Negocio</Label>
              <SelectorNegocio id="neg-asig" value={negocio} onChange={setNegocio} />
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
              {isPending ? "Asignando…" : "Asignar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
