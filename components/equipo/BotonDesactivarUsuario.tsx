"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserMinus, UserCheck } from "lucide-react";
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
import {
  desactivarMiembroAction,
  reactivarMiembroAction,
} from "@/lib/equipo/jefe-actions";

type Props = {
  userId: string;
  userNombre: string;
  activo: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "destructive" | "ghost";
};

export function BotonDesactivarUsuario({
  userId,
  userNombre,
  activo,
  size = "sm",
  variant = "outline",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirmar = () => {
    startTransition(async () => {
      const action = activo ? desactivarMiembroAction : reactivarMiembroAction;
      const res = await action(userId);
      if (res.success) {
        toast.success(
          activo
            ? `${userNombre} fue desactivado`
            : `${userNombre} fue reactivado`,
        );
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudo completar la acción");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={activo ? variant : "outline"}
            size={size}
            className={
              activo
                ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                : "border-success/40 text-success hover:bg-success/10"
            }
          >
            {activo ? (
              <>
                <UserMinus className="mr-1 h-3.5 w-3.5" />
                Desactivar
              </>
            ) : (
              <>
                <UserCheck className="mr-1 h-3.5 w-3.5" />
                Reactivar
              </>
            )}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {activo ? "Desactivar cuenta" : "Reactivar cuenta"}
          </DialogTitle>
          <DialogDescription>
            {activo ? (
              <>
                Vas a desactivar la cuenta de <strong>{userNombre}</strong>. No
                podrá iniciar sesión, no aparecerá en rankings ni recibirá
                tareas nuevas. Su historial (puntos, KPIs, certificados) se
                preserva y podés reactivarla en cualquier momento.
              </>
            ) : (
              <>
                Vas a reactivar la cuenta de <strong>{userNombre}</strong>.
                Volverá a poder iniciar sesión y a aparecer en el equipo.
              </>
            )}
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
          <Button
            variant={activo ? "destructive" : "default"}
            onClick={handleConfirmar}
            disabled={pending}
          >
            {pending
              ? "Procesando…"
              : activo
                ? "Sí, desactivar"
                : "Sí, reactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
