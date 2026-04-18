"use server";

import { requireAuth } from "@/lib/auth";
import { listarComentariosLeccion } from "./queries";
import type { OrdenComentarios } from "@/types/comentarios";

export async function cargarPaginaComentarios(input: {
  leccionId: string;
  orden: OrdenComentarios;
  cursor?: string;
}) {
  const user = await requireAuth();
  return listarComentariosLeccion({
    leccionId: input.leccionId,
    userId: user.id,
    orden: input.orden,
    cursor: input.cursor,
  });
}
