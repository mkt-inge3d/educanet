"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { toggleLikeComentario } from "@/lib/comentarios/actions";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

export function BotonLike({
  comentarioId,
  totalLikes,
  conLike,
  deshabilitado = false,
  razonDeshabilitado,
}: {
  comentarioId: string;
  totalLikes: number;
  conLike: boolean;
  deshabilitado?: boolean;
  razonDeshabilitado?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { conLike, totalLikes },
    (state, nuevo: { conLike: boolean; totalLikes: number }) => nuevo
  );

  const alClickear = () => {
    if (deshabilitado) return;
    startTransition(async () => {
      const nuevoConLike = !optimistic.conLike;
      const nuevoTotal = nuevoConLike
        ? optimistic.totalLikes + 1
        : Math.max(0, optimistic.totalLikes - 1);
      setOptimistic({ conLike: nuevoConLike, totalLikes: nuevoTotal });

      const res = await toggleLikeComentario(comentarioId);
      if (!res.success) {
        toast.error(res.error);
        setOptimistic({ conLike: optimistic.conLike, totalLikes: optimistic.totalLikes });
      } else if (res.data) {
        setOptimistic({ conLike: res.data.conLike, totalLikes: res.data.totalLikes });
      }
    });
  };

  const boton = (
    <button
      type="button"
      onClick={alClickear}
      disabled={deshabilitado || isPending}
      aria-pressed={optimistic.conLike}
      aria-label={optimistic.conLike ? "Quitar like" : "Dar like"}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-all disabled:cursor-not-allowed",
        "hover:scale-105 active:scale-95",
        optimistic.conLike
          ? "text-rose-500"
          : "text-muted-foreground hover:text-foreground",
        deshabilitado && "opacity-60 hover:scale-100"
      )}
    >
      <motion.span
        animate={
          optimistic.conLike
            ? { scale: [1, 1.3, 1], transition: { duration: 0.25 } }
            : { scale: 1 }
        }
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-all",
            optimistic.conLike && "fill-rose-500"
          )}
        />
      </motion.span>
      <span className="tabular-nums">{optimistic.totalLikes}</span>
    </button>
  );

  if (deshabilitado && razonDeshabilitado) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<span className="inline-block" />}>{boton}</TooltipTrigger>
          <TooltipContent>{razonDeshabilitado}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return boton;
}
