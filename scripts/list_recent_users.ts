import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, nombre: true, apellido: true, email: true, puestoId: true, rol: true, createdAt: true },
  });

  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
