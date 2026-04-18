import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluarYOtorgarBonusEquipo } from "@/lib/piloto/bonus-equipo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Evalua el mes que recien termino (dia 1 del mes siguiente)
  const hoy = new Date();
  const mesAnterior = hoy.getMonth(); // 0-11, pero mes anterior en 1-12 es hoy.getMonth()
  let mes = mesAnterior === 0 ? 12 : mesAnterior;
  let anio = hoy.getFullYear();
  if (mesAnterior === 0) anio = anio - 1;
  // Ajuste: si estamos en enero (mes 1), el mes anterior es diciembre del anio previo
  // hoy.getMonth() = 0 (enero) -> mes anterior = 12, anio -= 1
  if (hoy.getMonth() === 0) {
    mes = 12;
    anio = hoy.getFullYear() - 1;
  } else {
    mes = hoy.getMonth();
    anio = hoy.getFullYear();
  }

  const configs = await prisma.configuracionPiloto.findMany({
    where: { activo: true },
    select: { areaId: true },
  });

  const resultados = [];
  for (const c of configs) {
    const r = await evaluarYOtorgarBonusEquipo({
      areaId: c.areaId,
      mes,
      anio,
    });
    resultados.push({ areaId: c.areaId, ...r });
  }

  return NextResponse.json({
    ok: true,
    evaluado: { mes, anio },
    resultados,
  });
}
