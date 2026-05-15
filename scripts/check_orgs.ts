import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const orgs = await (prisma as any).organization.findMany({
    select: {
      id: true,
      nombre: true,
      slug: true,
      _count: { select: { users: true, catalogoTareas: true, workflowInstancias: true } },
    },
  })
  console.log('=== ORGANIZACIONES ===')
  orgs.forEach((o: any) => {
    console.log(`${o.nombre} [${o.slug}]`)
    console.log(`  id: ${o.id}`)
    console.log(`  users: ${o._count.users}, catalogo: ${o._count.catalogoTareas}, workflows: ${o._count.workflowInstancias}`)
  })

  console.log('\n=== USUARIOS SIN ORG ===')
  const sinOrg = await (prisma as any).user.findMany({
    where: { organizationId: null },
    select: { id: true, email: true, nombre: true, apellido: true, createdAt: true, areaId: true, puestoId: true },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`Total: ${sinOrg.length}`)
  sinOrg.forEach((u: any) => {
    console.log(`  - ${u.nombre} ${u.apellido} (${u.email}) — area=${u.areaId} puesto=${u.puestoId} — ${u.createdAt.toISOString().slice(0,10)}`)
  })
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
