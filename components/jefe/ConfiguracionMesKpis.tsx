"use client";

import { useState, useTransition } from "react";
import { Loader2, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  marcarNoAplica,
  revertirNoAplica,
  configurarCantidadMes,
} from "@/lib/kpis/hitos-actions";
import type { ItemConfiguracion } from "@/lib/kpis/hitos-queries";

type Props = {
  items: ItemConfiguracion[];
};

export function ConfiguracionMesKpis({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        No hay KPIs condicionales o configurables este mes.
      </div>
    );
  }
  // Agrupar por usuario
  const porUser = new Map<string, ItemConfiguracion[]>();
  for (const it of items) {
    const k = it.user.id;
    const list = porUser.get(k) ?? [];
    list.push(it);
    porUser.set(k, list);
  }

  return (
    <div className="space-y-6">
      {Array.from(porUser.entries()).map(([userId, lista]) => (
        <div key={userId}>
          <h3 className="mb-2 text-sm font-semibold">
            {lista[0].user.nombre} {lista[0].user.apellido}
          </h3>
          <div className="space-y-2">
            {lista.map((item) => (
              <ItemConfig key={item.asignacionMesId} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemConfig({ item }: { item: ItemConfiguracion }) {
  const [motivo, setMotivo] = useState("");
  const [cantidad, setCantidad] = useState(
    item.cantidadMes ?? item.cantidadMaxMes ?? 1
  );
  const [isPending, startTransition] = useTransition();
  const [mostrarMotivo, setMostrarMotivo] = useState(false);

  function aplicarNoAplica() {
    if (!motivo.trim()) {
      setMostrarMotivo(true);
      toast.error("Necesitas un motivo");
      return;
    }
    startTransition(async () => {
      const r = await marcarNoAplica({
        asignacionMesId: item.asignacionMesId,
        motivo: motivo.trim(),
      });
      if (!r.success) toast.error(r.error ?? "Error");
      else toast.success("Marcado como No aplica. Puntos redistribuidos.");
    });
  }

  function revertir() {
    startTransition(async () => {
      const r = await revertirNoAplica({
        asignacionMesId: item.asignacionMesId,
      });
      if (!r.success) toast.error(r.error ?? "Error");
      else toast.success("Revertido. Distribucion recalculada.");
    });
  }

  function aplicarCantidad() {
    startTransition(async () => {
      const r = await configurarCantidadMes({
        asignacionMesId: item.asignacionMesId,
        cantidad,
      });
      if (!r.success) toast.error(r.error ?? "Error");
      else toast.success(`Cantidad del mes configurada: ${cantidad}`);
    });
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-muted-foreground">
            {item.codigo}
          </p>
          <p className="text-sm font-medium">{item.nombre}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.frecuencia} · {item.puntos} pts max
          </p>
        </div>
        {item.noAplica ? (
          <Badge variant="outline" className="gap-1">
            <Ban className="h-3 w-3" /> No aplica
          </Badge>
        ) : null}
      </div>

      {item.noAplica && item.motivoNoAplica && (
        <p className="mt-2 rounded bg-muted/40 p-2 text-xs italic">
          {item.motivoNoAplica}
        </p>
      )}

      {/* Configurar cantidad para condicionales con cantidadMaxMes */}
      {item.cantidadMaxMes && !item.noAplica && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Cantidad este mes:</span>
          <Input
            type="number"
            min={0}
            max={item.cantidadMaxMes}
            value={cantidad}
            onChange={(e) => setCantidad(parseInt(e.target.value || "0"))}
            className="h-7 w-20"
          />
          <span className="text-xs text-muted-foreground">/ {item.cantidadMaxMes}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={aplicarCantidad}
            disabled={isPending}
            className="ml-auto"
          >
            Guardar
          </Button>
        </div>
      )}

      {/* Marcar No aplica solo para condicionales */}
      {item.esCondicional && (
        <div className="mt-3">
          {item.noAplica ? (
            <Button
              size="sm"
              variant="outline"
              onClick={revertir}
              disabled={isPending}
              className="gap-1"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Revertir No aplica
            </Button>
          ) : (
            <>
              {mostrarMotivo && (
                <Textarea
                  placeholder="Motivo (visible al empleado)..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  className="mb-2"
                />
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!mostrarMotivo) setMostrarMotivo(true);
                  else aplicarNoAplica();
                }}
                disabled={isPending}
                className="gap-1"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Ban className="h-3 w-3" />
                )}
                {mostrarMotivo ? "Confirmar No aplica" : "Marcar No aplica"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
