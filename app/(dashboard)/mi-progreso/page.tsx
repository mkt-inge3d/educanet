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
import { BentoGrid, BentoItem } from "@/components/ui/primitives/BentoGrid";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";

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
    <div className="relative mx-auto max-w-6xl">
      <section className="relative mb-8 overflow-hidden pb-4 pt-2">
        <HaloBackground variant="top" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Mes de {MESES_ES[mes - 1]} {anio}
          </p>
          <KineticTitle
            text="Cómo voy"
            as="h1"
            className="mt-1 text-3xl font-semibold tracking-tighter sm:text-4xl"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Tu desempeño mensual, rango actual y próximas acciones.
          </p>
        </div>
      </section>

      <div className="space-y-6">
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

        {user.areaId && (
          <Suspense fallback={<Skeleton className="h-28 rounded-xl" />}>
            <SeccionBonusEquipo areaId={user.areaId} mes={mes} anio={anio} />
          </Suspense>
        )}

        <Suspense fallback={<Skeleton className="h-32 rounded-xl" />}>
          <CompromisosSemanaCard userId={user.id} />
        </Suspense>

        <BentoGrid>
          <BentoItem span="3x2">
            <Suspense fallback={<Skeleton className="h-full min-h-[240px] rounded-2xl" />}>
              <BreakdownXPFuentesWrapper userId={user.id} mes={mes} anio={anio} />
            </Suspense>
          </BentoItem>

          <BentoItem span="3x2">
            <Suspense fallback={<Skeleton className="h-full min-h-[240px] rounded-2xl" />}>
              <CardHitosKpiResumen userId={user.id} mes={mes} anio={anio} />
            </Suspense>
          </BentoItem>

          <BentoItem span="full">
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
          </BentoItem>

          <BentoItem span="full">
            <Suspense fallback={<Skeleton className="h-32 rounded-2xl" />}>
              <AccionesSugeridasWrapper userId={user.id} mes={mes} anio={anio} />
            </Suspense>
          </BentoItem>
        </BentoGrid>
      </div>
    </div>
  );
}

async function BreakdownXPFuentesWrapper({
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
    <BreakdownXPFuentes
      fuentes={progreso.fuentes}
      total={progreso.puntosTotales}
      multiplicadorAplicado={progreso.multiplicadorAplicado}
    />
  );
}

async function AccionesSugeridasWrapper({
  userId,
  mes,
  anio,
}: {
  userId: string;
  mes: number;
  anio: number;
}) {
  const progreso = await obtenerProgresoMes(userId, mes, anio);
  return <AccionesSugeridas progreso={progreso} />;
}
