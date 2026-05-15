import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as any) as any

const PLANTILLA_ID = 'cmocbwd45005640f3jvclvtpe'

const WEBINARS = [
  { nombre: 'Webinar Autodesk AEC · 20/05', negocio: 'AUTODESK_AEC', fechaEvento: '2026-05-20', marca: 'Autodesk AEC' },
  { nombre: 'Webinar Autodesk MFG · 26/05', negocio: 'AUTODESK_MFG', fechaEvento: '2026-05-26', marca: 'Autodesk MFG' },
  { nombre: 'Webinar ANSYS · 28/05',         negocio: 'ANSYS',         fechaEvento: '2026-05-28', marca: 'ANSYS' },
  { nombre: 'Webinar Cursos · 03/06',        negocio: 'CURSOS',        fechaEvento: '2026-06-03', marca: 'Cursos' },
  { nombre: 'Webinar Inge3D · 09/06',        negocio: 'INGE3D',        fechaEvento: '2026-06-09', marca: 'Inge3D' },
  { nombre: 'Webinar Oracle · 16/06',        negocio: 'ORACLE',        fechaEvento: '2026-06-16', marca: 'Oracle' },
  { nombre: 'Webinar Autodesk AEC · 23/06', negocio: 'AUTODESK_AEC', fechaEvento: '2026-06-23', marca: 'Autodesk AEC' },
  { nombre: 'Webinar ANSYS · 25/06',         negocio: 'ANSYS',         fechaEvento: '2026-06-25', marca: 'ANSYS' },
  { nombre: 'Webinar Autodesk MFG · 30/06', negocio: 'AUTODESK_MFG', fechaEvento: '2026-06-30', marca: 'Autodesk MFG' },
]

const NOM: Record<string, { short: string; desc: string; tipo?: string }> = {
  'Reu KickOff':                 { short: 'Reu KickOff',               desc: 'Reunion KickOff' },
  'Valor Agregado':              { short: 'Valor Agregado',             desc: 'Valor Agregado' },
  'Sel Ponente':                 { short: 'Sel Ponente',                desc: 'Selección Ponente' },
  'Llenado de Ficha C + P':      { short: 'Llenado Ficha C + P',        desc: 'Llenado de Ficha Técnica - Comercial y Ponente' },
  'Env Ficha Comercial':         { short: 'Env Ficha Comercial',        desc: 'Envío de ficha técnica a comercial' },
  'Rec Ficha Comercial':         { short: 'Rec Ficha Comercial',        desc: 'Recepción y revisión de ficha técnica de comercial' },
  'Env Ficha Ponente':           { short: 'Env Ficha Ponente',          desc: 'Envío de ficha técnica a ponente' },
  'Rec Ficha Ponente':           { short: 'Rec Ficha Ponente',          desc: 'Recepción y revisión de ficha técnica de ponente' },
  'Opti SEO Titulo':             { short: 'Optii SEO Titulo',           desc: 'Optiimizacion SEO del Título',              tipo: 'Posicionamiento SEO/SEM' },
  'Opti SEO Titulo (sub)':       { short: 'Optii SEO Titulo',           desc: 'Optiimización de SEO (Título)',              tipo: 'Posicionamiento SEO/SEM' },
  'Envio Mail SEO Ficha':        { short: 'Envio Mail SEO Ficha',       desc: 'Enviar email a SEO/Trafficker con ficha',   tipo: 'Posicionamiento SEO/SEM' },
  'Val Coord Esp SEO':           { short: 'Val Coord Esp SEO',          desc: 'Coordinadora valida con el especialista el SEO', tipo: 'Posicionamiento SEO/SEM' },
  'Preguntas de Sondeo':         { short: 'Preguntas de Sondeo',        desc: 'Preguntas de Sondeo' },
  'Env Mail Preg Esp':           { short: 'Env Mail Preg Esp',          desc: 'Email al especialista solicitando preguntas' },
  'Rec Preg Esp':                { short: 'Rec Preg Esp',               desc: 'Recepcionar las preguntas del especialista' },
  'Real Piezas Graficas':        { short: 'Real Piezas Graf',           desc: 'Realización de Piezas Gráficas',           tipo: 'Pieza Publicitaria' },
  'Solic Piezas Graficas':       { short: 'Solic Piezas Graf',          desc: 'Solicitar piezas gráficas a Diseñador',    tipo: 'Pieza Publicitaria' },
  'Diseño Opc Piezas':           { short: 'Diseño Opc Piezas',          desc: 'Diseñar opciones de piezas gráficas',      tipo: 'Pieza Publicitaria' },
  'Val Opc Piezas Esp':          { short: 'Val Opc Piezas Esp',         desc: 'Validar opciones con especialista',         tipo: 'Pieza Publicitaria' },
  'Diseño Piezas Falt':          { short: 'Diseño Piezas Falt',         desc: 'Diseñar piezas faltantes',                 tipo: 'Pieza Publicitaria' },
  'Recep Piezas Culm':           { short: 'Recep Piezas Culm',          desc: 'Recepcionar piezas culminadas',            tipo: 'Pieza Publicitaria' },
  'Crear Sesion Teams':          { short: 'Crear Sesion Teams',         desc: 'Crear Sesión Virtual Teams' },
  'Crear Reu Teams + Preg':      { short: 'Crear Reu Teams + Preg',     desc: 'Crear reunión y subir preguntas de sondeo' },
  'Publicidad RRSS':             { short: 'Publicidad RRSS',            desc: 'Publicidad RRSS',                          tipo: 'Difusión' },
  'Crear Copy Post':             { short: 'Crear Copy Post',            desc: 'Crear Copy del Post',                      tipo: 'Difusión' },
  'Configurar Meta Ads':         { short: 'Configurar Meta Ads',        desc: 'Configurar publicidad en Meta Ads',        tipo: 'Difusión' },
  'Activar Publicidad':          { short: 'Activar Publicidad',         desc: 'Activar Publicidad',                       tipo: 'Difusión' },
  'Sinc Publi + Hubspot':        { short: 'Sinc Publi + Hubspot',       desc: 'Sincronizar publicidad con HubSpot',       tipo: 'Difusión' },
  'Sinc Form Meta Zoom':         { short: 'Sinc Form Meta Zoom',        desc: 'Sincronizar Formulario Meta con Zoom',     tipo: 'Difusión' },
  'Val Publicidad Trafficker':   { short: 'Val Publicidad Trafficker',  desc: 'Trafficker valida la publicidad',          tipo: 'Difusión' },
  'Apagar Publicidad':           { short: 'Apagar Publicidad',          desc: 'Apagar publicidad',                        tipo: 'Difusión' },
  'LandP Pre Wbr':               { short: 'LandP Pre Wbr',              desc: 'Landing Page Pre Webinar',                 tipo: 'Landing' },
  'Sol Script Pre CM':           { short: 'Sol Script Pre CM',          desc: 'Solicitar Script de formulario Prewebinar', tipo: 'Landing' },
  'Envio Req WebM Pre':          { short: 'Envio Req WebM Pre',         desc: 'Enviar requerimiento a Web Manager (Pre)', tipo: 'Landing' },
  'Conf LandP WebM':             { short: 'Conf LandP WebM',            desc: 'Confirmación de Landing page Web Manager', tipo: 'Landing' },
  'Val Sinc LandP Zoom':         { short: 'Val Sinc LandP Zoom',        desc: 'Validar y Sincronizar Landing con Zoom',   tipo: 'Landing' },
  'Encuesta':                    { short: 'Encuesta',                   desc: 'Encuesta' },
  'Coord Preg Encuesta':         { short: 'Coord Preg Encuesta',        desc: 'Coordinar preguntas de la Encuesta' },
  'Crear Form Google':           { short: 'Crear Form Google',          desc: 'Crear y probar formulario en Google' },
  'Certificado':                 { short: 'Certificado',                desc: 'Certificado de Asistencia' },
  'Elab Cert PPT':               { short: 'Elab Cert PPT',              desc: 'Elaborar el certificado en PPT' },
  'Sinc Cert Encuesta':          { short: 'Sinc Cert Encuesta',         desc: 'Sincronizar el certificado con la encuesta' },
  'Presentación Comercial':      { short: 'Presentación Comercial',     desc: 'Presentación Comercial',                   tipo: 'KPIS' },
  'Cord Presentacion Comercial': { short: 'Cord Presentacion Comercial', desc: 'Coordinar contenido de la presentación',  tipo: 'KPIS' },
  'Armar Presentación PPT':      { short: 'Armar Presentación PPT',     desc: 'Armar la presentación en PPT',             tipo: 'KPIS' },
  'Día Evento':                  { short: 'Dia Evento',                 desc: 'Día del Evento',                           tipo: 'Generación de Demanda' },
  'Informe Resultados':          { short: 'Informe Resultados',         desc: 'Informe de Resultados',                    tipo: 'KPIS' },
  'Mail Agradecimiento':         { short: 'Mail Agradecimiento',        desc: 'Mail de Agradecimiento',                   tipo: 'Mailing' },
  'Env Req Mail CM Agrad':       { short: 'Env Req Mail CM Agrad',      desc: 'Requerimiento a CM (participantes + grabación)', tipo: 'Mailing' },
  'Val Env Mail CM Agrad':       { short: 'Val Env Mail CM Agrad',      desc: 'Validar envío de Mail por parte del CM',   tipo: 'Mailing' },
  'Video Youtube':               { short: 'Video Youtube',              desc: 'Video YouTube' },
  'Sol CM Sub Youtube':          { short: 'Sol CM Sub YT',              desc: 'Solicitar a CM editar y subir video a YouTube' },
  'Sub Video Youtube':           { short: 'Sub Video YT',               desc: 'CM notifica subida del video a YouTube' },
  'Val Sub Video Youtube':       { short: 'Val Sub Video YT',           desc: 'Validar que se haya subido el video' },
  'Ficha Post Wbr':              { short: 'Ficha Post Wbr',             desc: 'Ficha Postwebinar',                        tipo: 'Posicionamiento SEO/SEM' },
  'Env Ficha Exp Post Wbr':      { short: 'Env Ficha Exp Post Wbr',     desc: 'Enviar ficha a expositor por email',        tipo: 'Posicionamiento SEO/SEM' },
  'Rec Ficha Val Post Wbr':      { short: 'Rec Ficha Val Post Wbr',     desc: 'Recepción de ficha y validación',           tipo: 'Posicionamiento SEO/SEM' },
  'Env SEO Opti Post Wbr':       { short: 'Env SEO Opti Post Wbr',      desc: 'Enviar a SEO para Optiimización',           tipo: 'Posicionamiento SEO/SEM' },
  'Rec Ficha Opti Post Wbr':     { short: 'Rec Ficha Opti Post Wbr',    desc: 'Recepción de ficha Optiimizada',            tipo: 'Posicionamiento SEO/SEM' },
  'Env Ficha Opti Esp Post Wbr': { short: 'Env Ficha Opti Esp Post Wbr', desc: 'Enviar ficha Optiimizada a especialista', tipo: 'Posicionamiento SEO/SEM' },
  'Rec Ficha Opti Esp Post Wbr': { short: 'Rec Ficha Opti Esp Post Wbr', desc: 'Recepción de ficha revisada por especialista', tipo: 'Posicionamiento SEO/SEM' },
  'LandP Post Wbr':              { short: 'LandP Post Wbr',             desc: 'Landing Page Post Webinar',                tipo: 'Landing' },
  'Sol Script Hubspot Post Wbr': { short: 'Sol Script Hubspot Post Wbr', desc: 'Solicitar Script, lista HubSpot y correo a CM', tipo: 'Landing' },
  'Rec Script Hubspot Post Wbr': { short: 'Rec Script Hubspot Post Wbr', desc: 'Recepción de Script, lista HubSpot y correo', tipo: 'Landing' },
  'Env Req WebM Post Wbr':       { short: 'Env Req WebM Post Wbr',      desc: 'Enviar requerimiento a Web Manager (Post)', tipo: 'Landing' },
  'Conf Publi Artic Post Wbr':   { short: 'Conf Publi Artic Post Wbr',  desc: 'Confirmar publicación de artículo',         tipo: 'Landing' },
  'Sinc LandP Mail Post Wbr':    { short: 'Sinc LandP Mail Post Wbr',   desc: 'Sincronizar Landing con correo postwebinar', tipo: 'Landing' },
  'Prob Vinc Post Wbr':          { short: 'Prob Vinc Post Wbr',         desc: 'Probar vinculación del landing postwebinar', tipo: 'Landing' },
  'Cierre de Webinar':           { short: 'Cierre de Webinar',          desc: 'Cierre de Webinar',                        tipo: 'Generación de Demanda' },
}

type Rol = 'CO' | 'TR' | 'CM' | 'DI' | 'JE'

// CO=Coordinadora Eventos, TR=Trafficker SEO, CM=Content Manager, DI=Diseñador, JE=Jefe
const ASIGNACION: Record<number, Rol> = {
  // Coordinadora de Eventos (Pamela)
  2: 'CO', 3: 'CO', 4: 'CO',
  5: 'CO', 6: 'CO', 7: 'CO', 8: 'CO', 9: 'CO',
  14: 'CO', 15: 'CO', 16: 'CO',
  17: 'CO', 18: 'CO', 20: 'CO', 22: 'CO',
  23: 'CO', 24: 'CO',
  33: 'CO', 34: 'CO',
  38: 'CO', 39: 'CO', 40: 'CO',
  44: 'CO', 45: 'CO', 46: 'CO',
  47: 'CO', 48: 'CO',
  56: 'CO', 57: 'CO', 58: 'CO', 59: 'CO',
  63: 'CO', 64: 'CO', 65: 'CO', 67: 'CO', 68: 'CO', 69: 'CO', 70: 'CO',
  // Trafficker SEO (Claudia)
  10: 'TR', 11: 'TR', 12: 'TR', 13: 'TR',
  25: 'TR', 26: 'TR', 27: 'TR', 28: 'TR', 29: 'TR', 30: 'TR', 31: 'TR', 32: 'TR',
  35: 'TR', 36: 'TR',
  60: 'TR', 61: 'TR', 62: 'TR',
  // Content Manager (Nadia)
  37: 'CM',
  41: 'CM', 42: 'CM', 43: 'CM',
  49: 'CM', 50: 'CM', 51: 'CM',
  52: 'CM', 53: 'CM', 54: 'CM', 55: 'CM',
  66: 'CM',
  // Diseñador (Hector)
  19: 'DI', 21: 'DI',
}

const PARENT_MAP: Record<number, number> = {
  3: 2, 4: 2,
  6: 5, 7: 5, 8: 5, 9: 5,
  11: 10, 12: 10, 13: 10,
  15: 14, 16: 14,
  18: 17, 19: 17, 20: 17, 21: 17, 22: 17,
  24: 23,
  26: 25, 27: 25, 28: 25, 29: 25, 30: 25, 31: 25, 32: 25,
  34: 33, 35: 33, 36: 33, 37: 33,
  39: 38, 40: 38,
  42: 41, 43: 41,
  45: 44, 46: 44,
  50: 49, 51: 49,
  53: 52, 54: 52, 55: 52,
  57: 56, 58: 56, 59: 56, 60: 56, 61: 56, 62: 56,
  64: 63, 65: 63, 66: 63, 67: 63, 68: 63, 69: 63,
}

type TipoTarea = 'FASE' | 'ACT' | 'EVENTO'
const TASKS: { id: number; nombre: string; tipo: TipoTarea; offIni: number; offFin: number }[] = [
  { id: 2,  tipo: 'FASE',   nombre: 'Reu KickOff',                  offIni: -45, offFin: -41 },
  { id: 3,  tipo: 'ACT',    nombre: 'Valor Agregado',               offIni: -45, offFin: -45 },
  { id: 4,  tipo: 'ACT',    nombre: 'Sel Ponente',                  offIni: -45, offFin: -41 },
  { id: 5,  tipo: 'FASE',   nombre: 'Llenado de Ficha C + P',       offIni: -40, offFin: -33 },
  { id: 6,  tipo: 'ACT',    nombre: 'Env Ficha Comercial',          offIni: -40, offFin: -40 },
  { id: 7,  tipo: 'ACT',    nombre: 'Rec Ficha Comercial',          offIni: -40, offFin: -37 },
  { id: 8,  tipo: 'ACT',    nombre: 'Env Ficha Ponente',            offIni: -37, offFin: -37 },
  { id: 9,  tipo: 'ACT',    nombre: 'Rec Ficha Ponente',            offIni: -37, offFin: -33 },
  { id: 10, tipo: 'FASE',   nombre: 'Opti SEO Titulo',              offIni: -33, offFin: -33 },
  { id: 11, tipo: 'ACT',    nombre: 'Envio Mail SEO Ficha',         offIni: -33, offFin: -33 },
  { id: 12, tipo: 'ACT',    nombre: 'Opti SEO Titulo (sub)',        offIni: -33, offFin: -33 },
  { id: 13, tipo: 'ACT',    nombre: 'Val Coord Esp SEO',            offIni: -33, offFin: -33 },
  { id: 14, tipo: 'FASE',   nombre: 'Preguntas de Sondeo',          offIni: -32, offFin: -25 },
  { id: 15, tipo: 'ACT',    nombre: 'Env Mail Preg Esp',            offIni: -32, offFin: -32 },
  { id: 16, tipo: 'ACT',    nombre: 'Rec Preg Esp',                 offIni: -30, offFin: -25 },
  { id: 17, tipo: 'FASE',   nombre: 'Real Piezas Graficas',         offIni: -33, offFin: -27 },
  { id: 18, tipo: 'ACT',    nombre: 'Solic Piezas Graficas',        offIni: -33, offFin: -33 },
  { id: 19, tipo: 'ACT',    nombre: 'Diseño Opc Piezas',            offIni: -33, offFin: -30 },
  { id: 20, tipo: 'ACT',    nombre: 'Val Opc Piezas Esp',           offIni: -30, offFin: -30 },
  { id: 21, tipo: 'ACT',    nombre: 'Diseño Piezas Falt',           offIni: -30, offFin: -27 },
  { id: 22, tipo: 'ACT',    nombre: 'Recep Piezas Culm',            offIni: -27, offFin: -27 },
  { id: 23, tipo: 'FASE',   nombre: 'Crear Sesion Teams',           offIni: -27, offFin: -27 },
  { id: 24, tipo: 'ACT',    nombre: 'Crear Reu Teams + Preg',       offIni: -27, offFin: -27 },
  { id: 25, tipo: 'FASE',   nombre: 'Publicidad RRSS',              offIni: -26, offFin:   0 },
  { id: 26, tipo: 'ACT',    nombre: 'Crear Copy Post',              offIni: -26, offFin: -26 },
  { id: 27, tipo: 'ACT',    nombre: 'Configurar Meta Ads',          offIni: -26, offFin: -26 },
  { id: 28, tipo: 'ACT',    nombre: 'Activar Publicidad',           offIni: -21, offFin: -21 },
  { id: 29, tipo: 'ACT',    nombre: 'Sinc Publi + Hubspot',         offIni: -26, offFin: -26 },
  { id: 30, tipo: 'ACT',    nombre: 'Sinc Form Meta Zoom',          offIni: -26, offFin: -26 },
  { id: 31, tipo: 'ACT',    nombre: 'Val Publicidad Trafficker',    offIni: -26, offFin: -26 },
  { id: 32, tipo: 'ACT',    nombre: 'Apagar Publicidad',            offIni:   0, offFin:   0 },
  { id: 33, tipo: 'FASE',   nombre: 'LandP Pre Wbr',                offIni: -26, offFin: -20 },
  { id: 34, tipo: 'ACT',    nombre: 'Sol Script Pre CM',            offIni: -26, offFin: -25 },
  { id: 35, tipo: 'ACT',    nombre: 'Envio Req WebM Pre',           offIni: -24, offFin: -24 },
  { id: 36, tipo: 'ACT',    nombre: 'Conf LandP WebM',              offIni: -23, offFin: -20 },
  { id: 37, tipo: 'ACT',    nombre: 'Val Sinc LandP Zoom',          offIni: -20, offFin: -20 },
  { id: 38, tipo: 'FASE',   nombre: 'Encuesta',                     offIni: -19, offFin: -16 },
  { id: 39, tipo: 'ACT',    nombre: 'Coord Preg Encuesta',          offIni: -19, offFin: -16 },
  { id: 40, tipo: 'ACT',    nombre: 'Crear Form Google',            offIni: -16, offFin: -16 },
  { id: 41, tipo: 'FASE',   nombre: 'Certificado',                  offIni: -15, offFin: -15 },
  { id: 42, tipo: 'ACT',    nombre: 'Elab Cert PPT',                offIni: -15, offFin: -15 },
  { id: 43, tipo: 'ACT',    nombre: 'Sinc Cert Encuesta',           offIni: -15, offFin: -15 },
  { id: 44, tipo: 'FASE',   nombre: 'Presentación Comercial',       offIni: -13, offFin:  -9 },
  { id: 45, tipo: 'ACT',    nombre: 'Cord Presentacion Comercial',  offIni: -13, offFin: -11 },
  { id: 46, tipo: 'ACT',    nombre: 'Armar Presentación PPT',       offIni: -11, offFin:  -9 },
  { id: 47, tipo: 'EVENTO', nombre: 'Día Evento',                   offIni:   0, offFin:   0 },
  { id: 48, tipo: 'ACT',    nombre: 'Informe Resultados',           offIni:   1, offFin:   1 },
  { id: 49, tipo: 'FASE',   nombre: 'Mail Agradecimiento',          offIni:   1, offFin:   1 },
  { id: 50, tipo: 'ACT',    nombre: 'Env Req Mail CM Agrad',        offIni:   1, offFin:   1 },
  { id: 51, tipo: 'ACT',    nombre: 'Val Env Mail CM Agrad',        offIni:   1, offFin:   1 },
  { id: 52, tipo: 'FASE',   nombre: 'Video Youtube',                offIni:   1, offFin:   5 },
  { id: 53, tipo: 'ACT',    nombre: 'Sol CM Sub Youtube',           offIni:   1, offFin:   1 },
  { id: 54, tipo: 'ACT',    nombre: 'Sub Video Youtube',            offIni:   2, offFin:   5 },
  { id: 55, tipo: 'ACT',    nombre: 'Val Sub Video Youtube',        offIni:   5, offFin:   5 },
  { id: 56, tipo: 'FASE',   nombre: 'Ficha Post Wbr',               offIni:   1, offFin:   9 },
  { id: 57, tipo: 'ACT',    nombre: 'Env Ficha Exp Post Wbr',       offIni:   1, offFin:   1 },
  { id: 58, tipo: 'ACT',    nombre: 'Rec Ficha Val Post Wbr',       offIni:   1, offFin:   5 },
  { id: 59, tipo: 'ACT',    nombre: 'Env SEO Opti Post Wbr',        offIni:   5, offFin:   5 },
  { id: 60, tipo: 'ACT',    nombre: 'Rec Ficha Opti Post Wbr',      offIni:   6, offFin:   6 },
  { id: 61, tipo: 'ACT',    nombre: 'Env Ficha Opti Esp Post Wbr',  offIni:   6, offFin:   6 },
  { id: 62, tipo: 'ACT',    nombre: 'Rec Ficha Opti Esp Post Wbr',  offIni:   6, offFin:   9 },
  { id: 63, tipo: 'FASE',   nombre: 'LandP Post Wbr',               offIni:   9, offFin:  12 },
  { id: 64, tipo: 'ACT',    nombre: 'Sol Script Hubspot Post Wbr',  offIni:   9, offFin:   9 },
  { id: 65, tipo: 'ACT',    nombre: 'Rec Script Hubspot Post Wbr',  offIni:  10, offFin:  10 },
  { id: 66, tipo: 'ACT',    nombre: 'Env Req WebM Post Wbr',        offIni:  10, offFin:  10 },
  { id: 67, tipo: 'ACT',    nombre: 'Conf Publi Artic Post Wbr',    offIni:  10, offFin:  12 },
  { id: 68, tipo: 'ACT',    nombre: 'Sinc LandP Mail Post Wbr',     offIni:  12, offFin:  12 },
  { id: 69, tipo: 'ACT',    nombre: 'Prob Vinc Post Wbr',           offIni:  12, offFin:  12 },
  { id: 70, tipo: 'ACT',    nombre: 'Cierre de Webinar',            offIni:  12, offFin:  12 },
]

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

async function main() {
  const users = await prisma.user.findMany({
    where: { puestoId: { in: ['puesto-eventos', 'puesto-trafficker', 'puesto-content-manager', 'puesto-disenador', 'puesto-jefe-marketing'] } },
    select: { id: true, nombre: true, puestoId: true }
  })

  const byPuesto: Record<string, string> = {}
  users.forEach((u: any) => { byPuesto[u.puestoId] = u.id })

  const ROL_TO_USER: Record<Rol, string> = {
    CO: byPuesto['puesto-eventos'],
    TR: byPuesto['puesto-trafficker'],
    CM: byPuesto['puesto-content-manager'],
    DI: byPuesto['puesto-disenador'],
    JE: byPuesto['puesto-jefe-marketing'],
  }

  console.log('Mapeo de roles:')
  users.forEach((u: any) => console.log(`  ${u.puestoId.replace('puesto-', '')} → ${u.nombre}`))

  // Limpiar todo
  await prisma.dependenciaInstancia.deleteMany({})
  await prisma.checklistItemMarcado.deleteMany({})
  await prisma.tareaInstancia.deleteMany({})
  const delWf = await prisma.workflowInstancia.deleteMany({})
  console.log(`\nProyectos anteriores eliminados: ${delWf.count}`)

  // Crear proyectos con asignación correcta
  for (const wbr of WEBINARS) {
    const fechaHito = new Date(wbr.fechaEvento)

    const instancia = await prisma.workflowInstancia.create({
      data: {
        plantillaId:          PLANTILLA_ID,
        nombre:               wbr.nombre,
        contextoMarca:        wbr.marca,
        negocio:              wbr.negocio,
        fechaHito,
        estadoGeneral:        'ACTIVO',
        responsableGeneralId: ROL_TO_USER['JE'],
      },
    })

    const idMap: Record<number, string> = {}

    for (const t of TASKS) {
      const nom     = NOM[t.nombre] ?? { short: t.nombre, desc: t.nombre }
      const rol     = ASIGNACION[t.id] ?? 'CO'
      const userId  = ROL_TO_USER[rol]
      const durDias = t.offFin - t.offIni + 1

      const tarea = await prisma.tareaInstancia.create({
        data: {
          workflowInstanciaId:    instancia.id,
          asignadoAId:            userId,
          origen:                 'ASIGNADA_JEFE',
          estado:                 'PENDIENTE',
          nombreAdHoc:            nom.short,
          descripcionAdHoc:       nom.tipo ? `[${nom.tipo}] ${nom.desc}` : nom.desc,
          puntosBaseAdHoc:        5,
          tiempoEstimadoMinAdHoc: durDias * 480,
          tiempoEstimadoMaxAdHoc: durDias * 480,
          fechaEstimadaInicio:    addDays(fechaHito, t.offIni),
          fechaEstimadaFin:       addDays(fechaHito, t.offFin),
          esHito:                 t.tipo === 'EVENTO',
          ordenGantt:             t.id,
          negocio:                wbr.negocio,
          duracionMinutos:        durDias * 480,
        },
      })
      idMap[t.id] = tarea.id
    }

    for (const t of TASKS) {
      const parentExcelId = PARENT_MAP[t.id]
      if (parentExcelId) {
        await prisma.tareaInstancia.update({
          where: { id: idMap[t.id] },
          data:  { parentId: idMap[parentExcelId] },
        })
      }
    }

    console.log(`✓ ${wbr.nombre}`)
  }

  // Resumen por usuario
  const resumen = await prisma.tareaInstancia.groupBy({ by: ['asignadoAId'], _count: { id: true } })
  const totalTareas = resumen.reduce((s: number, r: any) => s + r._count.id, 0)
  console.log(`\nTotal tareas: ${totalTareas}`)
  for (const r of resumen) {
    const u = users.find((x: any) => x.id === r.asignadoAId)
    console.log(`  ${(u?.nombre ?? 'desconocido').padEnd(15)}: ${r._count.id} tareas`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
