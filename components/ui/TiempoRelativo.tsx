"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function TiempoRelativo({ fecha }: { fecha: Date | string }) {
  return (
    <span>
      {formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es })}
    </span>
  );
}
