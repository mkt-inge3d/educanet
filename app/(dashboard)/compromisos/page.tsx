import Link from "next/link";
import { CheckSquare, Target } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import { listarCompromisosPorEstado } from "@/lib/compromisos/queries";
import { obtenerHitosUsuario } from "@/lib/kpis/hitos-queries";
import { CompromisosCliente } from "@/components/compromisos/CompromisosCliente";
import { HitosKanban } from "@/components/kpis/hitos/HitosKanban";
import { cn } from "@/lib/utils";

export const metadata = { title: "Compromisos" };

type SearchParams = { tab?: string };

export default async function CompromisosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireAuth();
  const { tab } = await searchParams;
  const tabActiva: "compromisos" | "hitos" =
    tab === "hitos" ? "hitos" : "compromisos";

  const { mes, anio } = mesActual();

  const [compromisos, hitos] = await Promise.all([
    listarCompromisosPorEstado(user.id),
    obtenerHitosUsuario(user.id, mes, anio),
  ]);

  const totalHitosPendientes =
    hitos.cantidadPorEstado.pendiente + hitos.cantidadPorEstado.rechazado;
  const totalCompromisosPendientes =
    compromisos.pendientes.length +
    compromisos.propuestas.length +
    compromisos.porValidar.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-1 border-b">
        <TabLink
          href="/compromisos"
          activa={tabActiva === "compromisos"}
          icono={<CheckSquare className="h-4 w-4" />}
          label="Compromisos"
          contador={totalCompromisosPendientes}
        />
        <TabLink
          href="/compromisos?tab=hitos"
          activa={tabActiva === "hitos"}
          icono={<Target className="h-4 w-4" />}
          label="Hitos KPI"
          contador={totalHitosPendientes}
        />
      </div>

      {tabActiva === "compromisos" ? (
        <CompromisosCliente
          propuestas={compromisos.propuestas}
          pendientes={compromisos.pendientes}
          porValidar={compromisos.porValidar}
          completados={compromisos.completados}
          noCumplidos={compromisos.noCumplidos}
        />
      ) : (
        <div>
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">Mis hitos KPI</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.puesto?.nombre ?? "Sin puesto"} · Tu jefe valida cada
              evidencia y los puntos suben al instante.
            </p>
          </div>
          <HitosKanban progreso={hitos} />
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  activa,
  icono,
  label,
  contador,
}: {
  href: string;
  activa: boolean;
  icono: React.ReactNode;
  label: string;
  contador: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        activa
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {icono}
      {label}
      {contador > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
            activa ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {contador}
        </span>
      )}
    </Link>
  );
}
