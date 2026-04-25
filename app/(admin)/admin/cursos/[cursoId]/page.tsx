import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Video } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoUrlEditor } from "./VideoUrlEditor";

export const metadata = { title: "Admin - Editor de curso" };

export default async function AdminCursoEditorPage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { cursoId } = await params;

  const curso = await prisma.curso.findUnique({
    where: { id: cursoId },
    include: {
      modulos: {
        orderBy: { orden: "asc" },
        include: {
          lecciones: {
            orderBy: { orden: "asc" },
            select: {
              id: true,
              titulo: true,
              tipo: true,
              orden: true,
              bunnyVideoId: true,
              videoUrl: true,
            },
          },
        },
      },
    },
  });

  if (!curso) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/admin/cursos" />}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{curso.titulo}</h1>
          <p className="text-sm text-muted-foreground">
            {curso.slug} · {curso.modulos.length} módulos
          </p>
        </div>
      </div>

      {curso.modulos.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Este curso no tiene módulos todavía.
          </CardContent>
        </Card>
      )}

      {curso.modulos.map((modulo) => (
        <Card key={modulo.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Módulo {modulo.orden}: {modulo.titulo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {modulo.lecciones.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin lecciones.</p>
            )}
            {modulo.lecciones.map((leccion) => (
              <div
                key={leccion.id}
                className="flex flex-col gap-3 rounded-lg border p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground w-6">
                    {leccion.orden}.
                  </span>
                  <p className="flex-1 text-sm font-medium">{leccion.titulo}</p>
                  <Badge variant="outline" className="text-xs">
                    {leccion.tipo}
                  </Badge>
                </div>

                {leccion.tipo === "VIDEO" && (
                  <VideoUrlEditor
                    leccionId={leccion.id}
                    currentUrl={leccion.videoUrl}
                    hasBunny={!!leccion.bunnyVideoId}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
