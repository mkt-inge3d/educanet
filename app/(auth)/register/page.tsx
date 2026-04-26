import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Crear cuenta" };

async function obtenerAreasConPuestos() {
  "use cache";
  cacheLife("hours");
  cacheTag("areas", "puestos");
  return prisma.area.findMany({
    orderBy: { nombre: "asc" },
    include: {
      puestos: {
        where: { NOT: { nombre: { startsWith: "Jefe" } } },
        orderBy: [{ nivel: "asc" }, { orden: "asc" }],
        select: { id: true, nombre: true, nivel: true },
      },
    },
  });
}

export default async function RegisterPage() {
  const areas = await obtenerAreasConPuestos();

  const areasConPuestos = areas
    .filter((a) => a.puestos.length > 0)
    .map((a) => ({
      id: a.id,
      nombre: a.nombre,
      puestos: a.puestos,
    }));

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Unete a Educanet
        </h1>
        <p className="text-sm text-muted-foreground">
          Crea tu cuenta y comienza tu camino de crecimiento profesional
        </p>
      </div>

      <RegisterForm areas={areasConPuestos} />
    </div>
  );
}
