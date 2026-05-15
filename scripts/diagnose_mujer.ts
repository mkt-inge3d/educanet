import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const u = await (prisma as any).user.findFirst({
    where: { email: 'mujer@gmail.com' },
    include: { puesto: true, area: true },
  })

  if (!u) {
    console.log('Usuario mujer@gmail.com NO existe en DB')
    return
  }

  console.log('=== USUARIO ===')
  console.log(`id: ${u.id}`)
  console.log(`nombre: ${u.nombre} ${u.apellido}`)
  console.log(`email: ${u.email}`)
  console.log(`activo: ${u.activo}`)
  console.log(`puestoId: ${u.puestoId}`)
  console.log(`puesto.nombre: ${u.puesto?.nombre}`)
  console.log(`areaId: ${u.areaId}`)
  console.log(`area.nombre: ${u.area?.nombre}`)
  console.log(`organizationId: ${u.organizationId}`)

  const tareasUser = await (prisma as any).tareaInstancia.count({
    where: { asignadoAId: u.id },
  })
  console.log(`\nTareas YA asignadas a la usuaria: ${tareasUser}`)

  if (!u.puestoId) {
    console.log('\n!!! No tiene puesto, la action retornaria error explicito.')
    return
  }

  const otros = await (prisma as any).user.findMany({
    where: {
      puestoId: u.puestoId,
      organizationId: u.organizationId,
      id: { not: u.id },
      activo: true,
    },
    select: { id: true, nombre: true, apellido: true, email: true },
  })

  console.log(`\n=== USUARIOS REFERENCIA (mismo puesto y org, activos, otros) ===`)
  console.log(`Cantidad: ${otros.length}`)
  otros.forEach((o: any) => console.log(`  - ${o.nombre} ${o.apellido} (${o.email})`))

  if (otros.length === 0) {
    console.log('\n!!! BUG: no hay usuario de referencia. asignarTareasOnboarding retorna silencioso.')
  }

  const referencia = await (prisma as any).user.findFirst({
    where: {
      puestoId: u.puestoId,
      organizationId: u.organizationId,
      id: { not: u.id },
      activo: true,
    },
  })

  if (referencia) {
    const tareasRef = await (prisma as any).tareaInstancia.count({
      where: {
        asignadoAId: referencia.id,
        organizationId: u.organizationId,
        workflowInstanciaId: { not: null },
      },
    })
    console.log(`\nTareas EN WORKFLOWS de la referencia ${referencia.email}: ${tareasRef}`)
  }

  const catalogo = await (prisma as any).catalogoTarea.count({
    where: { rolResponsableId: u.puestoId, activa: true },
  })
  console.log(`\n=== CATALOGO ===`)
  console.log(`CatalogoTarea activas para puestoId ${u.puestoId}: ${catalogo}`)

  const muestraCat = await (prisma as any).catalogoTarea.findMany({
    where: { rolResponsableId: u.puestoId, activa: true },
    select: { codigo: true, nombre: true, esOnboarding: true, categoria: true },
    take: 5,
  })
  muestraCat.forEach((c: any) => {
    console.log(`  [${c.esOnboarding ? 'ONB' : '   '}] ${c.codigo} — ${c.nombre} (${c.categoria})`)
  })
}

main().catch(console.error).finally(() => (prisma as any).$disconnect())
