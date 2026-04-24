"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LISTA_NEGOCIOS, infoNegocio } from "@/lib/tareas/negocios";
import type { Negocio } from "@prisma/client";

export function SelectorNegocio({
  value,
  onChange,
  placeholder = "Sin negocio",
  id,
}: {
  value: Negocio | null;
  onChange: (v: Negocio | null) => void;
  placeholder?: string;
  id?: string;
}) {
  const info = infoNegocio(value);
  return (
    <Select
      value={value ?? "__none"}
      onValueChange={(v) => onChange(v && v !== "__none" ? (v as Negocio) : null)}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder}>
          {info && (
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${info.dotClass}`} />
              {info.label}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            Sin negocio
          </span>
        </SelectItem>
        {LISTA_NEGOCIOS.map((n) => (
          <SelectItem key={n.codigo} value={n.codigo}>
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${n.dotClass}`} />
              {n.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function BadgeNegocio({
  negocio,
  compact = false,
}: {
  negocio: Negocio | null | undefined;
  compact?: boolean;
}) {
  const info = infoNegocio(negocio);
  if (!info) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-px font-medium leading-none ${
        info.badgeClass
      } ${compact ? "text-[9px]" : "text-[10px]"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${info.dotClass}`} />
      {info.labelCorto}
    </span>
  );
}
