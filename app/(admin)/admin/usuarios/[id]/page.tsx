import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsuarioInfoForm } from "./usuario-info-form";
import { UsuarioGamificacion } from "./usuario-gamificacion";
import { BotonOnboarding } from "./BotonOnboarding";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin - Detalle de usuario" };

async function obtenerDatosUsuarioAdmin(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-usuarios", `usuario-${id}`);
  const usuario = await prisma.user.findUnique({
    where: { id },
    include: {
      puesto: true,
      area: true,
      _count: {
        select: { certificados: true, badges: true, progresos: { where: { completada: true } } },
      },
    },
  });
  if (!usuario) return null;
  const [areas, puestos, badges, userBadges, transacciones] = await Promise.all([
    prisma.area.findMany({ orderBy: { nombre: "asc" } }),
    prisma.puesto.findMany({ orderBy: { nombre: "asc" }, include: { area: { select: { nombre: true } } } }),
    prisma.badge.findMany({ orderBy: { orden: "asc" } }),
    prisma.userBadge.findMany({
      where: { userId: id },
      include: { badge: true },
      orderBy: { fechaObtencion: "desc" },
    }),
    prisma.transaccionPuntos.findMany({
      where: { userId: id },
      orderBy: { fecha: "desc" },
      take: 20,
    }),
  ]);
  return { usuario, areas, puestos, badges, userBadges, transacciones };
}

export default async function AdminUsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(["ADMIN", "RRHH"]);

  const datos = await obtenerDatosUsuarioAdmin(id);
  if (!datos) notFound();

  const { usuario, areas, puestos, badges, userBadges, transacciones } = datos;
  const initials = `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/admin/usuarios" />}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a usuarios
      </Button>

      {/* Header */}
      <Card className="flex items-center gap-4 p-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-primary text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{usuario.nombre} {usuario.apellido}</h1>
          <p className="text-sm text-muted-foreground">{usuario.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{usuario.rol}</Badge>
            <Badge variant="outline">{usuario.activo ? "Activo" : "Inactivo"}</Badge>
            {usuario.puesto && <Badge variant="outline">{usuario.puesto.nombre}</Badge>}
          </div>
          <div className="mt-3">
            <BotonOnboarding userId={usuario.id} />
          </div>
        </div>
        <div className="text-right text-sm">
          <p><strong>{usuario.puntosTotales}</strong> puntos</p>
          <p>Nivel <strong>{usuario.nivel}</strong></p>
          <p>{usuario._count.certificados} certificados</p>
        </div>
      </Card>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="gamificacion">Gamificacion</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <UsuarioInfoForm
            usuario={usuario}
            areas={areas}
            puestos={puestos}
          />
        </TabsContent>

        <TabsContent value="gamificacion" className="mt-4">
          <UsuarioGamificacion
            userId={id}
            badges={badges}
            userBadges={userBadges}
            transacciones={transacciones}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
