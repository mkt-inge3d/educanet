"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function LeccionCompletadaBanner({
  completada,
  puntos,
}: {
  completada: boolean;
  puntos: number;
}) {
  if (!completada) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2.5 text-primary"
    >
      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm font-medium">
        Leccion completada — +{puntos} puntos
      </span>
    </motion.div>
  );
}
