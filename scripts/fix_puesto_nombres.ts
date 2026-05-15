import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  await prisma.puesto.update({
    where: { id: "puesto-disenador" },
    data: { nombre: "Diseñador Gráfico" },
  });

  await prisma.puesto.update({
    where: { id: "puesto-eventos" },
    data: { nombre: "Coordinador de Eventos" },
  });

  await prisma.puesto.update({
    where: { id: "puesto-trafficker" },
    data: { nombre: "Trafficker / SEO" },
  });

  console.log("Puestos actualizados:");
  const puestos = await prisma.puesto.findMany({
    where: {
      id: { in: ["puesto-disenador", "puesto-eventos", "puesto-content-manager", "puesto-trafficker"] },
    },
    select: { id: true, nombre: true },
  });
  console.log(JSON.stringify(puestos, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
