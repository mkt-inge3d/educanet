import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generarMisionesEquipo,
  vencerMisionesVencidas,
} from "@/lib/misiones/generador";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const vencidas = await vencerMisionesVencidas();

  const areas = await prisma.area.findMany({ select: { id: true } });
  const resultados = await Promise.all(
    areas.map((a) => generarMisionesEquipo(a.id))
  );
  const totalGeneradas = resultados.reduce(
    (s, r) => s + r.totalGeneradas,
    0
  );
  const usuarios = resultados.reduce((s, r) => s + r.usuarios, 0);

  return NextResponse.json({
    ok: true,
    vencidas: vencidas.vencidas,
    generadas: totalGeneradas,
    usuarios,
  });
}
