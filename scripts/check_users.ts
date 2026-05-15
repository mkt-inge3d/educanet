import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const users = await (prisma as any).user.findMany({
    select: { id: true, nombre: true, apellido: true, email: true, rol: true },
    orderBy: { createdAt: 'asc' }
  })
  console.log(`Total usuarios: ${users.length}\n`)
  users.forEach((u: any) => {
    console.log(`[${u.rol}] ${u.nombre} ${u.apellido} — ${u.email}`)
  })
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
