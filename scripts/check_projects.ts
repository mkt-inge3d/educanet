import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const proyectos = await (prisma as any).workflowInstancia.findMany({
    select: { id: true, nombre: true, estadoGeneral: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
  console.log(`Total proyectos: ${proyectos.length}`)
  proyectos.forEach((p: any) => {
    console.log(`  [${p.estadoGeneral}] ${p.nombre} (${p.id.slice(0,8)}...) ${p.createdAt.toLocaleDateString()}`)
  })
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
