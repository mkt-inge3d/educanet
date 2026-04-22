import { NextResponse } from "next/server";
import {
  asegurarAsignacionesMes,
  generarInstanciasSemana,
  generarInstanciasMes,
  isoWeek,
} from "@/lib/kpis/instancias-generador";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ahora = new Date();
  const mes = ahora.getMonth() + 1;
  const anio = ahora.getFullYear();
  const semana = isoWeek(ahora);
  const esDia1 = ahora.getDate() === 1;

  const asignaciones = await asegurarAsignacionesMes({ mes, anio });
  const semanales = await generarInstanciasSemana({ semana, mes, anio });
  const mensuales = esDia1
    ? await generarInstanciasMes({ mes, anio })
    : { instanciasCreadas: 0 };

  return NextResponse.json({
    ok: true,
    periodo: { mes, anio, semana },
    asegurarAsignaciones: asignaciones.asignacionesCreadas,
    instanciasSemanales: semanales.instanciasCreadas,
    instanciasMensuales: mensuales.instanciasCreadas,
    diaUnoDelMes: esDia1,
  });
}
