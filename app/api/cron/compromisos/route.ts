import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { procesarEvento } from "@/lib/gamificacion/motor";

const PUNTOS_A_TIEMPO_AUTO = 20;
const PUNTOS_CON_RETRASO = 10;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const hace7Dias = new Date();
  hace7Dias.setDate(hace7Dias.getDate() - 7);

  const paraAutoValidar = await prisma.compromiso.findMany({
    where: {
      estado: "CUMPLIDO_AUTO",
      fechaCumplimiento: { lte: hace7Dias },
    },
    select: {
      id: true,
      userId: true,
      titulo: true,
      fechaCumplimiento: true,
      fechaLimite: true,
    },
  });

  let autoValidados = 0;
  for (const c of paraAutoValidar) {
    const aTiempo =
      c.fechaCumplimiento!.getTime() <= c.fechaLimite.getTime();
    const puntos = aTiempo ? PUNTOS_A_TIEMPO_AUTO : PUNTOS_CON_RETRASO;
    await prisma.compromiso.update({
      where: { id: c.id },
      data: {
        estado: "CUMPLIDO",
        validadoEn: new Date(),
        validacionComentario: "Auto-validado tras 7 dias sin revision",
        puntosOtorgados: puntos,
      },
    });
    await procesarEvento({
      userId: c.userId,
      tipo: "COMPROMISO_CUMPLIDO",
      fuente: "COMPROMISOS",
      puntosBrutos: puntos,
      referenciaId: c.id,
      descripcion: `Compromiso auto-validado: ${c.titulo}`,
    });
    autoValidados++;
  }

  const ahora = new Date();
  const atrasadosRes = await prisma.compromiso.updateMany({
    where: {
      estado: "PENDIENTE",
      fechaLimite: { lt: ahora },
    },
    data: { estado: "ATRASADO" },
  });

  return NextResponse.json({
    ok: true,
    autoValidados,
    atrasados: atrasadosRes.count,
  });
}
