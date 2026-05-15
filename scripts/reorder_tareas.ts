import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as any) as any

async function main() {
  const proyectos = await prisma.workflowInstancia.findMany({ select: { id: true, nombre: true } })

  let total = 0
  for (const proy of proyectos) {
    // Obtener todas las tareas del proyecto ordenadas por fechaEstimadaInicio asc
    const tareas = await prisma.tareaInstancia.findMany({
      where: { workflowInstanciaId: proy.id },
      orderBy: [{ fechaEstimadaInicio: 'asc' }, { fechaEstimadaFin: 'asc' }],
      select: { id: true },
    })

    // Asignar ordenGantt = posición en ese orden (1, 2, 3, ...)
    for (let i = 0; i < tareas.length; i++) {
      await prisma.tareaInstancia.update({
        where: { id: tareas[i].id },
        data: { ordenGantt: i + 1 },
      })
    }
    total += tareas.length
    console.log(`✓ ${proy.nombre}: ${tareas.length} tareas reordenadas`)
  }
  console.log(`\nTotal actualizado: ${total} tareas`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
