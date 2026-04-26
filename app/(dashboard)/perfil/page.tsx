import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NivelBadge } from "@/components/shared/NivelBadge";
import { PerfilInfoForm } from "./perfil-info-form";
import { PerfilSeguridad } from "./perfil-seguridad";
import { PerfilNotificaciones } from "./perfil-notificaciones";
import { PerfilPrivacidad } from "./perfil-privacidad";
import { PerfilAvatarUpload } from "./perfil-avatar-upload";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Mi perfil" };

async function obtenerContadoresUsuario(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("logros", `logros-${userId}`, "certificados", `certificados-${userId}`);
  return Promise.all([
    prisma.userBadge.count({ where: { userId } }),
    prisma.certificado.count({ where: { userId } }),
  ]);
}

export default async function PerfilPage() {
  const user = await requireAuth();

  const [badgesCount, certCount] = await obtenerContadoresUsuario(user.id);

  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();
  const antiguedad = user.fechaIngreso
    ? formatDistanceToNow(new Date(user.fechaIngreso), { locale: es })
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.nombre} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <PerfilAvatarUpload />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{user.nombre} {user.apellido}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {user.puesto && <Badge variant="outline">{user.puesto.nombre}</Badge>}
              {user.area && <Badge variant="outline">{user.area.nombre}</Badge>}
              <NivelBadge nivel={user.nivel} size="sm" />
            </div>
            {antiguedad && (
              <p className="mt-2 text-xs text-muted-foreground">
                {antiguedad} con nosotros
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold">{user.puntosTotales}</p>
              <p className="text-xs text-muted-foreground">Puntos</p>
            </div>
            <div>
              <p className="text-xl font-bold">{badgesCount}</p>
              <p className="text-xs text-muted-foreground">Badges</p>
            </div>
            <div>
              <p className="text-xl font-bold">{certCount}</p>
              <p className="text-xs text-muted-foreground">Certificados</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="privacidad">Privacidad</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <PerfilInfoForm
            nombre={user.nombre}
            apellido={user.apellido}
            bio={user.bio}
            email={user.email}
            puestoNombre={user.puesto?.nombre}
            areaNombre={user.area?.nombre}
          />
        </TabsContent>

        <TabsContent value="seguridad" className="mt-4">
          <PerfilSeguridad />
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-4">
          <PerfilNotificaciones
            preferencias={user.preferenciasEmail as Record<string, { app: boolean; email: boolean }> | null}
          />
        </TabsContent>

        <TabsContent value="privacidad" className="mt-4">
          <PerfilPrivacidad mostrarEnRanking={user.mostrarEnRanking} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
