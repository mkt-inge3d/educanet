"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/card";
import { toggleMostrarEnRanking } from "@/lib/perfil/actions";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export function PerfilPrivacidad({
  mostrarEnRanking,
}: {
  mostrarEnRanking: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleMostrarEnRanking(!mostrarEnRanking);
      toast.success(mostrarEnRanking ? "Oculto del ranking" : "Visible en el ranking");
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="font-semibold">Privacidad</h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mostrarEnRanking ? (
            <Eye className="h-5 w-5 text-primary" />
          ) : (
            <EyeOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">Aparecer en el ranking de mi area</p>
            <p className="text-xs text-muted-foreground">
              {mostrarEnRanking
                ? "Tus companeros pueden verte en el ranking"
                : "No apareces en el ranking"}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            mostrarEnRanking ? "bg-primary" : "bg-muted"
          } ${isPending ? "opacity-50" : ""}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              mostrarEnRanking ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </Card>
  );
}
