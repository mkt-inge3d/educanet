"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MockPlayer } from "./reproductor/MockPlayer";
import { BunnyPlayer } from "./reproductor/BunnyPlayer";
import { useTrackProgreso } from "@/hooks/useTrackProgreso";
import { CheckCircle } from "lucide-react";
import { LiquidRipple } from "@/components/ui/primitives/LiquidRipple";

export function LeccionVideo({
  leccionId,
  bunnyVideoId,
  duracionSegundos,
  porcentajeVisto,
  completada,
  puntosRecompensa,
}: {
  leccionId: string;
  bunnyVideoId: string | null;
  duracionSegundos: number;
  porcentajeVisto: number;
  completada: boolean;
  puntosRecompensa: number;
}) {
  const router = useRouter();
  const [ripple, setRipple] = useState(false);

  const { actualizarProgreso } = useTrackProgreso({
    leccionId,
    porcentajeInicial: completada ? 100 : porcentajeVisto,
    onPuntosGanados: (data) => {
      toast.success(`Leccion completada! +${data.puntos} puntos`);
      if (data.subioNivel) {
        toast.success(`Subiste al nivel ${data.nuevoNivel}!`);
      }
      setRipple(true);
      setTimeout(() => setRipple(false), 1200);
      router.refresh();
    },
  });

  const useBunny =
    bunnyVideoId &&
    bunnyVideoId.length > 0 &&
    process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

  return (
    <div className="relative space-y-4">
      <LiquidRipple trigger={ripple} color="success" />
      {completada && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          Leccion completada — +{puntosRecompensa} puntos
        </div>
      )}

      {useBunny ? (
        <BunnyPlayer
          bunnyVideoId={bunnyVideoId!}
          onProgreso={actualizarProgreso}
          onCompletar={() => actualizarProgreso(100)}
        />
      ) : (
        <MockPlayer
          duracionSegundos={duracionSegundos}
          porcentajeInicial={completada ? 100 : porcentajeVisto}
          onProgreso={actualizarProgreso}
          onCompletar={() => actualizarProgreso(100)}
        />
      )}
    </div>
  );
}
