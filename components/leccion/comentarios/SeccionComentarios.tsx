import {
  listarComentariosLeccion,
  obtenerContadorComentarios,
} from "@/lib/comentarios/queries";
import { ComentariosList } from "./ComentariosList";

export async function SeccionComentarios({
  leccionId,
  currentUser,
  esAdmin,
}: {
  leccionId: string;
  currentUser: {
    id: string;
    nombre: string;
    apellido: string;
    avatarUrl: string | null;
  };
  esAdmin: boolean;
}) {
  const [{ comentarios, siguienteCursor }, total] = await Promise.all([
    listarComentariosLeccion({
      leccionId,
      userId: currentUser.id,
      orden: "nuevos",
    }),
    obtenerContadorComentarios(leccionId),
  ]);

  return (
    <ComentariosList
      leccionId={leccionId}
      comentariosIniciales={comentarios}
      cursorInicial={siguienteCursor}
      ordenInicial="nuevos"
      currentUser={currentUser}
      esAdmin={esAdmin}
      total={total}
    />
  );
}
