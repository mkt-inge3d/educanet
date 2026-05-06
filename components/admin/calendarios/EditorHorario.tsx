"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HorarioSemanal } from "@/lib/calendarios/schemas"

const DIAS: { key: keyof HorarioSemanal; label: string }[] = [
  { key: "lun", label: "Lunes" },
  { key: "mar", label: "Martes" },
  { key: "mie", label: "Miércoles" },
  { key: "jue", label: "Jueves" },
  { key: "vie", label: "Viernes" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
]

interface EditorHorarioProps {
  value: HorarioSemanal
  onChange: (horario: HorarioSemanal) => void
}

export function EditorHorario({ value, onChange }: EditorHorarioProps) {
  function addSlot(dia: keyof HorarioSemanal) {
    const slots = value[dia]
    const lastFin = slots.length > 0 ? slots[slots.length - 1].fin : "09:00"
    const [h, m] = lastFin.split(":").map(Number)
    const newInicio = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    const newFin = `${String(h + 2).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    onChange({
      ...value,
      [dia]: [...slots, { inicio: newInicio, fin: newFin }],
    })
  }

  function removeSlot(dia: keyof HorarioSemanal, idx: number) {
    onChange({
      ...value,
      [dia]: value[dia].filter((_, i) => i !== idx),
    })
  }

  function updateSlot(
    dia: keyof HorarioSemanal,
    idx: number,
    field: "inicio" | "fin",
    val: string
  ) {
    const slots = [...value[dia]]
    slots[idx] = { ...slots[idx], [field]: val }
    onChange({ ...value, [dia]: slots })
  }

  return (
    <div className="divide-y rounded-lg border">
      {DIAS.map(({ key, label }) => {
        const slots = value[key]
        const esLaboral = slots.length > 0

        return (
          <div
            key={key}
            className={cn(
              "flex items-start gap-4 px-4 py-3",
              !esLaboral && "opacity-60"
            )}
          >
            <div className="w-24 shrink-0">
              <span className="text-sm font-medium">{label}</span>
              {!esLaboral && (
                <span className="block text-[10px] text-muted-foreground">No laboral</span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {slots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={slot.inicio}
                    onChange={(e) => updateSlot(key, idx, "inicio", e.target.value)}
                    className="h-8 w-28 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <Input
                    type="time"
                    value={slot.fin}
                    onChange={(e) => updateSlot(key, idx, "fin", e.target.value)}
                    className="h-8 w-28 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSlot(key, idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => addSlot(key)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Turno
            </Button>
          </div>
        )
      })}
    </div>
  )
}
