export type UserComentario = {
  id: string;
  nombre: string;
  apellido: string;
  avatarUrl: string | null;
  puesto: { nombre: string } | null;
};

export type ComentarioConDetalle = {
  id: string;
  leccionId: string;
  userId: string;
  contenido: string;
  createdAt: Date;
  editado: boolean;
  fechaEdicion: Date | null;
  reportado: boolean;
  comentarioPadreId: string | null;
  user: UserComentario;
  totalLikes: number;
  totalRespuestas: number;
  usuarioDioLike: boolean;
  respuestas: ComentarioRespuesta[];
};

export type ComentarioRespuesta = Omit<
  ComentarioConDetalle,
  "respuestas" | "totalRespuestas"
>;

export type OrdenComentarios = "mas-votados" | "nuevos" | "favoritos";
