"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import { seedDefinicionWebinar } from "@/lib/process/actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function SeedProcesoWebinarButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSeed() {
    setLoading(true)
    try {
      const result = await seedDefinicionWebinar()
      if (result.ok) {
        toast.success(result.mensaje === "Ya existe"
          ? "El proceso webinar ya estaba cargado"
          : "Proceso webinar cargado exitosamente"
        )
        router.refresh()
      }
    } catch (err) {
      toast.error("Error al cargar el proceso webinar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSeed}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2 shrink-0"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Cargar Webinar
    </Button>
  )
}
