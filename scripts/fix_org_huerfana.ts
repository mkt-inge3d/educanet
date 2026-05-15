import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const sinOrg = await (prisma as any).user.findMany({
    where: { organizationId: null, activo: true },
    select: { id: true, email: true, nombre: true, apellido: true, areaId: true },
  })

  if (sinOrg.length === 0) {
    console.log('No hay usuarios sin organizationId. Nada que hacer.')
    return
  }

  console.log(`Encontrados ${sinOrg.length} usuarios sin org. Asignando...`)

  for (const u of sinOrg) {
    const ref =
      (await (prisma as any).user.findFirst({
        where: {
          areaId: u.areaId,
          organizationId: { not: null },
          activo: true,
        },
        select: { organizationId: true },
      })) ??
      (await (prisma as any).user.findFirst({
        where: { organizationId: { not: null }, activo: true },
        select: { organizationId: true },
      }))

    if (!ref?.organizationId) {
      console.log(`  ! ${u.email}: no se encontro org de referencia`)
      continue
    }

    await (prisma as any).user.update({
      where: { id: u.id },
      data: { organizationId: ref.organizationId },
    })
    console.log(`  + ${u.email} -> org ${ref.organizationId}`)
  }

  const restantes = await (prisma as any).user.count({
    where: { organizationId: null, activo: true },
  })
  console.log(`\nUsuarios sin org despues del fix: ${restantes}`)
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
