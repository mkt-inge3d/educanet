import { prisma } from "@/lib/prisma"
import { cacheLife, cacheTag } from "next/cache"

export async function listarCalendarios() {
  "use cache"
  cacheLife("minutes")
  cacheTag("calendarios")
  return prisma.calendarioLaboral.findMany({
    include: {
      _count: { select: { feriados: true, proyectos: true } },
    },
    orderBy: [{ esDefault: "desc" }, { nombre: "asc" }],
  })
}

export async function obtenerCalendario(id: string) {
  "use cache"
  cacheLife("minutes")
  cacheTag("calendarios", `calendario-${id}`)
  return prisma.calendarioLaboral.findUnique({
    where: { id },
    include: {
      feriados: { orderBy: { fecha: "asc" } },
      _count: { select: { proyectos: true } },
    },
  })
}
