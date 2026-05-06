"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { marcarComoDefault, eliminarCalendario } from "@/lib/calendarios/actions"

export function AccionesCalendario({
  id,
  esDefault,
  tieneProyectos,
}: {
  id: string
  esDefault: boolean
  tieneProyectos: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDefault() {
    setLoading(true)
    await marcarComoDefault(id)
    router.refresh()
    setLoading(false)
  }

  async function handleEliminar() {
    if (!confirm("¿Eliminar este calendario? Esta acción no se puede deshacer.")) return
    setLoading(true)
    const res = await eliminarCalendario(id)
    if (res.error) {
      alert(res.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" disabled={loading} />}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!esDefault && (
          <DropdownMenuItem onClick={handleDefault}>
            <Star className="mr-2 h-4 w-4" />
            Marcar como default
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleEliminar}
          disabled={tieneProyectos}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {tieneProyectos ? "En uso (no se puede eliminar)" : "Eliminar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
