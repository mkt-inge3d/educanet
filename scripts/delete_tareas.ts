import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  // Borrar dependencias primero
  const deps = await (prisma as any).dependenciaInstancia.deleteMany({})
  console.log(`DependenciaInstancia eliminadas: ${deps.count}`)

  // Borrar checklist items marcados
  const checks = await (prisma as any).checklistItemMarcado.deleteMany({})
  console.log(`ChecklistItemMarcado eliminados: ${checks.count}`)

  // Borrar todas las tareas
  const tareas = await (prisma as any).tareaInstancia.deleteMany({})
  console.log(`TareaInstancia eliminadas: ${tareas.count}`)
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
