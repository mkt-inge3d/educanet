import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Admin - Usuarios" };

const rolColors: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary",
  RRHH: "bg-amber-500/10 text-amber-600",
  TRABAJADOR: "bg-muted text-muted-foreground",
};

async function listarTodosUsuarios() {
  "use cache";
  cacheLife("minutes");
  cacheTag("admin-usuarios");
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      puesto: { select: { nombre: true } },
      area: { select: { nombre: true } },
    },
  });
}

export default async function AdminUsuariosPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const usuarios = await listarTodosUsuarios();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            {usuarios.length} usuarios registrados
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                <th className="px-4 py-3 text-left font-medium">Rol</th>
                <th className="px-4 py-3 text-left font-medium">Puesto</th>
                <th className="px-4 py-3 text-left font-medium">Area</th>
                <th className="px-4 py-3 text-right font-medium">Puntos</th>
                <th className="px-4 py-3 text-right font-medium">Nivel</th>
                <th className="px-4 py-3 text-left font-medium">Actividad</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const initials = `${u.nombre[0]}${u.apellido[0]}`.toUpperCase();
                return (
                  <tr key={u.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/usuarios/${u.id}`} className="flex items-center gap-3 hover:text-primary">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.nombre} {u.apellido}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={rolColors[u.rol]}>
                        {u.rol}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.puesto?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.area?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {u.puntosTotales}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.nivel}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {u.ultimaActividad
                        ? formatDistanceToNow(new Date(u.ultimaActividad), { addSuffix: true, locale: es })
                        : "Sin actividad"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={u.activo ? "text-success" : "text-destructive"}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </Badge>
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
