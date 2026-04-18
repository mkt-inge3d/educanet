import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { RelacionadosEditor } from "./relacionados-editor";

export const metadata = { title: "Cursos relacionados" };

export default async function CursoRelacionadosPage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { cursoId } = await params;

  const curso = await prisma.curso.findUnique({
    where: { id: cursoId },
    select: { id: true, titulo: true, areaId: true },
  });
  if (!curso) notFound();

  const [relacionados, disponibles] = await Promise.all([
    prisma.cursoRelacionado.findMany({
      where: { cursoOrigenId: cursoId },
      orderBy: { orden: "asc" },
      include: {
        cursoDestino: {
          select: {
            id: true,
            titulo: true,
            slug: true,
            publicado: true,
            area: { select: { nombre: true } },
          },
        },
      },
    }),
    prisma.curso.findMany({
      where: {
        id: { not: cursoId },
        publicado: true,
      },
      select: {
        id: true,
        titulo: true,
        area: { select: { nombre: true } },
      },
      orderBy: { titulo: "asc" },
    }),
  ]);

  const idsRelacionados = new Set(relacionados.map((r) => r.cursoDestinoId));
  const opcionesDisponibles = disponibles.filter(
    (c) => !idsRelacionados.has(c.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/cursos"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver a cursos
        </Link>
        <h1 className="text-2xl font-bold">Cursos relacionados</h1>
        <p className="text-sm text-muted-foreground">
          Configura cursos sugeridos para <strong>{curso.titulo}</strong>. Si
          dejas esto vacio, se sugeriran automaticamente cursos de la misma
          area.
        </p>
      </div>

      <Card className="p-6">
        <RelacionadosEditor
          cursoOrigenId={cursoId}
          relacionados={relacionados.map((r) => ({
            cursoDestinoId: r.cursoDestinoId,
            orden: r.orden,
            titulo: r.cursoDestino.titulo,
            area: r.cursoDestino.area?.nombre ?? null,
            publicado: r.cursoDestino.publicado,
          }))}
          opciones={opcionesDisponibles.map((c) => ({
            id: c.id,
            titulo: c.titulo,
            area: c.area?.nombre ?? null,
          }))}
        />
      </Card>
    </div>
  );
}
