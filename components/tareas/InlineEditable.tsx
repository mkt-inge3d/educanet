"use client";

/**
 * Patrón inline editing con save OPTIMISTIC.
 *
 * Flujo:
 *   1. Click → entra en modo edit con ring + pulse violeta.
 *   2. Enter/blur → sale del modo edit inmediatamente, actualiza displayValue
 *      instant, y dispara onSave() en background (fire-and-forget).
 *   3. Si onSave falla, rollback al valor anterior + toast error.
 *   4. Si el prop `value` cambia desde el server (router.refresh), sincroniza.
 */
import { useEffect, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LISTA_NEGOCIOS, infoNegocio } from "@/lib/tareas/negocios";
import { BadgeNegocio } from "./SelectorNegocio";
import type { Negocio } from "@prisma/client";

type SaveResult = { success: true } | { success: false; error?: string };

// ============================================================================
// Texto inline (single line) - optimistic
// ============================================================================
export function InlineText({
  value,
  onSave,
  readOnly = false,
  allowEmpty = false,
  emptyHint,
  placeholder = "Escribir…",
  className,
  inputClassName,
  maxLength,
}: {
  value: string;
  onSave: (nuevo: string) => Promise<SaveResult>;
  readOnly?: boolean;
  allowEmpty?: boolean;
  emptyHint?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const [display, setDisplay] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setLocal(value);
      setDisplay(value);
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const limpio = local.trim();
    setEditing(false);
    if (limpio === display.trim()) return;
    if (!limpio && !allowEmpty) {
      toast.error("No puede quedar vacío");
      setLocal(display);
      return;
    }
    // Optimistic: actualiza display inmediatamente
    const anterior = display;
    setDisplay(limpio);
    // Fire-and-forget
    onSave(limpio).then((res) => {
      if (!res.success) {
        toast.error(res.error ?? "Error al guardar");
        setDisplay(anterior);
        setLocal(anterior);
      }
    });
  };

  if (readOnly) {
    return <span className={className}>{display}</span>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "group relative inline-flex items-center gap-1.5 rounded-md px-1 -mx-1 text-left transition-colors hover:bg-muted/60 focus:bg-muted/60 focus:outline-none",
          className,
        )}
        title="Click para editar"
      >
        <span className="truncate">{display || placeholder}</span>
        <Pencil className="h-3 w-3 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 group-focus:opacity-60" />
      </button>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Input
        ref={inputRef}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setLocal(display);
            setEditing(false);
          }
        }}
        maxLength={maxLength}
        className={cn(
          "ring-2 ring-primary/40 animate-[pulse-edit_1.5s_ease-in-out_infinite]",
          inputClassName,
        )}
        style={{
          minWidth: Math.max(180, (local.length || placeholder.length) * 8) + "px",
        }}
      />
      {allowEmpty && emptyHint && !local.trim() && (
        <span className="text-xs text-muted-foreground italic">{emptyHint}</span>
      )}
    </span>
  );
}

// ============================================================================
// Textarea inline - optimistic
// ============================================================================
export function InlineTextarea({
  value,
  onSave,
  readOnly = false,
  placeholder = "Agregar descripción",
  className,
  rows = 3,
}: {
  value: string;
  onSave: (nuevo: string) => Promise<SaveResult>;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) {
      setLocal(value);
      setDisplay(value);
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (local === display) return;
    const anterior = display;
    setDisplay(local);
    onSave(local).then((res) => {
      if (!res.success) {
        toast.error(res.error ?? "Error al guardar");
        setDisplay(anterior);
        setLocal(anterior);
      }
    });
  };

  if (readOnly) {
    return (
      <p className={className}>
        {display || <span className="italic opacity-60">{placeholder}</span>}
      </p>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "group relative block w-full rounded-md px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-muted/60 focus:bg-muted/60 focus:outline-none",
          className,
        )}
        title="Click para editar"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 flex-1">
            {display || (
              <span className="italic text-muted-foreground/70">{placeholder}</span>
            )}
          </span>
          <Pencil className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 group-focus:opacity-60" />
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <Textarea
        ref={ref}
        rows={rows}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setLocal(display);
            setEditing(false);
          } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          }
        }}
        className="ring-2 ring-primary/40 animate-[pulse-edit_1.5s_ease-in-out_infinite]"
      />
      <div className="flex items-center justify-end gap-2 text-xs">
        <span className="text-muted-foreground">Ctrl+Enter guarda · Esc cancela</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setLocal(display);
            setEditing(false);
          }}
        >
          <X />
        </Button>
        <Button type="button" size="sm" onClick={commit}>
          <Check />
          Guardar
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Date inline - optimistic
// ============================================================================
export function InlineDate({
  value,
  onSave,
  label,
  className,
}: {
  value: Date;
  onSave: (nuevo: Date) => Promise<SaveResult>;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState(value);
  const [local, setLocal] = useState(() => value.toISOString().slice(0, 10));

  useEffect(() => {
    setDisplay(value);
    if (!open) setLocal(value.toISOString().slice(0, 10));
  }, [value, open]);

  const commit = () => {
    const nueva = new Date(local);
    setOpen(false);
    if (nueva.toISOString().slice(0, 10) === display.toISOString().slice(0, 10)) return;
    const anterior = display;
    setDisplay(nueva);
    onSave(nueva).then((res) => {
      if (!res.success) {
        toast.error(res.error ?? "Error al guardar");
        setDisplay(anterior);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-md px-1 -mx-1 text-sm transition-colors hover:bg-muted/60 focus:bg-muted/60 focus:outline-none",
              className,
            )}
            title="Click para editar"
          >
            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
            {label && <span className="text-muted-foreground">{label}:</span>}
            <span className="tabular-nums">
              {display.toLocaleDateString("es")}
            </span>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 group-focus:opacity-60" />
          </button>
        }
      />
      <PopoverContent className="w-auto" align="start">
        <div className="space-y-2">
          <Input
            type="date"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            autoFocus
            className="ring-2 ring-primary/40"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={commit}>
              <Check />
              Guardar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Negocio inline - optimistic
// ============================================================================
export function InlineNegocio({
  value,
  onSave,
  className,
}: {
  value: Negocio | null;
  onSave: (nuevo: Negocio | null) => Promise<SaveResult>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState<Negocio | null>(value);

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  const info = infoNegocio(display);

  const seleccionar = (nuevo: Negocio | null) => {
    setOpen(false);
    if (nuevo === display) return;
    const anterior = display;
    setDisplay(nuevo);
    onSave(nuevo).then((res) => {
      if (!res.success) {
        toast.error(res.error ?? "Error");
        setDisplay(anterior);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "group inline-flex items-center gap-1 rounded-md px-1 -mx-1 text-xs transition-colors hover:bg-muted/60 focus:bg-muted/60 focus:outline-none",
              className,
            )}
            title="Click para asignar marca"
          >
            {info ? (
              <BadgeNegocio negocio={display} />
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-1.5 py-px text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                Asignar marca
              </span>
            )}
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
          </button>
        }
      />
      <PopoverContent className="w-52 p-1" align="start">
        <div className="flex flex-col gap-0.5">
          {display && (
            <button
              type="button"
              onClick={() => seleccionar(null)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              <span className="text-muted-foreground">Quitar marca</span>
            </button>
          )}
          {LISTA_NEGOCIOS.map((n) => (
            <button
              key={n.codigo}
              type="button"
              onClick={() => seleccionar(n.codigo)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                n.codigo === display && "bg-muted font-medium",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", n.dotClass)} />
              <span>{n.label}</span>
              {n.codigo === display && <Check className="ml-auto h-3 w-3 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Number inline - optimistic
// ============================================================================
export function InlineNumber({
  value,
  onSave,
  min = 1,
  max = 9999,
  suffix,
  readOnly = false,
  className,
}: {
  value: number;
  onSave: (nuevo: number) => Promise<SaveResult>;
  min?: number;
  max?: number;
  suffix?: string;
  readOnly?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(String(value));
  const [display, setDisplay] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setLocal(String(value));
      setDisplay(value);
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const parsed = parseInt(local, 10);
    setEditing(false);
    if (isNaN(parsed) || parsed < min || parsed > max) {
      toast.error(`Valor entre ${min} y ${max}`);
      setLocal(String(display));
      return;
    }
    if (parsed === display) return;
    const anterior = display;
    setDisplay(parsed);
    onSave(parsed).then((res) => {
      if (!res.success) {
        toast.error(res.error ?? "Error");
        setDisplay(anterior);
        setLocal(String(anterior));
      }
    });
  };

  if (readOnly) {
    return (
      <span className={className}>
        {display}
        {suffix}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "group inline-flex items-center gap-1 rounded-md px-1 -mx-1 tabular-nums transition-colors hover:bg-muted/60 focus:bg-muted/60 focus:outline-none",
          className,
        )}
        title="Click para editar"
      >
        <span>
          {display}
          {suffix}
        </span>
        <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60" />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setLocal(String(display));
            setEditing(false);
          }
        }}
        className="w-20 h-7 text-sm ring-2 ring-primary/40 animate-[pulse-edit_1.5s_ease-in-out_infinite]"
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </span>
  );
}
