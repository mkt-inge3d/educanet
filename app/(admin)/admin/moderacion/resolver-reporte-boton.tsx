"use client";

import { useTransition } from "react";
import { EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resolverReporte } from "@/lib/comentarios/actions";

export function ResolverReporteBoton({ reporteId }: { reporteId: string }) {
  const [isPending, startTransition] = useTransition();

  const resolver = (accion: "OCULTAR" | "DESESTIMAR") => {
    startTransition(async () => {
      const res = await resolverReporte({ reporteId, accion });
      if (res.success) {
        toast.success(
          accion === "OCULTAR" ? "Comentario oculto" : "Reporte desestimado"
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2 pt-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => resolver("OCULTAR")}
      >
        <EyeOff className="mr-1 h-3.5 w-3.5" />
        Ocultar comentario
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => resolver("DESESTIMAR")}
      >
        <CheckCircle className="mr-1 h-3.5 w-3.5" />
        Desestimar reporte
      </Button>
    </div>
  );
}
