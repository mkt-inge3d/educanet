import type { FrecuenciaKpi } from "@prisma/client";

export type DefinicionHitoSeed = {
  codigo: string;
  nombre: string;
  descripcion: string;
  frecuencia: FrecuenciaKpi;
  puntos: number;
  puntosMaxMes: number;
  requiereEvidencia: boolean;
  esCondicional: boolean;
  cantidadMaxMes?: number;
};

// Catalogo de los 48 hitos del piloto Marketing.
// Suma exacta por puesto: 1000 pts/mes (= tope de FuenteXP.KPIS en lib/gamificacion/multiplicadores.ts)

export const HITOS_POR_PUESTO: Record<string, DefinicionHitoSeed[]> = {
  // ─── DISEÑADOR (Hector) ─────────────────────────────────────────────
  // Semanales 340 + Mensuales 660 = 1000
  DISENADOR_GRAFICO: [
    { codigo: "D-01", nombre: "Backup diario realizado >=4/5 dias habiles",
      descripcion: "Subir captura semanal del log de backups (Drive/disco) que muestre los 5 dias.",
      frecuencia: "SEMANAL", puntos: 15, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
    { codigo: "D-02", nombre: "Piezas entregadas sin reproceso esa semana",
      descripcion: "Cero piezas con cambios mayores solicitados despues de entregadas.",
      frecuencia: "SEMANAL", puntos: 40, puntosMaxMes: 160, requiereEvidencia: true, esCondicional: false },
    { codigo: "D-03", nombre: "Tiempo de respuesta <=24h a pedido estandar",
      descripcion: "Pedidos estandar atendidos dentro de 24h habiles toda la semana.",
      frecuencia: "SEMANAL", puntos: 30, puntosMaxMes: 120, requiereEvidencia: true, esCondicional: false },

    { codigo: "D-04", nombre: "Kit completo de webinar entregado T-3 semanas",
      descripcion: "Por webinar (hasta 3 al mes). Subir entregable consolidado.",
      frecuencia: "MENSUAL", puntos: 80, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: true, cantidadMaxMes: 3 },
    { codigo: "D-05", nombre: "% piezas rechazadas <=15% del total del mes",
      descripcion: "Reporte mensual de piezas producidas y rechazadas.",
      frecuencia: "MENSUAL", puntos: 100, puntosMaxMes: 100, requiereEvidencia: true, esCondicional: false },
    { codigo: "D-06", nombre: "Arte nuevo (sin plantilla) entregado en <=1 dia",
      descripcion: "Al menos 1 arte nuevo del mes con tiempo registrado.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
    { codigo: "D-07", nombre: "Propuso y uso al menos 1 plantilla nueva reutilizable",
      descripcion: "Subir captura de la plantilla y donde fue reutilizada.",
      frecuencia: "MENSUAL", puntos: 50, puntosMaxMes: 50, requiereEvidencia: true, esCondicional: false },
    { codigo: "D-08", nombre: "Todos los archivos del mes con nomenclatura estandar",
      descripcion: "Auditoria visual del Drive del mes.",
      frecuencia: "MENSUAL", puntos: 70, puntosMaxMes: 70, requiereEvidencia: true, esCondicional: false },
    { codigo: "D-09", nombre: "Al menos 1 pieza de video/animacion producida en el mes",
      descripcion: "Subir el video o link al mismo.",
      frecuencia: "MENSUAL", puntos: 80, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: false },
    { codigo: "D-10", nombre: "Cero piezas entregadas sin brief minimo documentado",
      descripcion: "Lista de piezas del mes con su brief asociado.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
    { codigo: "D-11", nombre: "Reporte propio mensual entregado",
      descripcion: "Piezas producidas, rechazadas y tiempos.",
      frecuencia: "MENSUAL", puntos: 80, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: false },
    { codigo: "D-12", nombre: "Brochure con editable original consolidado (1/mes)",
      descripcion: "Brochure del mes con archivo editable nombrado correctamente.",
      frecuencia: "MENSUAL", puntos: 80, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: false },
  ],

  // ─── CONTENT MANAGER (Nadia) ────────────────────────────────────────
  // Semanales 340 + Mensuales 660 = 1000
  CONTENT_MANAGER: [
    { codigo: "C-01", nombre: "100% de publicaciones de la semana programadas a tiempo",
      descripcion: "Captura del calendario editorial de la semana.",
      frecuencia: "SEMANAL", puntos: 45, puntosMaxMes: 180, requiereEvidencia: true, esCondicional: false },
    { codigo: "C-02", nombre: "Al menos 1 copy nuevo enviado a especialista para validacion",
      descripcion: "Captura del envio (mail/Slack) y respuesta.",
      frecuencia: "SEMANAL", puntos: 25, puntosMaxMes: 100, requiereEvidencia: true, esCondicional: false },
    { codigo: "C-03", nombre: "Reviso y respondio Discord de cursos ese dia (>=4/5 dias)",
      descripcion: "Captura del registro de actividad en Discord.",
      frecuencia: "SEMANAL", puntos: 15, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },

    { codigo: "C-04", nombre: "Copies publicados >= objetivo del mes",
      descripcion: "Reporte vs calendario editorial del mes.",
      frecuencia: "MENSUAL", puntos: 100, puntosMaxMes: 100, requiereEvidencia: true, esCondicional: false },
    { codigo: "C-05", nombre: "Tiempo promedio de validacion con especialista <=3 dias",
      descripcion: "Reporte mensual de tiempos de validacion.",
      frecuencia: "MENSUAL", puntos: 80, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: false },
    { codigo: "C-06", nombre: "Al menos 1 articulo de blog publicado",
      descripcion: "Link al articulo publicado.",
      frecuencia: "MENSUAL", puntos: 70, puntosMaxMes: 70, requiereEvidencia: true, esCondicional: false },
    { codigo: "C-07", nombre: "Material DAM Autodesk usado en >=60% de piezas Autodesk",
      descripcion: "Listado de piezas Autodesk del mes con marcado.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
    { codigo: "C-08", nombre: "0 publicaciones con errores de marca o copy despues de publicadas",
      descripcion: "Auditoria mensual de publicaciones del mes.",
      frecuencia: "MENSUAL", puntos: 80, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: false },
    { codigo: "C-09", nombre: "Guion de video producido y aprobado (si aplica al mes)",
      descripcion: "Subir guion aprobado por el especialista.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: true },
    { codigo: "C-10", nombre: "Reporte mensual de contenido entregado al jefe en fecha",
      descripcion: "Reporte consolidado del mes.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
    { codigo: "C-11", nombre: "Al menos 1 pieza de contenido 'de calle' propuesta o ejecutada",
      descripcion: "Pieza generada fuera de oficina (video con persona, foto callejera, etc).",
      frecuencia: "MENSUAL", puntos: 90, puntosMaxMes: 90, requiereEvidencia: true, esCondicional: false },
    { codigo: "C-12", nombre: "Todos los archivos del mes con nomenclatura estandar",
      descripcion: "Auditoria del Drive del mes.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
  ],

  // ─── ASISTENTE DE PLANIFICACION (Pamela) ────────────────────────────
  // Semanales 300 + Mensuales 700 = 1000
  ASISTENTE_PLANIFICACION: [
    { codigo: "P-01", nombre: "Reviso y avanzo todos los webinars en pipeline ese dia (>=4/5)",
      descripcion: "Captura del estado del pipeline al cierre de la semana.",
      frecuencia: "SEMANAL", puntos: 25, puntosMaxMes: 100, requiereEvidencia: true, esCondicional: false },
    { codigo: "P-02", nombre: "Respondio todos los emails pendientes dentro de 24h habiles",
      descripcion: "Captura de bandeja de entrada al cierre de cada dia laboral.",
      frecuencia: "SEMANAL", puntos: 20, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: false },
    { codigo: "P-03", nombre: "Calendario maestro actualizado sin vencidos no comunicados",
      descripcion: "Captura del calendario maestro y comunicaciones de vencimientos.",
      frecuencia: "SEMANAL", puntos: 30, puntosMaxMes: 120, requiereEvidencia: true, esCondicional: false },

    { codigo: "P-04", nombre: "Fichas de webinar completas T-3 semanas",
      descripcion: "Por webinar (hasta 5 al mes). Subir ficha por cada webinar.",
      frecuencia: "MENSUAL", puntos: 120, puntosMaxMes: 120, requiereEvidencia: true, esCondicional: true, cantidadMaxMes: 5 },
    { codigo: "P-05", nombre: "Publicidad activada T-3 semanas en todos los webinars",
      descripcion: "Captura del lanzamiento de pauta para cada webinar del mes.",
      frecuencia: "MENSUAL", puntos: 80, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: false },
    { codigo: "P-06", nombre: "Reportes post-webinar entregados <=5 dias del evento",
      descripcion: "Reportes consolidados de cada webinar.",
      frecuencia: "MENSUAL", puntos: 70, puntosMaxMes: 70, requiereEvidencia: true, esCondicional: false },
    { codigo: "P-07", nombre: "Asistencia promedio a webinars >=40% de inscritos",
      descripcion: "Reporte de asistencia con calculo del promedio.",
      frecuencia: "MENSUAL", puntos: 80, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: false },
    { codigo: "P-08", nombre: "0 webinars cancelados con menos de 3 semanas de aviso",
      descripcion: "Listado de webinars del mes y fechas de eventual cancelacion.",
      frecuencia: "MENSUAL", puntos: 90, puntosMaxMes: 90, requiereEvidencia: true, esCondicional: false },
    { codigo: "P-09", nombre: "Al menos 1 propuesta de mejora en proceso documentada",
      descripcion: "Documento o post de la propuesta.",
      frecuencia: "MENSUAL", puntos: 50, puntosMaxMes: 50, requiereEvidencia: true, esCondicional: false },
    { codigo: "P-10", nombre: "Encuesta post-webinar enviada y datos reportados al jefe",
      descripcion: "Captura del envio + reporte de resultados.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
    { codigo: "P-11", nombre: "SEMCO LAB ejecutado segun plan",
      descripcion: "Solo si corresponde al mes. Subir reporte del lab.",
      frecuencia: "MENSUAL", puntos: 100, puntosMaxMes: 100, requiereEvidencia: true, esCondicional: true },
    { codigo: "P-12", nombre: "Reporte mensual de gestion de eventos entregado en fecha",
      descripcion: "Reporte consolidado del mes.",
      frecuencia: "MENSUAL", puntos: 50, puntosMaxMes: 50, requiereEvidencia: true, esCondicional: false },
  ],

  // ─── SEO / TRAFFICKER (Claudia) ─────────────────────────────────────
  // Semanales 400 + Mensuales 600 = 1000
  TRAFFICKER: [
    { codigo: "T-01", nombre: "Monitoreo de campañas registrado (>=4/5 dias)",
      descripcion: "Capturas del panel cada dia que se monitorea.",
      frecuencia: "SEMANAL", puntos: 40, puntosMaxMes: 160, requiereEvidencia: true, esCondicional: false },
    { codigo: "T-02", nombre: "Reporte semanal enviado al jefe el lunes",
      descripcion: "Captura del envio del reporte semanal.",
      frecuencia: "SEMANAL", puntos: 35, puntosMaxMes: 140, requiereEvidencia: true, esCondicional: false },
    { codigo: "T-03", nombre: "Al menos 2 tareas SEO criticas cerradas en SEMrush",
      descripcion: "Captura de las tareas cerradas en la herramienta.",
      frecuencia: "SEMANAL", puntos: 25, puntosMaxMes: 100, requiereEvidencia: true, esCondicional: false },

    { codigo: "T-04", nombre: "ROAS promedio de campañas >=2.0",
      descripcion: "Reporte mensual con calculo del ROAS.",
      frecuencia: "MENSUAL", puntos: 100, puntosMaxMes: 100, requiereEvidencia: true, esCondicional: false },
    { codigo: "T-05", nombre: "Revision quincenal de posicionamiento de las 7 marcas",
      descripcion: "Reportes de las 2 ventanas del mes.",
      frecuencia: "MENSUAL", puntos: 80, puntosMaxMes: 80, requiereEvidencia: true, esCondicional: false },
    { codigo: "T-06", nombre: "Al menos 1 campaña nueva lanzada y configurada correctamente",
      descripcion: "Captura del setup completo de la campaña.",
      frecuencia: "MENSUAL", puntos: 70, puntosMaxMes: 70, requiereEvidencia: true, esCondicional: false },
    { codigo: "T-07", nombre: "Anuncios activos con rotacion de copy gestionada",
      descripcion: "Reporte de frecuencia y rotacion de copies.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
    { codigo: "T-08", nombre: "Campaña de LinkedIn ejecutada con presupuesto MDP",
      descripcion: "Captura de la campaña activa con presupuesto asignado.",
      frecuencia: "MENSUAL", puntos: 100, puntosMaxMes: 100, requiereEvidencia: true, esCondicional: false },
    { codigo: "T-09", nombre: "0 campañas activas sin registro de rendimiento del mes",
      descripcion: "Listado de campañas activas y sus reportes asociados.",
      frecuencia: "MENSUAL", puntos: 70, puntosMaxMes: 70, requiereEvidencia: true, esCondicional: false },
    { codigo: "T-10", nombre: "Inge3D atendida: al menos 1 accion documentada en el mes",
      descripcion: "Documento o pieza de la accion ejecutada.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
    { codigo: "T-11", nombre: "Panel de analitica actualizado y compartido con el equipo",
      descripcion: "Captura del panel y registro de comparticion.",
      frecuencia: "MENSUAL", puntos: 60, puntosMaxMes: 60, requiereEvidencia: true, esCondicional: false },
  ],
};

export function validarCatalogo() {
  const errores: string[] = [];
  for (const [puesto, hitos] of Object.entries(HITOS_POR_PUESTO)) {
    const sumaMensual = hitos.reduce((acc, h) => acc + h.puntosMaxMes, 0);
    if (sumaMensual !== 1000) {
      errores.push(`${puesto}: suma puntosMaxMes = ${sumaMensual}, esperado 1000`);
    }
    const codigos = new Set<string>();
    for (const h of hitos) {
      if (codigos.has(h.codigo)) errores.push(`${puesto}: codigo duplicado ${h.codigo}`);
      codigos.add(h.codigo);
      if (h.frecuencia === "SEMANAL" && h.puntos * 4 !== h.puntosMaxMes) {
        errores.push(`${puesto}.${h.codigo}: SEMANAL puntos*4 (${h.puntos * 4}) != puntosMaxMes (${h.puntosMaxMes})`);
      }
    }
  }
  return errores;
}
