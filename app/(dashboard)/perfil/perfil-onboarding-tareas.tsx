"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { toast } from "sonner";
import { cargarTareasPorDefectoSelfAction } from "@/lib/tareas/catalogo-actions";

export function PerfilOnboardingTareas() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleCargar = () => {
    startTransition(async () => {
      const res = await cargarTareasPorDefectoSelfAction();
      if (res.success) {
        toast.success(
          `${res.asignadas} ${res.asignadas === 1 ? "tarea cargada" : "tareas cargadas"}`,
          { description: "Ya podés verlas en Mis tareas y Mis proyectos." },
        );
        setOpen(false);
      } else {
        toast.error(res.error ?? "No se pudieron cargar las tareas");
      }
    });
  };

  return (
    <Card className="overflow-hidden border-primary/30 bg-primary/5 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-base font-semibold">Cargá tu flujo de trabajo</h3>
          <p className="text-sm text-muted-foreground">
            Replica las tareas activas de tu puesto desde el flujo del equipo.
            Es un punto de partida — después podés ajustarlas a tu medida.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="default" className="shrink-0">
                Cargar tareas por defecto
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cargar tareas por defecto</DialogTitle>
              <DialogDescription>
                Vamos a copiar las tareas activas de un compañero con tu mismo
                puesto, manteniendo estados y fechas. Esto es ideal para
                cuentas nuevas — no se ejecuta si ya tenés tareas asignadas.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button onClick={handleCargar} disabled={pending}>
                {pending ? "Cargando…" : "Sí, cargar tareas"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
