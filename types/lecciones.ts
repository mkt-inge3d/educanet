import type { TipoLeccion, TipoPregunta, TipoRecurso } from "@prisma/client";

export type LeccionAdyacente = {
  slug: string;
  titulo: string;
  tipo: TipoLeccion;
};

export type NotaLeccion = {
  id: string;
  contenido: string;
  timestampVideo: number | null;
  createdAt: Date;
};

export type RecursoLeccion = {
  id: string;
  nombre: string;
  url: string;
  tipo: TipoRecurso;
};

export type OpcionQuiz = {
  id: string;
  texto: string;
  esCorrecta: boolean;
  orden: number;
};

export type PreguntaQuiz = {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  orden: number;
  explicacion: string | null;
  opciones: OpcionQuiz[];
};

export type QuizCompleto = {
  id: string;
  titulo: string;
  descripcion: string | null;
  puntajeMinimo: number;
  preguntas: PreguntaQuiz[];
};

export type LeccionDetalleCompleta = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoLeccion;
  bunnyVideoId: string | null;
  videoUrl: string | null;
  contenidoMarkdown: string | null;
  duracionSegundos: number;
  puntosRecompensa: number;
  orden: number;
  modulo: { id: string; titulo: string; orden: number };
  curso: { id: string; slug: string; titulo: string; puntosRecompensa: number };
  quiz: QuizCompleto | null;
  recursos: RecursoLeccion[];
  notas: NotaLeccion[];
  completada: boolean;
  porcentajeVisto: number;
  mejorIntentoQuiz: { puntaje: number; aprobado: boolean } | null;
};

export type ModuloConLeccionesYProgreso = {
  id: string;
  titulo: string;
  orden: number;
  lecciones: {
    id: string;
    slug: string;
    titulo: string;
    tipo: TipoLeccion;
    duracionSegundos: number;
    completada: boolean;
    porcentajeVisto: number;
  }[];
};
