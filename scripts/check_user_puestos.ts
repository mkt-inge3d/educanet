import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as any) as any

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, nombre: true, apellido: true, email: true, rol: true, puestoId: true,
      puesto: { select: { id: true, nombre: true } } }
  })
  users.forEach((u: any) => {
    const puesto = u.puesto ? `${u.puesto.id} — ${u.puesto.nombre}` : 'sin puesto'
    console.log(`[${u.rol}] ${u.nombre} ${u.apellido} (${u.email}) → ${puesto}`)
  })
}
main().catch(console.error).finally(() => prisma.$disconnect())
