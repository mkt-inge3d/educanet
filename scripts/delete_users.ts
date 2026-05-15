import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

const EMAILS_ELIMINAR = [
  'jesus2@gmail.com', 'mariadelbarrio@gmail.com', 'javier@gmail.com',
  'zenosama@gmail.com', 'esmith@gmail.com', 'daniel@gmail.com',
  'darwin.sva.97@gmail.com', 'e2e.test@educanet.local', 'soypuromarketing@gmail.com',
  'soytuyo@gmail.com', 'santos@gmail.com', 'luis@gmail.com',
  'test@gmail.com', 'claudia@gmail.com',
]

async function main() {
  const p = prisma as any

  const usuarios = await p.user.findMany({
    where: { email: { in: EMAILS_ELIMINAR } },
    select: { id: true }
  })
  const ids = usuarios.map((u: any) => u.id)

  // Borrar KpiRegistroSemanal donde reportadoPorId sea uno de los usuarios
  const kpiRegs = await p.kpiRegistroSemanal.deleteMany({
    where: { reportadoPorId: { in: ids } }
  })
  console.log(`KpiRegistroSemanal eliminados: ${kpiRegs.count}`)

  // Proyectos con responsable a eliminar
  const proyectosAfectados = await p.workflowInstancia.findMany({
    where: { responsableGeneralId: { in: ids } },
    select: { id: true, nombre: true }
  })
  if (proyectosAfectados.length > 0) {
    await p.workflowInstancia.deleteMany({
      where: { id: { in: proyectosAfectados.map((w: any) => w.id) } }
    })
    console.log(`WorkflowInstancia eliminados: ${proyectosAfectados.length}`)
  }

  // Eliminar usuarios (cascade limpia el resto)
  const deleted = await p.user.deleteMany({
    where: { email: { in: EMAILS_ELIMINAR } }
  })
  console.log(`Usuarios eliminados: ${deleted.count}`)

  // Usuarios restantes
  const restantes = await p.user.findMany({
    select: { nombre: true, apellido: true, email: true, rol: true },
    orderBy: { rol: 'asc' }
  })
  console.log(`\nUsuarios restantes (${restantes.length}):`)
  restantes.forEach((u: any) => console.log(`  [${u.rol}] ${u.nombre} ${u.apellido} — ${u.email}`))
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
