import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }) })

async function main() {
  // Usuario Jefe Marketing
  const jefe = await prisma.user.findFirst({
    where: { id: "d8b3f5ac-b3b4-418e-89c8-17cb5548e779" },
    select: { id: true, nombre: true, apellido: true, email: true },
  })
  console.log("Usuario Jefe Marketing:", jefe)

  // Todos los proyectos ACTIVO/PAUSADO y quién es responsable
  const todos = await prisma.workflowInstancia.findMany({
    where: { estadoGeneral: { in: ["ACTIVO", "PAUSADO"] } },
    select: {
      id: true,
      nombre: true,
      estadoGeneral: true,
      responsableGeneralId: true,
      responsableGeneral: { select: { nombre: true, apellido: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  console.log(`\nTotal proyectos ACTIVO/PAUSADO: ${todos.length}`)
  todos.forEach((p) => {
    const esResponsable = p.responsableGeneralId === jefe?.id ? " ← JEFE ES RESPONSABLE" : ""
    console.log(`  "${p.nombre}" | estado: ${p.estadoGeneral} | responsable: ${p.responsableGeneral.nombre} ${p.responsableGeneral.apellido}${esResponsable}`)
  })

  // Simulación exacta de la query de la página para el jefe
  if (jefe) {
    const visibles = await prisma.workflowInstancia.findMany({
      where: {
        estadoGeneral: { in: ["ACTIVO", "PAUSADO"] },
        OR: [
          { tareas: { some: { asignadoAId: jefe.id } } },
          { responsableGeneralId: jefe.id },
        ],
      },
      select: { nombre: true },
    })
    console.log(`\nProyectos visibles para Jefe Marketing con la query actual:`)
    visibles.forEach((p) => console.log(`  ✓ "${p.nombre}"`))
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
