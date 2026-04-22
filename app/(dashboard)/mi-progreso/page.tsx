import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import { obtenerProgresoMes } from "@/lib/kpis/mi-progreso-queries";
import { puedeResponderEncuesta } from "@/lib/encuestas/queries";
import { prisma } from "@/lib/prisma";
import { RangoActualDestacado } from "@/components/mi-progreso/RangoActualDestacado";
import { BreakdownXPFuentes } from "@/components/mi-progreso/BreakdownXPFuentes";
import { CardHitosKpiResumen } from "@/components/mi-progreso/CardHitosKpiResumen";
import { AccionesSugeridas } from "@/components/mi-progreso/AccionesSugeridas";
import { MisionesSemana } from "@/components/mi-progreso/MisionesSemana";
import { CardEncuestaSemanal } from "@/components/encuestas/CardEncuestaSemanal";
import { SeccionBonusEquipo } from "@/components/piloto/SeccionBonusEquipo";
import { CompromisosSemanaCard } from "@/components/mi-progreso/CompromisosSemanaCard";
import { Skeleton } from "@/components/ui/skeleton";

const MESES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const metadata = { title: "Mi progreso" };

async function BreakdownYCumplimiento({
  userId,
  mes,
  anio,
}: {
  userId: string;
  mes: number;
  anio: number;
}) {
  const progreso = await obtenerProgresoMes(userId, mes, anio);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownXPFuentes
          fuentes={progreso.fuentes}
          total={progreso.puntosTotales}
          multiplicadorAplicado={progreso.multiplicadorAplicado}
        />
        <CardHitosKpiResumen userId={userId} mes={mes} anio={anio} />
      </div>
      <AccionesSugeridas progreso={progreso} />
    </>
  );
}

export default async function MiProgresoPage() {
  const user = await requireAuth();
  const { mes, anio } = mesActual();

  // Criticos para el header: rango + encuesta + nombres de KPIs
  const [progreso, encuestaCheck, kpisUser] = await Promise.all([
    obtenerProgresoMes(user.id, mes, anio),
    puedeResponderEncuesta(user.id),
    prisma.kpiAsignacion.findMany({
      where: { userId: user.id, periodoMes: mes, periodoAnio: anio },
      select: { definicion: { select: { nombre: true } } },
    }),
  ]);

  const nombresKpis = kpisUser.map((k) => k.definicion.nombre);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Mes de {MESES_ES[mes - 1]} {anio}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Como voy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu desempeno mensual, rango actual y proximas acciones.
        </p>
      </div>

      <CardEncuestaSemanal
        puede={encuestaCheck.puede}
        yaRespondida={encuestaCheck.yaRespondida ?? false}
        nombresKpis={nombresKpis}
      />

      <RangoActualDestacado
        rango={progreso.rangoActual}
        puntos={progreso.puntosTotales}
        siguienteRango={progreso.siguienteRango}
        puntosParaSiguiente={progreso.puntosParaSiguiente}
        porcentajeAlSiguiente={progreso.porcentajeAlSiguiente}
        diasRestantes={progreso.diasRestantes}
      />

      {/* Cards secundarias: streaming para no bloquear el rango */}
      {user.areaId && (
        <Suspense fallback={<Skeleton className="h-28 rounded-xl" />}>
          <SeccionBonusEquipo areaId={user.areaId} mes={mes} anio={anio} />
        </Suspense>
      )}

      <Suspense fallback={<Skeleton className="h-32 rounded-xl" />}>
        <CompromisosSemanaCard userId={user.id} />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        }
      >
        <BreakdownYCumplimiento userId={user.id} mes={mes} anio={anio} />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        }
      >
        <MisionesSemana userId={user.id} />
      </Suspense>
    </div>
  );
}
