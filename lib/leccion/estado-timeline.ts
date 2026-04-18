export type EstadoLeccion =
  | "completado"
  | "en-progreso"
  | "proximo"
  | "bloqueado";

type LeccionInputEstado = {
  id: string;
  completada: boolean;
  porcentajeVisto: number;
};

export function calcularEstadosLecciones(
  lecciones: LeccionInputEstado[]
): Map<string, EstadoLeccion> {
  const estados = new Map<string, EstadoLeccion>();
  let yaHayProxima = false;

  for (const leccion of lecciones) {
    if (leccion.completada) {
      estados.set(leccion.id, "completado");
    } else if (leccion.porcentajeVisto > 0) {
      estados.set(leccion.id, "en-progreso");
      yaHayProxima = true;
    } else if (!yaHayProxima) {
      estados.set(leccion.id, "proximo");
      yaHayProxima = true;
    } else {
      estados.set(leccion.id, "bloqueado");
    }
  }

  return estados;
}
