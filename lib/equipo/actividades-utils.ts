export type TipoActividad =
  | "TAREA_COMPLETADA"
  | "TAREA_VALIDADA"
  | "KPI_APROBADO"
  | "LECCION"
  | "RECONOCIMIENTO"
  | "MISION";

export type ItemActividad = {
  id: string;
  timestamp: Date;
  userId: string;
  userNombre: string;
  userApellido: string;
  userAvatar: string | null;
  tipo: TipoActividad;
  titulo: string;
  descripcion?: string;
  referenciaUrl?: string;
  puntos?: number;
  workflow?: string | null;
};

export type GrupoMiembro = {
  userId: string;
  userNombre: string;
  userApellido: string;
  userAvatar: string | null;
  items: ItemActividad[];
};

export function agruparPorMiembro(items: ItemActividad[]): GrupoMiembro[] {
  const map = new Map<string, GrupoMiembro>();
  for (const it of items) {
    const existente = map.get(it.userId) ?? {
      userId: it.userId,
      userNombre: it.userNombre,
      userApellido: it.userApellido,
      userAvatar: it.userAvatar,
      items: [],
    };
    existente.items.push(it);
    map.set(it.userId, existente);
  }
  return Array.from(map.values()).sort(
    (a, b) => b.items.length - a.items.length,
  );
}

export function contarPorTipo(items: ItemActividad[]): Record<TipoActividad, number> {
  const porTipo: Record<TipoActividad, number> = {
    TAREA_COMPLETADA: 0,
    TAREA_VALIDADA: 0,
    KPI_APROBADO: 0,
    LECCION: 0,
    RECONOCIMIENTO: 0,
    MISION: 0,
  };
  for (const i of items) porTipo[i.tipo]++;
  return porTipo;
}

export function usuariosActivos(items: ItemActividad[]): Set<string> {
  return new Set(items.map((i) => i.userId));
}
