import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const p = prisma as any
  
  const plantillas = await p.workflowPlantilla.findMany({ select: { id: true, codigo: true, nombre: true } })
  console.log(`WorkflowPlantillas (${plantillas.length}):`)
  plantillas.forEach((x: any) => console.log(`  [${x.id}] ${x.codigo} — ${x.nombre}`))
  
  const puestos = await p.puesto.findMany({ select: { id: true, nombre: true } })
  console.log(`\nPuestos (${puestos.length}):`)
  puestos.forEach((x: any) => console.log(`  [${x.id}] ${x.nombre}`))

  const catalogos = await p.catalogoTarea.findMany({ select: { id: true, codigo: true, nombre: true, categoria: true }, orderBy: { codigo: 'asc' } })
  console.log(`\nCatalogoTareas (${catalogos.length}):`)
  catalogos.forEach((x: any) => console.log(`  [${x.codigo}] ${x.nombre} (${x.categoria})`))

  const jefe = await p.user.findFirst({ where: { rol: 'ADMIN', email: { contains: 'jefe' } }, select: { id: true, nombre: true, email: true } })
  console.log(`\nJefe Marketing: ${JSON.stringify(jefe)}`)
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
