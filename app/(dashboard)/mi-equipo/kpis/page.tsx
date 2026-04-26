import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { obtenerEquipoIds } from "@/lib/kpis/jerarquia";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { CardPendienteValidacion } from "@/components/jefe/CardPendienteValidacion";
import { CardKpiEvaluadoPorJefe } from "@/components/jefe/CardKpiEvaluadoPorJefe";
import { EditorObjetivosRol } from "@/components/jefe/EditorObjetivosRol";

export const metadata = { title: "Validación de KPIs" };

async function obtenerDatosKpisEquipo(
  userId: string,
  areaId: string,
  mes: number,
  anio: number,
) {
  "use cache";
  cacheLife("minutes");
  cacheTag("kpis-validacion", `kpis-validacion-${userId}`);
  const equipoIds = await obtenerEquipoIds(userId);
  const [pendientes, asignacionesPorJefe, puestosConKpis] = await Promise.all([
    prisma.kpiRegistroSemanal.findMany({
      where: {
        asignacion: {
          userId: { in: equipoIds },
          periodoMes: mes,
          periodoAnio: anio,
        },
        estadoValidacion: "PENDIENTE",
      },
      include: {
        asignacion: {
          include: {
            user: { select: { id: true, nombre: true, apellido: true } },
            definicion: {
              select: { nombre: true, unidad: true, descripcion: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.kpiAsignacion.findMany({
      where: {
        userId: { in: equipoIds },
        periodoMes: mes,
        periodoAnio: anio,
        definicion: { tipoFuente: "EVALUADO_POR_JEFE" },
      },
      include: {
        user: { select: { id: true, nombre: true, apellido: true } },
        definicion: {
          select: { nombre: true, descripcion: true, unidad: true },
        },
        registros: { orderBy: { semanaDelAnio: "desc" }, take: 4 },
      },
    }),
    prisma.puesto.findMany({
      where: { areaId },
      include: {
        kpiDefiniciones: {
          where: { activa: true, frecuencia: null },
          orderBy: { orden: "asc" },
          select: {
            id: true,
            nombre: true,
            unidad: true,
            valorObjetivoDefault: true,
            peso: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    }),
  ]);
  return { pendientes, asignacionesPorJefe, puestosConKpis };
}

export default async function MiEquipoKpisPage() {
  const user = await requireAuth();

  const esJefe = user.puesto?.nombre?.startsWith("Jefe") ?? false;
  const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
  if (!esJefe && !esAdmin) redirect("/unauthorized");
  if (!user.areaId) redirect("/mi-progreso");

  const { mes, anio } = mesActual();

  const { pendientes, asignacionesPorJefe, puestosConKpis } =
    await obtenerDatosKpisEquipo(user.id, user.areaId, mes, anio);

  return (
    <div className="relative mx-auto max-w-4xl space-y-8">
      <section className="relative mb-2 overflow-hidden pb-4 pt-2">
        <HaloBackground variant="top" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {user.area?.nombre ?? "Área"} · {mes}/{anio}
          </p>
          <KineticTitle
            text="Validación de KPIs"
            as="h1"
            className="mt-1 text-3xl font-semibold tracking-tighter sm:text-4xl"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Valida los reportes de tu equipo y reporta los KPIs que te corresponden.
          </p>
        </div>
      </section>

      {pendientes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Pendientes de validación ({pendientes.length})
          </h2>
          <div className="space-y-3">
            {pendientes.map((p) => (
              <CardPendienteValidacion key={p.id} registro={p} />
            ))}
          </div>
        </section>
      )}

      {pendientes.length === 0 && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-600">
          Sin pendientes. Todo al día.
        </div>
      )}

      {asignacionesPorJefe.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">
              KPIs que tú reportas ({asignacionesPorJefe.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estos KPIs solo tú puedes reportarlos. Actualízalos semanalmente.
            </p>
          </div>
          <div className="space-y-3">
            {asignacionesPorJefe.map((a) => (
              <CardKpiEvaluadoPorJefe key={a.id} asignacion={a} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Objetivos del mes por rol</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ajusta el objetivo de un KPI para todo el rol. Se aplica al mes actual de inmediato.
          </p>
        </div>
        <EditorObjetivosRol
          puestos={puestosConKpis.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            kpiDefiniciones: p.kpiDefiniciones.map((k) => ({
              id: k.id,
              nombre: k.nombre,
              unidad: k.unidad ?? "%",
              valorObjetivoDefault: k.valorObjetivoDefault,
              peso: k.peso ?? 0,
            })),
          }))}
        />
      </section>
    </div>
  );
}
