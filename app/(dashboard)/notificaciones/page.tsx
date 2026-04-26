import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { NotificacionesLista } from "./notificaciones-lista";

export const metadata = { title: "Notificaciones" };

async function obtenerNotificacionesUsuario(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("notificaciones", `notificaciones-${userId}`);
  return prisma.notificacion.findMany({
    where: { userId },
    orderBy: { fecha: "desc" },
    take: 50,
  });
}

export default async function NotificacionesPage() {
  const user = await requireAuth();

  const notificaciones = await obtenerNotificacionesUsuario(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Notificaciones</h1>
      <NotificacionesLista notificaciones={notificaciones} />
    </div>
  );
}
