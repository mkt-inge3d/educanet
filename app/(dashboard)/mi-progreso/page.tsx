import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import { obtenerProgresoMes } from "@/lib/kpis/mi-progreso-queries";
import { puedeResponderEncuesta } from "@/lib/encuestas/queries";
import { prisma } from "@/lib/prisma";
import { RangoActualDestacado } from "@/components/mi-progreso/RangoActualDestacado";
import { BreakdownXPFuentes } from "@/components/mi-progreso/BreakdownXPFuentes";
import { CumplimientoKPIsResumen } from "@/components/mi-progreso/CumplimientoKPIsResumen";
import { AccionesSugeridas } from "@/components/mi-progreso/AccionesSugeridas";
import { MisionesSemana } from "@/components/mi-progreso/MisionesSemana";
import { CardEncuestaSemanal } from "@/components/encuestas/CardEncuestaSemanal";
import { SeccionBonusEquipo } from "@/components/piloto/SeccionBonusEquipo";

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

      {user.areaId && (
        <SeccionBonusEquipo areaId={user.areaId} mes={mes} anio={anio} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownXPFuentes
          fuentes={progreso.fuentes}
          total={progreso.puntosTotales}
          multiplicadorAplicado={progreso.multiplicadorAplicado}
        />
        <CumplimientoKPIsResumen
          cumplimientos={progreso.cumplimientos}
          cumplimientoGlobal={progreso.cumplimientoKpis}
          hayDatosSuficientes={progreso.hayDatosSuficientesKpis}
        />
      </div>

      <MisionesSemana userId={user.id} />

      <AccionesSugeridas progreso={progreso} />
    </div>
  );
}
