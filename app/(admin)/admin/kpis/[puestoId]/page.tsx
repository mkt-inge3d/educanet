import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { DefinicionEditor } from "./definicion-editor";

export const metadata = { title: "Admin - Definiciones de KPI" };

export default async function AdminKpisPuestoPage({
  params,
}: {
  params: Promise<{ puestoId: string }>;
}) {
  await requireRole(["ADMIN", "RRHH"]);
  const { puestoId } = await params;

  const puesto = await prisma.puesto.findUnique({
    where: { id: puestoId },
    include: {
      area: { select: { nombre: true } },
      kpiDefiniciones: {
        where: { frecuencia: null },
        orderBy: { orden: "asc" },
      },
    },
  });
  if (!puesto) notFound();

  const total = puesto.kpiDefiniciones.reduce((s, d) => s + (d.peso ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/kpis"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver a KPIs
        </Link>
        <h1 className="text-2xl font-bold">{puesto.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          {puesto.area.nombre} · {puesto.kpiDefiniciones.length} KPIs · Peso
          total: <span className="font-medium text-foreground">{total}%</span>
          {total !== 100 && (
            <span className="ml-2 text-destructive">
              (debe sumar 100)
            </span>
          )}
        </p>
      </div>

      <Card className="p-5">
        <DefinicionEditor
          puestoId={puesto.id}
          definiciones={puesto.kpiDefiniciones.map((d) => ({
            id: d.id,
            codigo: d.codigo,
            nombre: d.nombre,
            descripcion: d.descripcion,
            unidad: d.unidad ?? "",
            peso: d.peso ?? 0,
            tipoMeta: (d.tipoMeta ?? "ABSOLUTA") as NonNullable<typeof d.tipoMeta>,
            valorObjetivoDefault: d.valorObjetivoDefault,
            bonusPorcentaje: d.bonusPorcentaje,
            activa: d.activa,
          }))}
        />
      </Card>
    </div>
  );
}
