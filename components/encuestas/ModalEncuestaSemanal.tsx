"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircleQuestion, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { responderEncuesta } from "@/lib/encuestas/actions";

const PREGUNTAS = [
  {
    key: "justiciaKpis" as const,
    titulo: "Que tan justos sentiste tus KPIs esta semana?",
    labels: ["Muy injustos", "Muy justos"],
  },
  {
    key: "motivacionSistema" as const,
    titulo: "Te motivo el sistema esta semana?",
    labels: ["Nada", "Mucho"],
  },
  {
    key: "claridadProgreso" as const,
    titulo: "Entendiste claramente tu progreso?",
    labels: ["Nada claro", "Muy claro"],
  },
];

export function ModalEncuestaSemanal({
  abierto,
  onCerrar,
  nombresKpis,
}: {
  abierto: boolean;
  onCerrar: () => void;
  nombresKpis: string[];
}) {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState("");
  const [kpiMasJusto, setKpiMasJusto] = useState("");
  const [kpiMenosJusto, setKpiMenosJusto] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setPaso(0);
    setRespuestas({});
    setComentario("");
    setKpiMasJusto("");
    setKpiMenosJusto("");
  };

  const pregActual = PREGUNTAS[paso];
  const enPregunta = paso < PREGUNTAS.length;
  const valorSelecciondo = enPregunta
    ? respuestas[pregActual.key]
    : null;

  const siguiente = () => {
    if (enPregunta && !valorSelecciondo) return;
    setPaso((p) => p + 1);
  };

  const enviar = () => {
    if (
      !respuestas.justiciaKpis ||
      !respuestas.motivacionSistema ||
      !respuestas.claridadProgreso
    ) {
      toast.error("Responde las 3 preguntas");
      return;
    }
    startTransition(async () => {
      const res = await responderEncuesta({
        justiciaKpis: respuestas.justiciaKpis,
        motivacionSistema: respuestas.motivacionSistema,
        claridadProgreso: respuestas.claridadProgreso,
        comentario: comentario.trim() || undefined,
        kpiMasJusto: kpiMasJusto.trim() || undefined,
        kpiMenosJusto: kpiMenosJusto.trim() || undefined,
      });
      if (res.success) {
        toast.success(`Gracias! +${res.data?.puntosGanados} pts`);
        reset();
        onCerrar();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onCerrar();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-4 w-4 text-primary" />
            Tu feedback semanal
          </DialogTitle>
          <DialogDescription>
            Tu jefe NUNCA ve respuestas individuales, solo promedios del
            equipo. Se honesto.
          </DialogDescription>
        </DialogHeader>

        {enPregunta && (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">
              Pregunta {paso + 1} de {PREGUNTAS.length}
            </p>
            <h4 className="text-base font-semibold">{pregActual.titulo}</h4>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setRespuestas((r) => ({ ...r, [pregActual.key]: n }))
                  }
                  className={cn(
                    "h-12 w-12 rounded-full border-2 text-lg font-medium transition-all hover:scale-105",
                    valorSelecciondo === n
                      ? "scale-110 border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>{pregActual.labels[0]}</span>
              <span>{pregActual.labels[1]}</span>
            </div>
          </div>
        )}

        {!enPregunta && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Opcional: ayudanos a entender mejor
            </p>

            {nombresKpis.length > 0 && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Que KPI sentiste MAS justo?
                  </label>
                  <select
                    value={kpiMasJusto}
                    onChange={(e) => setKpiMasJusto(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Ninguno en especial —</option>
                    {nombresKpis.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Que KPI sentiste MENOS justo?
                  </label>
                  <select
                    value={kpiMenosJusto}
                    onChange={(e) => setKpiMenosJusto(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Ninguno en especial —</option>
                    {nombresKpis.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium">
                Algo que quieras compartir?
              </label>
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tu jefe solo ve promedios del equipo, nunca tu respuesta individual."
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {enPregunta ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  reset();
                  onCerrar();
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={siguiente}
                disabled={!valorSelecciondo || isPending}
              >
                Siguiente
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setPaso(PREGUNTAS.length - 1)}
                disabled={isPending}
              >
                Atras
              </Button>
              <Button onClick={enviar} disabled={isPending}>
                <Check className="mr-1 h-3 w-3" />
                {isPending ? "Enviando..." : "Enviar feedback (+20 pts)"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
