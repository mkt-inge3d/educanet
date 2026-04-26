import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { obtenerRankingArea } from "@/lib/gamificacion/rankings";
import { LogrosHeader } from "@/components/logros/LogrosHeader";
import { TabMisBadges } from "@/components/logros/TabMisBadges";
import { TabRanking } from "@/components/logros/TabRanking";
import { TabHistorialPuntos } from "@/components/logros/TabHistorialPuntos";
import { TabRachas } from "@/components/logros/TabRachas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { puntosParaSiguienteNivel } from "@/lib/gamificacion/puntos";

export const metadata = { title: "Mis logros" };

async function obtenerDatosLogros(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("logros", `logros-${userId}`, "badges");
  const [allBadges, userBadges, transacciones, diasConActividad] =
    await Promise.all([
      prisma.badge.findMany({ orderBy: { orden: "asc" } }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { fechaObtencion: "desc" },
      }),
      prisma.transaccionPuntos.findMany({
        where: { userId },
        orderBy: { fecha: "desc" },
        take: 50,
      }),
      prisma.transaccionPuntos.findMany({
        where: { userId },
        select: { fecha: true },
        orderBy: { fecha: "desc" },
        take: 200,
      }),
    ]);
  return { allBadges, userBadges, transacciones, diasConActividad };
}

export default async function LogrosPage() {
  const user = await requireAuth();

  const [{ allBadges, userBadges, transacciones, diasConActividad }, ranking] =
    await Promise.all([
      obtenerDatosLogros(user.id),
      user.areaId && user.mostrarEnRanking
        ? obtenerRankingArea({
            areaId: user.areaId,
            userIdActual: user.id,
            metrica: "puntos_total",
          })
        : null,
    ]);

  const badgesObtenidosIds = new Set(userBadges.map((ub) => ub.badgeId));
  const nivelInfo = puntosParaSiguienteNivel(user.nivel, user.puntosTotales);

  // Build activity calendar
  const actividadDias = new Set(
    diasConActividad.map((t) =>
      new Date(t.fecha).toISOString().slice(0, 10)
    )
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <LogrosHeader
        puntosTotales={user.puntosTotales}
        badgesObtenidos={userBadges.length}
        totalBadges={allBadges.length}
        rachaActual={user.rachaActual}
        nivel={user.nivel}
        progresoNivel={nivelInfo.progreso}
      />

      <Tabs defaultValue="badges">
        <TabsList>
          <TabsTrigger value="badges">Mis badges</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="puntos">Puntos</TabsTrigger>
          <TabsTrigger value="rachas">Rachas</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="mt-6">
          <TabMisBadges
            allBadges={allBadges}
            badgesObtenidosIds={badgesObtenidosIds}
            userBadges={userBadges}
          />
        </TabsContent>

        <TabsContent value="ranking" className="mt-6">
          <TabRanking
            ranking={ranking}
            mostrarEnRanking={user.mostrarEnRanking}
            areaNombre={user.area?.nombre}
            areaId={user.areaId}
          />
        </TabsContent>

        <TabsContent value="puntos" className="mt-6">
          <TabHistorialPuntos transacciones={transacciones} />
        </TabsContent>

        <TabsContent value="rachas" className="mt-6">
          <TabRachas
            rachaActual={user.rachaActual}
            actividadDias={Array.from(actividadDias)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
