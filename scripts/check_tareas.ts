import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const total = await (prisma as any).tareaInstancia.count()
  const porEstado = await (prisma as any).tareaInstancia.groupBy({
    by: ['estado'],
    _count: { id: true }
  })
  console.log(`Total TareaInstancia: ${total}`)
  porEstado.forEach((g: any) => console.log(`  ${g.estado}: ${g._count.id}`))
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
