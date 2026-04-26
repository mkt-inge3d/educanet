import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { CursoNuevoForm } from "./curso-nuevo-form";

export const metadata = { title: "Admin - Crear curso" };

async function listarAreasSimple() {
  "use cache";
  cacheLife("hours");
  cacheTag("areas");
  return prisma.area.findMany({ orderBy: { nombre: "asc" } });
}

export default async function AdminCursoNuevoPage() {
  await requireRole(["ADMIN"]);
  const areas = await listarAreasSimple();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Crear nuevo curso</h1>
      <CursoNuevoForm areas={areas} />
    </div>
  );
}
