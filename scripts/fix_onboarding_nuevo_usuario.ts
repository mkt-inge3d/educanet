/**
 * Elimina las tareas de onboarding genéricas (sin workflowInstanciaId)
 * del usuario más reciente de cada puesto y le asigna las tareas reales
 * del workflow, copiando el estado actual del equipo.
 *
 * Uso: npx tsx scripts/fix_onboarding_nuevo_usuario.ts [email]
 * Si no se pasa email, busca el usuario creado más recientemente.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const emailArg = process.argv[2];

  const usuario = emailArg
    ? await prisma.user.findUnique({
        where: { email: emailArg },
        select: { id: true, nombre: true, apellido: true, email: true, puestoId: true },
      })
    : await prisma.user.findFirst({
        where: { rol: "TRABAJADOR", activo: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, nombre: true, apellido: true, email: true, puestoId: true },
      });

  if (!usuario) {
    console.log("Usuario no encontrado");
    await prisma.$disconnect(); await pool.end(); return;
  }

  console.log(`Usuario: ${usuario.nombre} ${usuario.apellido} (${usuario.email})`);
  console.log(`Puesto: ${usuario.puestoId}`);

  // 1. Eliminar tareas genéricas de onboarding (sin workflow)
  const eliminadas = await prisma.tareaInstancia.deleteMany({
    where: {
      asignadoAId: usuario.id,
      workflowInstanciaId: null,
    },
  });
  console.log(`Tareas genéricas eliminadas: ${eliminadas.count}`);

  // También eliminar tareas de workflow asignadas a este usuario
  // (si ya se ejecutó onboarding parcialmente)
  const eliminadasWf = await prisma.tareaInstancia.deleteMany({
    where: { asignadoAId: usuario.id },
  });
  console.log(`Tareas totales eliminadas (reset): ${eliminadasWf.count}`);

  if (!usuario.puestoId) {
    console.log("Sin puesto asignado, no se puede asignar tareas del workflow");
    await prisma.$disconnect(); await pool.end(); return;
  }

  // 2. Buscar usuario de referencia con el mismo puesto
  const ref = await prisma.user.findFirst({
    where: { puestoId: usuario.puestoId, id: { not: usuario.id }, activo: true },
    select: { id: true, nombre: true, apellido: true },
  });

  if (!ref) {
    console.log("No hay usuario de referencia con el mismo puesto");
    await prisma.$disconnect(); await pool.end(); return;
  }
  console.log(`Referencia: ${ref.nombre} ${ref.apellido}`);

  // 3. Obtener tareas del usuario de referencia en workflows
  const tareasRef = await prisma.tareaInstancia.findMany({
    where: {
      workflowInstanciaId: { not: null },
      asignadoAId: ref.id,
    },
    orderBy: [{ workflowInstanciaId: "asc" }, { ordenGantt: "asc" }],
  });

  console.log(`Tareas de referencia encontradas: ${tareasRef.length}`);

  if (tareasRef.length === 0) {
    console.log("Sin tareas de referencia en workflows");
    await prisma.$disconnect(); await pool.end(); return;
  }

  // 4. Primera pasada: crear tareas sin parentId
  const creadas = await Promise.all(
    tareasRef.map((ref) =>
      prisma.tareaInstancia.create({
        data: {
          workflowInstanciaId: ref.workflowInstanciaId,
          catalogoTareaId: ref.catalogoTareaId,
          asignadoAId: usuario.id,
          origen: "AUTO_WORKFLOW",
          estado: ref.estado,
          negocio: ref.negocio ?? undefined,
          fechaEstimadaInicio: ref.fechaEstimadaInicio,
          fechaEstimadaFin: ref.fechaEstimadaFin,
          puntosBrutos: ref.puntosBrutos,
          ordenGantt: ref.ordenGantt,
          duracionMinutos: ref.duracionMinutos ?? undefined,
          esHito: ref.esHito,
          baselineInicio: ref.baselineInicio ?? undefined,
          baselineFin: ref.baselineFin ?? undefined,
          baselineDuracion: ref.baselineDuracion ?? undefined,
          requiereValidacionJefe: false,
        },
        select: { id: true },
      })
    )
  );

  // 5. Segunda pasada: reasignar parentId
  const mapaIds = new Map<string, string>();
  tareasRef.forEach((t, i) => mapaIds.set(t.id, creadas[i].id));

  const conParent = tareasRef.filter((t) => t.parentId !== null);
  await Promise.all(
    conParent.map((t) => {
      const nuevoParent = mapaIds.get(t.parentId!);
      if (!nuevoParent) return Promise.resolve();
      return prisma.tareaInstancia.update({
        where: { id: mapaIds.get(t.id)! },
        data: { parentId: nuevoParent },
      });
    })
  );

  console.log(`✓ ${creadas.length} tareas del workflow asignadas a ${usuario.nombre}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
