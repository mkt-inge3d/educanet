import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CursoPublicarSwitch } from "./curso-publicar-switch";

export const metadata = { title: "Admin - Cursos" };

export default async function AdminCursosPage() {
  await requireRole(["ADMIN"]);

  const cursos = await prisma.curso.findMany({
    orderBy: { orden: "asc" },
    include: {
      area: { select: { nombre: true } },
      _count: { select: { certificados: true } },
      modulos: { select: { _count: { select: { lecciones: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cursos</h1>
          <p className="text-sm text-muted-foreground">{cursos.length} cursos</p>
        </div>
        <Button render={<Link href="/admin/cursos/nuevo" />}>
          <Plus className="mr-2 h-4 w-4" />
          Crear curso
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Curso</th>
                <th className="px-4 py-3 text-left font-medium">Area</th>
                <th className="px-4 py-3 text-left font-medium">Nivel</th>
                <th className="px-4 py-3 text-right font-medium">Lecciones</th>
                <th className="px-4 py-3 text-right font-medium">Certificados</th>
                <th className="px-4 py-3 text-center font-medium">Publicado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((c) => {
                const totalLecciones = c.modulos.reduce(
                  (acc, m) => acc + m._count.lecciones,
                  0
                );
                return (
                  <tr key={c.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.titulo}</p>
                      <p className="text-xs text-muted-foreground">{c.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.area?.nombre ?? "General"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{c.nivel}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{totalLecciones}</td>
                    <td className="px-4 py-3 text-right">{c._count.certificados}</td>
                    <td className="px-4 py-3 text-center">
                      <CursoPublicarSwitch cursoId={c.id} publicado={c.publicado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          render={<Link href={`/admin/cursos/${c.id}`} />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          render={<Link href={`/admin/cursos/${c.id}/relacionados`} />}
                        >
                          Relacionados
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
