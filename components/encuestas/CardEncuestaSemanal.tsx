"use client";

import { useState } from "react";
import { MessageCircleQuestion, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalEncuestaSemanal } from "./ModalEncuestaSemanal";

export function CardEncuestaSemanal({
  puede,
  yaRespondida,
  nombresKpis,
}: {
  puede: boolean;
  yaRespondida: boolean;
  nombresKpis: string[];
}) {
  const [abierto, setAbierto] = useState(false);

  if (yaRespondida) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <Check className="h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-sm">
          Gracias por tu feedback de esta semana
        </p>
      </div>
    );
  }

  if (!puede) return null;

  return (
    <>
      <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <MessageCircleQuestion className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Tu feedback semanal</h3>
          <p className="text-sm text-muted-foreground">
            3 preguntas · 30 segundos · +20 puntos
          </p>
        </div>
        <Button onClick={() => setAbierto(true)}>Responder</Button>
      </div>

      <ModalEncuestaSemanal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        nombresKpis={nombresKpis}
      />
    </>
  );
}
