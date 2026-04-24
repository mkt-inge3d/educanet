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
import { Textarea } from "@/components/ui/textarea";
import { crearTareaAdHoc } from "@/lib/tareas/actions";
import { SelectorNegocio } from "./SelectorNegocio";
import type { Negocio } from "@prisma/client";

export function ModalNuevaAdHoc() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntos, setPuntos] = useState(5);
  const [tiempoMin, setTiempoMin] = useState(15);
  const [tiempoMax, setTiempoMax] = useState(45);
  const [negocio, setNegocio] = useState<Negocio | null>(null);

  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setNombre("");
    setDescripcion("");
    setPuntos(5);
    setTiempoMin(15);
    setTiempoMax(45);
    setNegocio(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("Nombre requerido");
      return;
    }

    startTransition(async () => {
      const res = await crearTareaAdHoc({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        puntosBaseAdHoc: puntos,
        tiempoEstimadoMinAdHoc: tiempoMin,
        tiempoEstimadoMaxAdHoc: tiempoMax,
        negocio,
      });

      if (!res.success) {
        toast.error(res.error ?? "Error");
        return;
      }
      toast.success("Tarea registrada · tu jefe la verá para validar cuando la completes");
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="subtle">
            <Plus />
            Nueva tarea
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar tarea ad-hoc</DialogTitle>
          <DialogDescription>
            Registrá algo que hiciste fuera del catálogo. Tu jefe la valida al
            completarla y define los puntos finales (puede ajustarlos).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="n">Nombre</Label>
            <Input
              id="n"
              placeholder="Ej: Responder a lead urgente del cliente Autodesk"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="d">Descripción (opcional)</Label>
            <Textarea
              id="d"
              rows={2}
              placeholder="Qué hiciste y por qué"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neg">Negocio / marca</Label>
            <SelectorNegocio id="neg" value={negocio} onChange={setNegocio} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="p" className="text-xs">
                Puntos sugeridos
              </Label>
              <Input
                id="p"
                type="number"
                min={1}
                max={20}
                value={puntos}
                onChange={(e) => setPuntos(parseInt(e.target.value, 10) || 1)}
              />
              <p className="text-[10px] text-muted-foreground">1-20</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tmin" className="text-xs">
                T. mín (m)
              </Label>
              <Input
                id="tmin"
                type="number"
                min={1}
                value={tiempoMin}
                onChange={(e) => setTiempoMin(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tmax" className="text-xs">
                T. máx (m)
              </Label>
              <Input
                id="tmax"
                type="number"
                min={tiempoMin}
                value={tiempoMax}
                onChange={(e) =>
                  setTiempoMax(parseInt(e.target.value, 10) || tiempoMin)
                }
              />
            </div>
          </div>

          <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
            <strong>Importante:</strong> al completarla, pasa a estado &ldquo;por validar&rdquo;.
            Los puntos se suman a tu mes solo cuando el jefe aprueba.
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
              {isPending ? "Registrando…" : "Registrar tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
