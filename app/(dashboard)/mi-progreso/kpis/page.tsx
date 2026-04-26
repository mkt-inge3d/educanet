import { requireAuth } from "@/lib/auth";
import { mesActual, getSemanaISO } from "@/lib/gamificacion/periodo";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { LeyendaTipos } from "@/components/kpis/LeyendaTipos";
import { KpiCardEmpleado } from "@/components/kpis/KpiCardEmpleado";
import type { TipoFuenteKpi } from "@prisma/client";

export const metadata = { title: "Mis KPIs" };

const SECCIONES: Array<{
  tipo: TipoFuenteKpi;
  titulo: string;
  descripcion: string;
  permiteEditar: boolean;
}> = [
  {
    tipo: "AUTO_REPORTADO",
    titulo: "Tú reportas",
    descripcion: "Reportas el valor semanalmente. Tu jefe valida.",
    permiteEditar: true,
  },
  {
    tipo: "AUTO_CALCULADO",
    titulo: "Auto-calculados",
    descripcion: "El sistema los calcula cada semana. No requieren acción tuya.",
    permiteEditar: false,
  },
  {
    tipo: "EVALUADO_POR_JEFE",
    titulo: "Evaluados por tu jefe",
    descripcion: "Tu jefe los reporta basado en su observación directa.",
    permiteEditar: false,
  },
];

async function obtenerAsignacionesKpi(userId: string, mes: number, anio: number) {
  "use cache";
  cacheLife("minutes");
  cacheTag("kpis", `kpis-${userId}`);
  return prisma.kpiAsignacion.findMany({
    where: { userId, periodoMes: mes, periodoAnio: anio },
    include: {
      definicion: true,
      registros: {
        orderBy: { semanaDelAnio: "desc" },
        take: 4,
      },
    },
    orderBy: { definicion: { orden: "asc" } },
  });
}

export default async function MiProgresoKpisPage() {
  const user = await requireAuth();
  const { mes, anio } = mesActual();
  const { semana } = getSemanaISO(new Date());

  const asignaciones = await obtenerAsignacionesKpi(user.id, mes, anio);

  const porTipo = (tipo: TipoFuenteKpi) =>
    asignaciones.filter((a) => a.definicion.tipoFuente === tipo);

  return (
    <div className="relative mx-auto max-w-4xl space-y-8">
      <section className="relative mb-2 overflow-hidden pb-4 pt-2">
        <HaloBackground variant="top" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {mes}/{anio} · semana {semana}
          </p>
          <KineticTitle
            text="Mis KPIs"
            as="h1"
            className="mt-1 text-3xl font-semibold tracking-tighter sm:text-4xl"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Tus métricas del mes agrupadas por tipo.
          </p>
        </div>
      </section>

      <LeyendaTipos />

      {SECCIONES.map(({ tipo, titulo, descripcion, permiteEditar }) => {
        const items = porTipo(tipo);
        if (items.length === 0) return null;
        return (
          <section key={tipo} className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">{titulo}</h2>
              <p className="text-xs text-muted-foreground">{descripcion}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((a) => (
                <KpiCardEmpleado
                  key={a.id}
                  asignacionId={a.id}
                  nombre={a.definicion.nombre}
                  descripcion={a.definicion.descripcion}
                  unidad={a.definicion.unidad ?? ""}
                  valorObjetivo={a.valorObjetivo}
                  tipoMeta={a.definicion.tipoMeta!}
                  tipoFuente={a.definicion.tipoFuente}
                  fuenteDeDato={a.definicion.fuenteDeDato}
                  funcionCalculo={a.definicion.funcionCalculo}
                  registros={a.registros}
                  semanaActual={semana}
                  anioActual={anio}
                  permiteEditar={permiteEditar}
                />
              ))}
            </div>
          </section>
        );
      })}

      {asignaciones.length === 0 && (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          No tienes KPIs asignados para este mes.
        </div>
      )}
    </div>
  );
}
