import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingToggle } from "./OnboardingToggle";

export const metadata = { title: "Admin · Catálogo de tareas" };

const LABEL_CATEGORIA: Record<string, string> = {
  PRE_WEBINAR: "Pre-webinar",
  DURANTE_WEBINAR: "Día Webinar",
  POST_WEBINAR: "Post-webinar",
  SEO_RECURRENTE: "SEO recurrente",
  CAMPANA_META_ADS: "Meta Ads",
  COORDINACION_GENERAL: "Coordinación",
  DISENO: "Diseño",
  DESARROLLO_WEB: "Desarrollo Web",
  CONTENIDO: "Contenido",
  CONTENIDO_CURSOS: "Cursos",
};

async function obtenerCatalogoTareas() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogo-tareas");
  return prisma.catalogoTarea.findMany({
    include: {
      rolResponsable: { select: { nombre: true } },
      _count: { select: { checklistItems: true, instancias: true } },
    },
    orderBy: [{ categoria: "asc" }, { orden: "asc" }],
  });
}

export default async function AdminCatalogoTareasPage() {
  await requireRole(["ADMIN", "RRHH"]);

  const tareas = await obtenerCatalogoTareas();

  const porCategoria = new Map<string, typeof tareas>();
  for (const t of tareas) {
    const arr = porCategoria.get(t.categoria) ?? [];
    arr.push(t);
    porCategoria.set(t.categoria, arr);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo de tareas operativas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tareas.length} tareas estandarizadas. Marca las que deben asignarse
          automáticamente al registrarse un nuevo empleado.
        </p>
      </div>

      {Array.from(porCategoria.entries()).map(([cat, items]) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {LABEL_CATEGORIA[cat] ?? cat}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({items.length})
            </span>
          </h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-3 text-left">Código</th>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Responsable</th>
                    <th className="p-3 text-right">Tiempo</th>
                    <th className="p-3 text-right">Puntos</th>
                    <th className="p-3 text-right">Checklist</th>
                    <th className="p-3 text-right">Instancias</th>
                    <th className="p-3 text-center">Onboarding</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="p-3">
                        <code className="text-[11px] text-muted-foreground">
                          {t.codigo}
                        </code>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{t.nombre}</div>
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {t.tipoTrabajo}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs">{t.rolResponsable.nombre}</td>
                      <td className="p-3 text-right text-xs tabular-nums">
                        {t.tiempoMinimoMin}-{t.tiempoMaximoMin}min
                      </td>
                      <td className="p-3 text-right text-xs tabular-nums">
                        {t.puntosBase} +{t.bonusATiempo}
                        {t.bonusDesbloqueo > 0 && ` +${t.bonusDesbloqueo}`}
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground">
                        {t._count.checklistItems}
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground">
                        {t._count.instancias}
                      </td>
                      <td className="p-3 text-center">
                        <OnboardingToggle id={t.id} esOnboarding={t.esOnboarding} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}
