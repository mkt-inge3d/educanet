import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Crea (o actualiza) los puestos y usuarios reales del piloto de Marketing,
 * conviviendo con los placeholders del seed-piloto-marketing.ts.
 *
 * Pre-requisito: los usuarios deben existir en Supabase Auth con estos emails.
 */

const PUESTOS_REALES = [
  {
    id: "puesto-asistente-planificacion",
    nombre: "Asistente de Planificacion",
    nivel: 1,
    descripcion:
      "Coordinacion de webinars y eventos del area, calendario maestro y reportes.",
    orden: 15,
  },
];

const USUARIOS_REALES = [
  {
    email: "hector@semco.local",
    nombre: "Hector",
    apellido: "Diseñador",
    puestoNombre: "Disenador Grafico",
  },
  {
    email: "nadia@semco.local",
    nombre: "Nadia",
    apellido: "Content",
    puestoNombre: "Content Manager",
  },
  {
    email: "pamela@semco.local",
    nombre: "Pamela",
    apellido: "Planificacion",
    puestoNombre: "Asistente de Planificacion",
  },
  {
    email: "claudia@semco.local",
    nombre: "Claudia",
    apellido: "Trafficker",
    puestoNombre: "Trafficker / SEO / SEM",
  },
];

async function main() {
  console.log("Sembrando puestos y usuarios reales del piloto...\n");

  const marketing = await prisma.area.findUnique({
    where: { nombre: "Marketing" },
    select: { id: true },
  });
  if (!marketing) {
    console.error("Area Marketing no existe. Corre db:seed primero.");
    process.exit(1);
  }

  // 1. Puestos nuevos
  for (const p of PUESTOS_REALES) {
    await prisma.puesto.upsert({
      where: { id: p.id },
      create: { ...p, areaId: marketing.id },
      update: { ...p, areaId: marketing.id },
    });
  }
  console.log(`  Puestos reales: ${PUESTOS_REALES.length} sembrados`);

  // 2. Usuarios reales (matchear por email; si no existen en BD, salta)
  let asignados = 0;
  const faltantes: string[] = [];
  for (const u of USUARIOS_REALES) {
    const user = await prisma.user.findUnique({
      where: { email: u.email },
    });
    if (!user) {
      faltantes.push(u.email);
      continue;
    }
    const puesto = await prisma.puesto.findFirst({
      where: { nombre: u.puestoNombre, areaId: marketing.id },
      select: { id: true },
    });
    if (!puesto) {
      console.warn(`  Puesto "${u.puestoNombre}" no existe.`);
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        puestoId: puesto.id,
        areaId: marketing.id,
        nombre: u.nombre,
        apellido: u.apellido,
      },
    });
    asignados++;
  }

  console.log(`  Usuarios reales asignados: ${asignados}/${USUARIOS_REALES.length}`);
  if (faltantes.length) {
    console.log(`  Faltan en Supabase Auth (creales primero):`);
    faltantes.forEach((e) => console.log(`    - ${e}`));
  }

  console.log("\nListo.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
