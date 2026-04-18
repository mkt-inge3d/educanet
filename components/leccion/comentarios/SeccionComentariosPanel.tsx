import {
  listarComentariosLeccion,
  obtenerContadorComentarios,
} from "@/lib/comentarios/queries";
import { PanelComentariosCliente } from "./PanelComentariosCliente";

export async function SeccionComentariosPanel({
  leccionId,
  currentUserId,
  esAdmin,
}: {
  leccionId: string;
  currentUserId: string;
  esAdmin: boolean;
}) {
  const [{ comentarios, siguienteCursor }, total] = await Promise.all([
    listarComentariosLeccion({
      leccionId,
      userId: currentUserId,
      orden: "nuevos",
    }),
    obtenerContadorComentarios(leccionId),
  ]);

  return (
    <PanelComentariosCliente
      leccionId={leccionId}
      comentariosIniciales={comentarios}
      cursorInicial={siguienteCursor}
      total={total}
      currentUserId={currentUserId}
      esAdmin={esAdmin}
    />
  );
}
