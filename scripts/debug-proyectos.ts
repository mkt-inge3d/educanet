import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL ?? ""
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Ver el proyecto danito con su responsable
  const danito = await prisma.workflowInstancia.findFirst({
    where: { nombre: { contains: "danito", mode: "insensitive" } },
    include: {
      responsableGeneral: { select: { id: true, nombre: true, apellido: true, email: true } },
      tareas: { select: { asignadoAId: true, asignadoA: { select: { nombre: true, apellido: true, email: true } } } },
    },
  })

  if (!danito) { console.log("No se encontró danito"); return }

  console.log("\n=== Proyecto danito ===")
  console.log(`ID: ${danito.id}`)
  console.log(`Estado: ${danito.estadoGeneral}`)
  console.log(`Responsable: ${danito.responsableGeneral.nombre} ${danito.responsableGeneral.apellido} (${danito.responsableGeneral.email})`)
  console.log(`ResponsableId: ${danito.responsableGeneral.id}`)
  console.log(`Tareas (${danito.tareas.length}):`)
  danito.tareas.forEach((t) => {
    console.log(`  - ${t.asignadoA.nombre} ${t.asignadoA.apellido} (${t.asignadoA.email}) id=${t.asignadoAId}`)
  })

  // Ver todos los usuarios con su puesto
  console.log("\n=== Todos los usuarios ===")
  const usuarios = await prisma.user.findMany({
    select: { id: true, nombre: true, apellido: true, email: true, puesto: { select: { nombre: true } } },
    orderBy: { apellido: "asc" },
  })
  usuarios.forEach((u) => {
    console.log(`  ${u.id}  ${u.nombre} ${u.apellido}  ${u.email}  (${u.puesto?.nombre ?? "sin puesto"})`)
  })

  // Simular la query de la página de proyectos para cada usuario y ver cuáles ven danito
  console.log("\n=== Quién ve danito con la query actual ===")
  for (const u of usuarios) {
    const visible = await prisma.workflowInstancia.findFirst({
      where: {
        id: danito.id,
        estadoGeneral: { in: ["ACTIVO", "PAUSADO"] },
        OR: [
          { tareas: { some: { asignadoAId: u.id } } },
          { responsableGeneralId: u.id },
        ],
      },
    })
    if (visible) console.log(`  ✓ ${u.nombre} ${u.apellido} (${u.email})`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
