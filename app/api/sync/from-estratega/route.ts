import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { prismaForOrg } from "@/lib/prisma-tenant";
import { verifyHmacSignature } from "@/lib/sync/verify-signature";
import { proyectoSyncSchema } from "@/lib/sync/schema";

/**
 * POST /api/sync/from-estratega
 *
 * Recibe un proyecto desde Estratega y crea WorkflowInstancia + TareaInstancia
 * en la org indicada. Verifica HMAC con webhookSecret de la org (o fallback env).
 * Es idempotente: si ya recibimos este sourceProjectId, retorna el existente.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const orgSlug = req.headers.get("x-org-slug");
  const signature = req.headers.get("x-estratega-signature");

  if (!orgSlug) {
    return NextResponse.json({ error: "Falta header X-Org-Slug" }, { status: 400 });
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, webhookSecret: true, activa: true },
  });

  if (!organization || !organization.activa) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }

  const secret = organization.webhookSecret ?? process.env.ESTRATEGA_WEBHOOK_SECRET ?? "";
  if (!secret) {
    return NextResponse.json({ error: "Secret no configurado" }, { status: 500 });
  }

  if (!verifyHmacSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload;
  try {
    const parsed = proyectoSyncSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", issues: parsed.error.issues },
        { status: 422 },
      );
    }
    payload = parsed.data;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const db = prismaForOrg(organization.id);

  // Idempotencia: si ya recibimos este proyecto, retornar referencia existente
  const existente = await db.origenExterno.findFirst({
    where: { sourceApp: "estratega", sourceProjectId: payload.sourceProjectId },
    select: { id: true, workflowInstanciaId: true, recibidoEn: true },
  });
  if (existente?.workflowInstanciaId) {
    return NextResponse.json({
      duplicate: true,
      workflowInstanciaId: existente.workflowInstanciaId,
      url: `/proyectos/${existente.workflowInstanciaId}`,
      recibidoEn: existente.recibidoEn,
    });
  }

  // Plantilla por código en esta org
  const plantilla = await db.workflowPlantilla.findFirst({
    where: { codigo: payload.categoria, activo: true },
    select: { id: true },
  });
  if (!plantilla) {
    await prisma.origenExterno.create({
      data: {
        organizationId: organization.id,
        sourceApp: "estratega",
        sourceProjectId: payload.sourceProjectId,
        payload: rawBody,
        procesadoOk: false,
        errorMensaje: `No existe WorkflowPlantilla con código ${payload.categoria} en la org`,
      },
    });
    return NextResponse.json(
      { error: `No existe plantilla activa con código ${payload.categoria}` },
      { status: 422 },
    );
  }

  // Responsable general por email (debe pertenecer a la org)
  const responsable = await prisma.user.findFirst({
    where: { email: payload.ownerEmail, organizationId: organization.id, activo: true },
    select: { id: true },
  });
  if (!responsable) {
    await prisma.origenExterno.create({
      data: {
        organizationId: organization.id,
        sourceApp: "estratega",
        sourceProjectId: payload.sourceProjectId,
        payload: rawBody,
        procesadoOk: false,
        errorMensaje: `Owner ${payload.ownerEmail} no es usuario activo en la org`,
      },
    });
    return NextResponse.json(
      { error: `Owner ${payload.ownerEmail} no es usuario activo en la org` },
      { status: 422 },
    );
  }

  // Resolver asignados de cada issue (en paralelo, una sola query)
  const emailsAsignados = Array.from(
    new Set(
      payload.issues
        .map((i) => i.ownerEmail)
        .filter((e): e is string => !!e),
    ),
  );
  const users = emailsAsignados.length
    ? await prisma.user.findMany({
        where: { email: { in: emailsAsignados }, organizationId: organization.id, activo: true },
        select: { id: true, email: true },
      })
    : [];
  const userByEmail = new Map(users.map((u) => [u.email, u.id]));

  const fechaHito = new Date(payload.fechaHito);
  const hoy = new Date();

  // Transacción: WorkflowInstancia + TareaInstancia[] + OrigenExterno
  const resultado = await prisma.$transaction(async (tx) => {
    const workflow = await tx.workflowInstancia.create({
      data: {
        organizationId: organization.id,
        plantillaId: plantilla.id,
        nombre: payload.nombre,
        contextoMarca: payload.descripcion ?? undefined,
        negocio: payload.negocio ?? undefined,
        fechaHito,
        responsableGeneralId: responsable.id,
        estadoGeneral: "ACTIVO",
        notas: `Importado de Estratega (${payload.sourceProjectId})`,
      },
      select: { id: true },
    });

    if (payload.issues.length > 0) {
      await tx.tareaInstancia.createMany({
        data: payload.issues.map((issue, idx) => {
          const asignadoId = (issue.ownerEmail && userByEmail.get(issue.ownerEmail)) ?? responsable.id;
          const inicio = hoy;
          const fin = issue.dueDate ? new Date(issue.dueDate) : fechaHito;
          return {
            organizationId: organization.id,
            workflowInstanciaId: workflow.id,
            asignadoAId: asignadoId,
            origen: "AUTO_WORKFLOW" as const,
            estado: "PENDIENTE" as const,
            nombreAdHoc: issue.title,
            descripcionAdHoc: issue.description ?? undefined,
            tiempoEstimadoMinAdHoc: issue.estimateMinutes ?? undefined,
            tiempoEstimadoMaxAdHoc: issue.estimateMinutes ?? undefined,
            fechaEstimadaInicio: inicio,
            fechaEstimadaFin: fin,
            puntosBrutos: 5,
            ordenGantt: idx,
            esHito: issue.isMilestone ?? false,
            negocio: payload.negocio ?? undefined,
          };
        }),
      });
    }

    await tx.origenExterno.create({
      data: {
        organizationId: organization.id,
        sourceApp: "estratega",
        sourceProjectId: payload.sourceProjectId,
        workflowInstanciaId: workflow.id,
        payload: rawBody,
        procesadoOk: true,
      },
    });

    return workflow;
  });

  return NextResponse.json({
    workflowInstanciaId: resultado.id,
    url: `/proyectos/${resultado.id}`,
    tareasCreadas: payload.issues.length,
  });
}
