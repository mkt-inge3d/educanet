import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ResolverReporteBoton } from "./resolver-reporte-boton";

async function obtenerReportesPendientes() {
  "use cache";
  cacheLife("minutes");
  cacheTag("reportes-comentarios");
  return prisma.reporteComentario.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { createdAt: "desc" },
    include: {
      comentario: {
        include: {
          user: {
            select: { id: true, nombre: true, apellido: true, avatarUrl: true },
          },
          leccion: {
            select: {
              slug: true,
              titulo: true,
              modulo: {
                select: { curso: { select: { slug: true, titulo: true } } },
              },
            },
          },
        },
      },
      reportador: { select: { id: true, nombre: true, apellido: true } },
    },
  });
}

async function obtenerReportesResueltos() {
  "use cache";
  cacheLife("minutes");
  cacheTag("reportes-comentarios");
  return prisma.reporteComentario.findMany({
    where: { estado: { in: ["APROBADO", "DESESTIMADO"] } },
    orderBy: { resueltoEn: "desc" },
    take: 50,
    include: {
      comentario: { select: { contenido: true, oculto: true } },
      reportador: { select: { nombre: true, apellido: true } },
      resueltoPor: { select: { nombre: true, apellido: true } },
    },
  });
}

export const metadata = { title: "Admin - Moderacion" };

export default async function ModeracionPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const [pendientes, resueltos] = await Promise.all([
    obtenerReportesPendientes(),
    obtenerReportesResueltos(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moderacion</h1>
        <p className="text-sm text-muted-foreground">
          Revisa comentarios reportados y decide si ocultarlos.
        </p>
      </div>

      <Tabs defaultValue="pendientes">
        <TabsList>
          <TabsTrigger value="pendientes">
            Pendientes ({pendientes.length})
          </TabsTrigger>
          <TabsTrigger value="resueltos">Resueltos</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="mt-4">
          {pendientes.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Nada pendiente por revisar.
            </Card>
          ) : (
            <div className="space-y-4">
              {pendientes.map((r) => {
                const iniciales =
                  `${r.comentario.user.nombre[0]}${r.comentario.user.apellido[0]}`.toUpperCase();
                return (
                  <Card key={r.id} className="p-5">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {r.comentario.user.avatarUrl && (
                          <AvatarImage src={r.comentario.user.avatarUrl} alt="" />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {iniciales}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">
                            {r.comentario.user.nombre}{" "}
                            {r.comentario.user.apellido}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            en{" "}
                            <Link
                              href={`/cursos/${r.comentario.leccion.modulo.curso.slug}/${r.comentario.leccion.slug}`}
                              className="hover:text-foreground underline"
                            >
                              {r.comentario.leccion.modulo.curso.titulo} /{" "}
                              {r.comentario.leccion.titulo}
                            </Link>
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
                          {r.comentario.contenido}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              Motivo ({r.reportador.nombre}{" "}
                              {r.reportador.apellido},{" "}
                              {formatDistanceToNow(new Date(r.createdAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                              ):
                            </span>{" "}
                            {r.razon}
                          </p>
                        </div>
                        <ResolverReporteBoton reporteId={r.id} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resueltos" className="mt-4">
          {resueltos.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Aun no hay reportes resueltos.
            </Card>
          ) : (
            <div className="space-y-3">
              {resueltos.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{r.comentario.contenido}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Reportado por {r.reportador.nombre}{" "}
                        {r.reportador.apellido} ·{" "}
                        {r.resueltoPor &&
                          `Resuelto por ${r.resueltoPor.nombre} ${r.resueltoPor.apellido}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        r.estado === "APROBADO" ? "destructive" : "outline"
                      }
                    >
                      {r.estado === "APROBADO" ? "Oculto" : "Desestimado"}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
