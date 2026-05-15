import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const puestos = await prisma.puesto.findMany({
    select: { id: true, nombre: true, areaId: true },
    orderBy: { nombre: "asc" },
  });
  console.log(JSON.stringify(puestos, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
