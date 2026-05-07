import type { BpmnParseado, NodoParseado, FlujoParseado } from "./types"

// ── Carriles ──────────────────────────────────────────────────────────────────
const CO = "Coordinadora"
const SE = "SEO"
const DI = "Diseñador"
const TR = "Traficker"
const CM = "Content Manager"
const WM = "Web Manager"

// ── Fases ─────────────────────────────────────────────────────────────────────
const PRE = "pre-webinar"
const WEB = "webinar"
const POST = "post-webinar"

// ── Posiciones (grid: x = columna, y = carril) ────────────────────────────────
// Carriles Y (centro): CO=80, SE=180, DI=280, TR=380, CM=480, WM=580
// Fases X: pre(60-1240), webinar(1360-1600), post(1720-2080)

const nodos: NodoParseado[] = [
  // ── PRE-WEBINAR ─────────────────────────────────────────────────────────────

  {
    bpmnElementId: "ev_inicio",
    nombre: "Inicio",
    tipo: "EVENTO_INICIO",
    carril: CO,
    fase: PRE,
    posicion: { x: 60, y: 80 },
  },
  {
    bpmnElementId: "task_kickoff",
    nombre: "KickOff y Fichas Técnicas",
    tipo: "TAREA",
    carril: CO,
    fase: PRE,
    puestoNombre: CO,
    duracionEstimadaMin: 2880, // 2 días × 1440
    posicion: { x: 200, y: 80 },
  },
  {
    bpmnElementId: "task_seo_titulo",
    nombre: "Optimización SEO del Título",
    tipo: "TAREA",
    carril: SE,
    fase: PRE,
    puestoNombre: SE,
    duracionEstimadaMin: 60,
    posicion: { x: 400, y: 180 },
  },
  {
    bpmnElementId: "task_sondeo",
    nombre: "Preguntas de Sondeo al Especialista",
    tipo: "TAREA",
    carril: CO,
    fase: PRE,
    puestoNombre: CO,
    duracionEstimadaMin: 480,
    posicion: { x: 600, y: 80 },
  },
  {
    bpmnElementId: "task_piezas",
    nombre: "Piezas Gráficas",
    tipo: "TAREA",
    carril: DI,
    fase: PRE,
    puestoNombre: DI,
    duracionEstimadaMin: 2160, // 1.5 días
    posicion: { x: 600, y: 280 },
  },
  {
    bpmnElementId: "task_teams",
    nombre: "Crear Sesión Virtual Teams",
    tipo: "TAREA",
    carril: CO,
    fase: PRE,
    puestoNombre: CO,
    duracionEstimadaMin: 30,
    posicion: { x: 800, y: 80 },
  },
  {
    bpmnElementId: "task_publicidad",
    nombre: "Publicidad en RRSS",
    tipo: "TAREA",
    carril: TR,
    fase: PRE,
    puestoNombre: TR,
    duracionEstimadaMin: 4320, // 3 días setup
    posicion: { x: 800, y: 380 },
  },
  {
    bpmnElementId: "task_landing",
    nombre: "Landing Page",
    tipo: "TAREA",
    carril: WM,
    fase: PRE,
    puestoNombre: WM,
    duracionEstimadaMin: 1440,
    posicion: { x: 800, y: 580 },
  },
  {
    bpmnElementId: "task_email_pre",
    nombre: "Email Marketing Prewebinar",
    tipo: "TAREA",
    carril: CM,
    fase: PRE,
    puestoNombre: CM,
    duracionEstimadaMin: 240,
    posicion: { x: 1000, y: 480 },
  },
  {
    bpmnElementId: "task_whatsapp_pre",
    nombre: "WhatsApp Masivo Prewebinar",
    tipo: "TAREA",
    carril: CM,
    fase: PRE,
    puestoNombre: CM,
    duracionEstimadaMin: 120,
    posicion: { x: 1000, y: 380 },
  },
  {
    bpmnElementId: "task_seo_comms",
    nombre: "SEO y Comunicación Interna",
    tipo: "TAREA",
    carril: SE,
    fase: PRE,
    puestoNombre: SE,
    duracionEstimadaMin: 180,
    posicion: { x: 1000, y: 180 },
  },
  {
    bpmnElementId: "task_recordatorios",
    nombre: "Recordatorios Pre-Evento",
    tipo: "TAREA",
    carril: CO,
    fase: PRE,
    puestoNombre: CO,
    duracionEstimadaMin: 60,
    posicion: { x: 1000, y: 80 },
  },
  {
    bpmnElementId: "gw_pre_converge",
    nombre: "Todo listo",
    tipo: "GATEWAY",
    carril: CO,
    fase: PRE,
    posicion: { x: 1240, y: 80 },
    metadatos: { tipo: "PARALELO", direccion: "convergente" },
  },

  // ── WEBINAR ──────────────────────────────────────────────────────────────────

  {
    bpmnElementId: "task_prep_webinar",
    nombre: "Preparación Técnica del Webinar",
    tipo: "TAREA",
    carril: CO,
    fase: WEB,
    puestoNombre: CO,
    duracionEstimadaMin: 120,
    posicion: { x: 1400, y: 80 },
  },
  {
    bpmnElementId: "task_webinar_vivo",
    nombre: "Webinar en Vivo",
    tipo: "TAREA",
    carril: CO,
    fase: WEB,
    puestoNombre: CO,
    duracionEstimadaMin: 90,
    posicion: { x: 1560, y: 80 },
  },
  {
    bpmnElementId: "gw_post_diverge",
    nombre: "Fin del evento",
    tipo: "GATEWAY",
    carril: CO,
    fase: WEB,
    posicion: { x: 1720, y: 80 },
    metadatos: { tipo: "PARALELO", direccion: "divergente" },
  },

  // ── POST-WEBINAR ─────────────────────────────────────────────────────────────

  {
    bpmnElementId: "task_edicion",
    nombre: "Edición de la Grabación",
    tipo: "TAREA",
    carril: DI,
    fase: POST,
    puestoNombre: DI,
    duracionEstimadaMin: 2880,
    posicion: { x: 1880, y: 280 },
  },
  {
    bpmnElementId: "task_email_post",
    nombre: "Email Post-Webinar",
    tipo: "TAREA",
    carril: CM,
    fase: POST,
    puestoNombre: CM,
    duracionEstimadaMin: 120,
    posicion: { x: 1880, y: 480 },
  },
  {
    bpmnElementId: "task_carga_lms",
    nombre: "Carga de Grabación al LMS",
    tipo: "TAREA",
    carril: WM,
    fase: POST,
    puestoNombre: WM,
    duracionEstimadaMin: 60,
    posicion: { x: 1880, y: 580 },
  },
  {
    bpmnElementId: "task_remarketing",
    nombre: "Remarketing Audiencia",
    tipo: "TAREA",
    carril: TR,
    fase: POST,
    puestoNombre: TR,
    duracionEstimadaMin: 480,
    posicion: { x: 1880, y: 380 },
  },
  {
    bpmnElementId: "task_seo_post",
    nombre: "Actualizar SEO Post-Evento",
    tipo: "TAREA",
    carril: SE,
    fase: POST,
    puestoNombre: SE,
    duracionEstimadaMin: 120,
    posicion: { x: 1880, y: 180 },
  },
  {
    bpmnElementId: "task_informe",
    nombre: "Informe Final",
    tipo: "TAREA",
    carril: CO,
    fase: POST,
    puestoNombre: CO,
    duracionEstimadaMin: 240,
    posicion: { x: 2080, y: 80 },
  },
  {
    bpmnElementId: "ev_fin",
    nombre: "Proceso completado",
    tipo: "EVENTO_FIN",
    carril: CO,
    fase: POST,
    posicion: { x: 2240, y: 80 },
  },
]

const flujos: FlujoParseado[] = [
  // Inicio → KickOff
  { id: "f1",  origen: "ev_inicio",       destino: "task_kickoff" },

  // KickOff → SEO título (en paralelo con sondeo y piezas)
  { id: "f2",  origen: "task_kickoff",    destino: "task_seo_titulo" },
  { id: "f3",  origen: "task_kickoff",    destino: "task_piezas" },
  { id: "f4",  origen: "task_kickoff",    destino: "task_publicidad" },
  { id: "f5",  origen: "task_kickoff",    destino: "task_landing" },

  // SEO título → Sondeo
  { id: "f6",  origen: "task_seo_titulo", destino: "task_sondeo" },

  // Sondeo → Teams
  { id: "f7",  origen: "task_sondeo",     destino: "task_teams" },

  // Piezas → Teams (ambas convergen antes del evento Teams)
  { id: "f8",  origen: "task_piezas",     destino: "task_teams" },

  // Teams → Recordatorios
  { id: "f9",  origen: "task_teams",      destino: "task_recordatorios" },

  // Publicidad → Email y WhatsApp
  { id: "f10", origen: "task_publicidad", destino: "task_email_pre" },
  { id: "f11", origen: "task_publicidad", destino: "task_whatsapp_pre" },

  // Landing → SEO Comms
  { id: "f12", origen: "task_landing",    destino: "task_seo_comms" },

  // Todos convergen al gateway
  { id: "f13", origen: "task_recordatorios", destino: "gw_pre_converge" },
  { id: "f14", origen: "task_email_pre",     destino: "gw_pre_converge" },
  { id: "f15", origen: "task_whatsapp_pre",  destino: "gw_pre_converge" },
  { id: "f16", origen: "task_seo_comms",     destino: "gw_pre_converge" },

  // Gateway → Preparación webinar
  { id: "f17", origen: "gw_pre_converge", destino: "task_prep_webinar" },

  // Prep → Webinar vivo
  { id: "f18", origen: "task_prep_webinar", destino: "task_webinar_vivo" },

  // Webinar vivo → Gateway post
  { id: "f19", origen: "task_webinar_vivo", destino: "gw_post_diverge" },

  // Gateway post → todas las tareas post (paralelo)
  { id: "f20", origen: "gw_post_diverge", destino: "task_edicion" },
  { id: "f21", origen: "gw_post_diverge", destino: "task_email_post" },
  { id: "f22", origen: "gw_post_diverge", destino: "task_carga_lms" },
  { id: "f23", origen: "gw_post_diverge", destino: "task_remarketing" },
  { id: "f24", origen: "gw_post_diverge", destino: "task_seo_post" },

  // Tareas post → Informe final
  { id: "f25", origen: "task_edicion",    destino: "task_informe" },
  { id: "f26", origen: "task_email_post", destino: "task_informe" },
  { id: "f27", origen: "task_carga_lms",  destino: "task_informe" },
  { id: "f28", origen: "task_remarketing",destino: "task_informe" },
  { id: "f29", origen: "task_seo_post",   destino: "task_informe" },

  // Informe → Fin
  { id: "f30", origen: "task_informe",    destino: "ev_fin" },
]

export const WEBINAR_BPMN: BpmnParseado = { nodos, flujos }

export const WEBINAR_BPMN_NOMBRE = "Proceso de Webinar"
export const WEBINAR_BPMN_VERSION = 1
