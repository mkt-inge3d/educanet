"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  fechaActual: string;
  hoy: string;
  basePath?: string;
  permitirFuturo?: boolean;
};

function formatearFechaLarga(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function sumarDias(iso: string, dias: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + dias);
  return date.toISOString().slice(0, 10);
}

export function SelectorFecha({
  fechaActual,
  hoy,
  basePath = "/mi-equipo/actividades",
  permitirFuturo = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const irA = (iso: string) => {
    if (!permitirFuturo && iso > hoy) return;
    startTransition(() => {
      router.replace(`${basePath}?fecha=${iso}`, { scroll: false });
    });
  };

  const esHoy = fechaActual === hoy;
  const ayer = sumarDias(hoy, -1);
  const manana = sumarDias(hoy, 1);
  const esAyer = fechaActual === ayer;
  const esManana = fechaActual === manana;
  const futuro = fechaActual > hoy;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-md border border-border bg-card">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Día anterior"
          onClick={() => irA(sumarDias(fechaActual, -1))}
          disabled={pending}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{formatearFechaLarga(fechaActual)}</span>
              </button>
            }
          />
          <PopoverContent align="center" className="w-auto p-3">
            <input
              type="date"
              value={fechaActual}
              max={permitirFuturo ? undefined : hoy}
              onChange={(e) => irA(e.target.value)}
              className="rounded border border-border bg-background px-2 py-1 text-sm"
              aria-label="Elegir fecha"
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Día siguiente"
          onClick={() => irA(sumarDias(fechaActual, 1))}
          disabled={pending || (!permitirFuturo && futuro)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant={esHoy ? "default" : "outline"}
          size="sm"
          onClick={() => irA(hoy)}
          disabled={pending}
        >
          Hoy
        </Button>
        {permitirFuturo ? (
          <Button
            variant={esManana ? "default" : "outline"}
            size="sm"
            onClick={() => irA(manana)}
            disabled={pending}
          >
            Mañana
          </Button>
        ) : (
          <Button
            variant={esAyer ? "default" : "outline"}
            size="sm"
            onClick={() => irA(ayer)}
            disabled={pending}
          >
            Ayer
          </Button>
        )}
      </div>
    </div>
  );
}
