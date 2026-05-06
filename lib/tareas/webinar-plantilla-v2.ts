/**
 * Plantilla estática de 67 tareas para el workflow Webinar V2.
 *
 * offsetDias: días respecto al día del evento (negativo = antes, positivo = después).
 * duracionDias: duración en días calendario.
 * parentId: referencia al id del padre (solo subtareas).
 */
export type WebinarTareaV2 = {
  id: string
  nombre: string
  offsetDias: number
  duracionDias: number
  esHito?: boolean
  parentId?: string
}

export const WEBINAR_TAREAS_V2: WebinarTareaV2[] = [
  // ── FASE PRE-EVENTO ─────────────────────────────────────────────────────────

  // Tarea 1 — Reunion KickOff
  { id: "t1",    nombre: "Reunión KickOff",                                       offsetDias: -45, duracionDias: 5  },
  { id: "t1.1",  nombre: "Valor Agregado",                                         offsetDias: -45, duracionDias: 1,  parentId: "t1" },
  { id: "t1.2",  nombre: "Selección Ponente",                                      offsetDias: -44, duracionDias: 4,  parentId: "t1" },

  // Tarea 2 — Llenado de Ficha Técnica - Comercial
  { id: "t2",    nombre: "Llenado de Ficha Técnica - Comercial",                  offsetDias: -40, duracionDias: 4  },
  { id: "t2.1",  nombre: "Envío de ficha técnica a comercial",                    offsetDias: -40, duracionDias: 1,  parentId: "t2" },
  { id: "t2.2",  nombre: "Recepción y revisión de ficha técnica de comercial",    offsetDias: -40, duracionDias: 4,  parentId: "t2" },

  // Tarea 3 — Llenado de Ficha Técnica - Ponente
  { id: "t3",    nombre: "Llenado de Ficha Técnica - Ponente",                    offsetDias: -36, duracionDias: 4  },
  { id: "t3.1",  nombre: "Envío de ficha técnica a ponente",                      offsetDias: -36, duracionDias: 1,  parentId: "t3" },
  { id: "t3.2",  nombre: "Recepción y revisión de ficha técnica de ponente",      offsetDias: -36, duracionDias: 4,  parentId: "t3" },

  // Tarea 4 — Optimización SEO del Título
  { id: "t4",    nombre: "Optimización SEO del Título",                            offsetDias: -32, duracionDias: 1  },
  { id: "t4.1",  nombre: "Enviar email a SEO/Traficker con ficha finalizada",      offsetDias: -32, duracionDias: 1,  parentId: "t4" },
  { id: "t4.2",  nombre: "Optimización de SEO (Título)",                           offsetDias: -32, duracionDias: 1,  parentId: "t4" },
  { id: "t4.3",  nombre: "Coordinadora valida con el especialista",                offsetDias: -32, duracionDias: 1,  parentId: "t4" },

  // Tarea 5 — Preguntas de Sondeo
  { id: "t5",    nombre: "Preguntas de Sondeo",                                    offsetDias: -30, duracionDias: 6  },
  { id: "t5.1",  nombre: "Enviar email con ejemplos solicitando al especialista",  offsetDias: -30, duracionDias: 1,  parentId: "t5" },
  { id: "t5.2",  nombre: "Recepcionar las preguntas del especialista",             offsetDias: -30, duracionDias: 6,  parentId: "t5" },

  // Tarea 6 — Realización de Piezas Gráficas
  { id: "t6",    nombre: "Realización de Piezas Gráficas",                        offsetDias: -30, duracionDias: 7  },
  { id: "t6.1",  nombre: "Coordinadora solicita piezas gráficas a Diseñador",     offsetDias: -30, duracionDias: 1,  parentId: "t6" },
  { id: "t6.2",  nombre: "Diseñar opciones de piezas gráficas",                   offsetDias: -30, duracionDias: 3,  parentId: "t6" },
  { id: "t6.3",  nombre: "Recibir opciones de diseñador para validar con equipo", offsetDias: -27, duracionDias: 1,  parentId: "t6" },
  { id: "t6.4",  nombre: "Diseñar piezas faltantes en base a la escogida",        offsetDias: -26, duracionDias: 2,  parentId: "t6" },
  { id: "t6.5",  nombre: "Coordinadora recepciona las piezas culminadas",         offsetDias: -24, duracionDias: 1,  parentId: "t6" },

  // Tarea 7 — Crear Sesión Virtual Teams
  { id: "t7",    nombre: "Crear Sesión Virtual Teams",                             offsetDias: -24, duracionDias: 1  },
  { id: "t7.1",  nombre: "Crear reunión y subir preguntas de sondeo",              offsetDias: -24, duracionDias: 1,  parentId: "t7" },

  // Tarea 8 — Publicidad RRSS
  { id: "t8",    nombre: "Publicidad RRSS",                                        offsetDias: -23, duracionDias: 24 },
  { id: "t8.1",  nombre: "Crear Copy del Post",                                    offsetDias: -23, duracionDias: 1,  parentId: "t8" },
  { id: "t8.2",  nombre: "Configurar publicidad en Meta",                          offsetDias: -23, duracionDias: 1,  parentId: "t8" },
  { id: "t8.3",  nombre: "Traficker valida la publicidad configurada",             offsetDias: -23, duracionDias: 1,  parentId: "t8" },
  { id: "t8.4",  nombre: "Sincronizar publicidad con HubSpot",                    offsetDias: -23, duracionDias: 1,  parentId: "t8" },
  { id: "t8.5",  nombre: "Sincronizar Formulario Meta con Zoom",                   offsetDias: -23, duracionDias: 1,  parentId: "t8" },
  { id: "t8.6",  nombre: "Apagar publicidad",                                      offsetDias: -23, duracionDias: 24, parentId: "t8" },

  // Tarea 9 — Landing Page
  { id: "t9",    nombre: "Landing Page",                                            offsetDias: -23, duracionDias: 6  },
  { id: "t9.1",  nombre: "Solicitar Script de formulario Prewebinar a Contenido",  offsetDias: -23, duracionDias: 1,  parentId: "t9" },
  { id: "t9.2",  nombre: "Enviar requerimiento a Web Manager",                     offsetDias: -22, duracionDias: 1,  parentId: "t9" },
  { id: "t9.3",  nombre: "Confirmación de Landing page por Web Manager",           offsetDias: -21, duracionDias: 4,  parentId: "t9" },
  { id: "t9.4",  nombre: "Validar y Sincronizar Landing con Zoom",                 offsetDias: -17, duracionDias: 1,  parentId: "t9" },

  // Tarea 10 — Encuesta
  { id: "t10",   nombre: "Encuesta",                                                offsetDias: -17, duracionDias: 4  },
  { id: "t10.1", nombre: "Coordinar con Comercial las preguntas",                  offsetDias: -17, duracionDias: 3,  parentId: "t10" },
  { id: "t10.2", nombre: "Crear y probar formulario en Google",                    offsetDias: -14, duracionDias: 1,  parentId: "t10" },

  // Tarea 11 — Certificado
  { id: "t11",   nombre: "Certificado",                                             offsetDias: -13, duracionDias: 1  },
  { id: "t11.1", nombre: "Elaborar el certificado en PPT",                          offsetDias: -13, duracionDias: 1,  parentId: "t11" },
  { id: "t11.2", nombre: "Sincronizar el certificado con la encuesta",              offsetDias: -13, duracionDias: 1,  parentId: "t11" },

  // Tarea 12 — Presentación Comercial
  { id: "t12",   nombre: "Presentación Comercial",                                  offsetDias: -12, duracionDias: 4  },
  { id: "t12.1", nombre: "Coordinar con Comercial el contenido de la presentación", offsetDias: -12, duracionDias: 2,  parentId: "t12" },
  { id: "t12.2", nombre: "Armar la presentación en PPT",                            offsetDias: -11, duracionDias: 3,  parentId: "t12" },

  // ── DÍA DEL EVENTO ─────────────────────────────────────────────────────────

  // Tarea 13 — Día del Evento (hito)
  { id: "t13",   nombre: "Día del Evento",  offsetDias: 0, duracionDias: 1, esHito: true },

  // ── FASE POST-EVENTO ────────────────────────────────────────────────────────

  // Tarea 14 — Ficha Postwebinar
  { id: "t14",   nombre: "Ficha Postwebinar",                                             offsetDias: 1,  duracionDias: 8  },
  { id: "t14.1", nombre: "Enviar ficha a expositor por email",                            offsetDias: 1,  duracionDias: 1,  parentId: "t14" },
  { id: "t14.2", nombre: "Recepción de ficha y validación",                               offsetDias: 1,  duracionDias: 5,  parentId: "t14" },
  { id: "t14.3", nombre: "Se envía a SEO para optimización",                              offsetDias: 5,  duracionDias: 1,  parentId: "t14" },
  { id: "t14.4", nombre: "Recepción de ficha optimizada",                                 offsetDias: 6,  duracionDias: 1,  parentId: "t14" },
  { id: "t14.5", nombre: "Enviar ficha optimizada a especialista para su aprobación",     offsetDias: 7,  duracionDias: 2,  parentId: "t14" },

  // Tarea 15 — Mail agradecimiento
  { id: "t15",   nombre: "Mail agradecimiento",                                           offsetDias: 1,  duracionDias: 1  },
  { id: "t15.1", nombre: "Enviar requerimiento a Content Manager",                        offsetDias: 1,  duracionDias: 1,  parentId: "t15" },
  { id: "t15.2", nombre: "Validar el envío de Mail",                                      offsetDias: 1,  duracionDias: 1,  parentId: "t15" },

  // Tarea 16 — Informe de Resultados (simple, sin subtareas)
  { id: "t16",   nombre: "Informe de Resultados",                                         offsetDias: 1,  duracionDias: 2  },

  // Tarea 17 — Video YouTube
  { id: "t17",   nombre: "Video YouTube",                                                  offsetDias: 2,  duracionDias: 5  },
  { id: "t17.1", nombre: "Solicitar a Content Manager que se suba a YouTube",             offsetDias: 2,  duracionDias: 1,  parentId: "t17" },
  { id: "t17.2", nombre: "Subida de video a YouTube",                                     offsetDias: 3,  duracionDias: 3,  parentId: "t17" },
  { id: "t17.3", nombre: "Validar que se haya subido el video correctamente",             offsetDias: 6,  duracionDias: 1,  parentId: "t17" },

  // Tarea 18 — Artículo Landing
  { id: "t18",   nombre: "Artículo Landing",                                              offsetDias: 9,  duracionDias: 4  },
  { id: "t18.1", nombre: "Solicitar Script y lista de HubSpot Postwebinar a Contenido",  offsetDias: 9,  duracionDias: 1,  parentId: "t18" },
  { id: "t18.2", nombre: "Recepción de Script y lista de HubSpot Postwebinar",           offsetDias: 10, duracionDias: 1,  parentId: "t18" },
  { id: "t18.3", nombre: "Enviar requerimiento a Web Manager",                            offsetDias: 10, duracionDias: 1,  parentId: "t18" },
  { id: "t18.4", nombre: "Confirmar publicación de artículo y validar",                  offsetDias: 10, duracionDias: 3,  parentId: "t18" },
  { id: "t18.5", nombre: "Sincronizar Landing con correo postwebinar",                   offsetDias: 12, duracionDias: 1,  parentId: "t18" },
  { id: "t18.6", nombre: "Probar la vinculación del Artículo Landing",                   offsetDias: 12, duracionDias: 1,  parentId: "t18" },
]
