/**
 * Script de uso único: reasigna el responsableGeneralId de un proyecto
 * por nombre al usuario que tenga un puesto que contenga "Jefe de Marketing"
 *
 * Uso:
 *   npx tsx scripts/fix-proyecto-responsable.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL ?? ""
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Encontrar el proyecto "danito" (búsqueda case-insensitive)
  const workflow = await prisma.workflowInstancia.findFirst({
    where: { nombre: { contains: "danito", mode: "insensitive" } },
    select: { id: true, nombre: true, responsableGeneralId: true },
  })

  if (!workflow) {
    console.log("No se encontró ningún proyecto con nombre 'danito'.")
    process.exit(1)
  }

  console.log(`Proyecto encontrado: "${workflow.nombre}" (${workflow.id})`)
  console.log(`Responsable actual: ${workflow.responsableGeneralId}`)

  // Encontrar el usuario jefe de marketing
  const jefe = await prisma.user.findFirst({
    where: { puesto: { nombre: { contains: "Marketing", mode: "insensitive" } } },
    select: { id: true, nombre: true, apellido: true, puesto: { select: { nombre: true } } },
  })

  if (!jefe) {
    console.log("No se encontró usuario con puesto de Marketing.")
    // Listar todos los usuarios con su puesto para elegir manualmente
    const todos = await prisma.user.findMany({
      select: { id: true, nombre: true, apellido: true, puesto: { select: { nombre: true } } },
      orderBy: { apellido: "asc" },
    })
    console.log("\nUsuarios disponibles:")
    todos.forEach((u) => console.log(`  ${u.id}  ${u.nombre} ${u.apellido}  (${u.puesto?.nombre ?? "sin puesto"})`))
    process.exit(1)
  }

  console.log(`\nNuevo responsable: ${jefe.nombre} ${jefe.apellido} — ${jefe.puesto?.nombre}`)

  await prisma.workflowInstancia.update({
    where: { id: workflow.id },
    data: { responsableGeneralId: jefe.id },
  })

  console.log("✓ Responsable actualizado correctamente.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
