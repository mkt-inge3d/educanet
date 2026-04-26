import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

async function listarBadgesAdmin() {
  "use cache";
  cacheLife("hours");
  cacheTag("badges", "admin-badges");
  return prisma.badge.findMany({
    orderBy: { orden: "asc" },
    include: { _count: { select: { usuarios: true } } },
  });
}

export const metadata = { title: "Admin - Badges" };

export default async function AdminBadgesPage() {
  await requireRole(["ADMIN"]);

  const badges = await listarBadgesAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Badges</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b) => (
          <Card key={b.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{b.nombre}</p>
                <code className="text-xs text-muted-foreground">{b.codigo}</code>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{b.descripcion}</p>
            <div className="flex items-center justify-between text-xs">
              <Badge variant="outline">{b.criterioTipo}</Badge>
              <span className="text-muted-foreground">
                {b._count.usuarios} usuario{b._count.usuarios !== 1 ? "s" : ""}
              </span>
              <span className="text-primary font-medium">+{b.puntosRecompensa} pts</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
