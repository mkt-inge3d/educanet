import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mesActual } from "@/lib/gamificacion/periodo";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { mes, anio } = mesActual();

  const usuarios = await prisma.user.findMany({
    where: { puestoId: { not: null }, activo: true },
    include: {
      puesto: {
        include: {
          kpiDefiniciones: { where: { activa: true } },
        },
      },
    },
  });

  let totalAsignaciones = 0;
  let usuariosProcesados = 0;
  let errores = 0;

  for (const user of usuarios) {
    if (!user.puesto) continue;
    try {
      for (const definicion of user.puesto.kpiDefiniciones) {
        await prisma.kpiAsignacion.upsert({
          where: {
            userId_definicionId_periodoMes_periodoAnio: {
              userId: user.id,
              definicionId: definicion.id,
              periodoMes: mes,
              periodoAnio: anio,
            },
          },
          create: {
            userId: user.id,
            definicionId: definicion.id,
            periodoMes: mes,
            periodoAnio: anio,
            valorObjetivo: definicion.valorObjetivoDefault ?? 100,
          },
          update: {},
        });
        totalAsignaciones++;
      }
      usuariosProcesados++;
    } catch (error) {
      console.error(`Error asignando KPIs a user ${user.email}:`, error);
      errores++;
    }
  }

  return NextResponse.json({
    ok: true,
    mes,
    anio,
    usuariosProcesados,
    totalAsignaciones,
    errores,
  });
}
