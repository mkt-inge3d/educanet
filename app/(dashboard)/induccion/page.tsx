import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { CONFIG_EMPRESA } from "@/lib/config/empresa";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { GraduationCap, Mail, HelpCircle, ArrowRight } from "lucide-react";

export const metadata = { title: "Induccion" };

async function obtenerCursoInduccion(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("induccion", `induccion-${userId}`);
  return prisma.curso.findUnique({
    where: { slug: "induccion-empresa" },
    include: {
      modulos: {
        include: {
          lecciones: {
            select: {
              id: true,
              progresos: {
                where: { userId },
                select: { completada: true },
              },
            },
          },
        },
      },
    },
  });
}

export default async function InduccionPage() {
  const user = await requireAuth();

  const curso = await obtenerCursoInduccion(user.id);

  let progreso = 0;
  let totalLecciones = 0;
  let completadas = 0;

  if (curso) {
    totalLecciones = curso.modulos.reduce(
      (acc, m) => acc + m.lecciones.length,
      0
    );
    completadas = curso.modulos.reduce(
      (acc, m) =>
        acc + m.lecciones.filter((l) => l.progresos[0]?.completada).length,
      0
    );
    progreso = totalLecciones > 0 ? Math.round((completadas / totalLecciones) * 100) : 0;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
        <GraduationCap className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-3xl font-bold">Bienvenid@, {user.nombre}</h1>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
          Nos da mucho gusto tenerte en el equipo. Aqui encontraras todo
          lo que necesitas para empezar con el pie derecho.
        </p>
      </div>

      {/* Mision, Vision, Valores */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 text-center">
          <h3 className="font-semibold text-primary mb-2">Mision</h3>
          <p className="text-sm text-muted-foreground">{CONFIG_EMPRESA.mision}</p>
        </Card>
        <Card className="p-5 text-center">
          <h3 className="font-semibold text-primary mb-2">Vision</h3>
          <p className="text-sm text-muted-foreground">{CONFIG_EMPRESA.vision}</p>
        </Card>
        <Card className="p-5 text-center">
          <h3 className="font-semibold text-primary mb-2">Valores</h3>
          <div className="flex flex-wrap justify-center gap-1">
            {CONFIG_EMPRESA.valores.map((v) => (
              <Badge key={v.titulo} variant="outline" className="text-xs">
                {v.titulo}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Curso de induccion */}
      {curso && (
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Tu curso de induccion</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {progreso === 100
                  ? "Has completado la induccion. Excelente!"
                  : `${completadas} de ${totalLecciones} lecciones completadas`}
              </p>
              <Progress value={progreso} className="h-2 mt-3 max-w-xs" />
            </div>
            <Button size="lg" render={<Link href="/cursos/induccion-empresa" />}>
              {progreso === 0
                ? "Comenzar"
                : progreso === 100
                  ? "Repasar"
                  : "Continuar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Contacto RRHH */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3">Personas clave</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{CONFIG_EMPRESA.contactoRRHH.nombre}</p>
            <p className="text-sm text-muted-foreground">{CONFIG_EMPRESA.contactoRRHH.email}</p>
            <p className="text-xs text-muted-foreground">{CONFIG_EMPRESA.contactoRRHH.horario}</p>
          </div>
        </div>
      </Card>

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Preguntas frecuentes</h2>
        <div className="space-y-2">
          {CONFIG_EMPRESA.faq.map((item) => (
            <details key={item.pregunta} className="group rounded-lg border">
              <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-medium">
                <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                {item.pregunta}
              </summary>
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                {item.respuesta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
