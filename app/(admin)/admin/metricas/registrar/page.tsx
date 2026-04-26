import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { MetricaRegistrarForm } from "./metrica-registrar-form";

export const metadata = { title: "Admin - Registrar metrica" };

async function listarUsuariosActivos() {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-usuarios");
  return prisma.user.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, apellido: true, email: true },
  });
}

export default async function RegistrarMetricaPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const usuarios = await listarUsuariosActivos();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Registrar metrica</h1>
      <MetricaRegistrarForm usuarios={usuarios} />
    </div>
  );
}
