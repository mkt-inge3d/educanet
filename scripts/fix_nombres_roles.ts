/**
 * Recrea todas las TareaInstancia con los nombres y roles correctos
 * según la tabla provista por el usuario.
 * Mantiene los WorkflowInstancia intactos.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as any) as any;

type Rol = "CO" | "TR" | "CM";
type Tipo = "FASE" | "ACT" | "EVENTO";

const TASKS: { id: number; rol: Rol; nombre: string; tipo: Tipo; offIni: number; offFin: number }[] = [
  { id: 2,  rol:"CO", nombre:"Reu KickOff",                  tipo:"FASE",   offIni:-45, offFin:-41 },
  { id: 3,  rol:"CO", nombre:"Valor Agregado",               tipo:"ACT",    offIni:-45, offFin:-45 },
  { id: 4,  rol:"CO", nombre:"Sel Ponente",                  tipo:"ACT",    offIni:-45, offFin:-41 },
  { id: 5,  rol:"CO", nombre:"Llenado de Ficha C + P",       tipo:"FASE",   offIni:-40, offFin:-33 },
  { id: 6,  rol:"CO", nombre:"Env Ficha Comercial",          tipo:"ACT",    offIni:-40, offFin:-40 },
  { id: 7,  rol:"CO", nombre:"Rec Ficha Comercial",          tipo:"ACT",    offIni:-40, offFin:-37 },
  { id: 8,  rol:"CO", nombre:"Env Ficha Ponente",            tipo:"ACT",    offIni:-37, offFin:-37 },
  { id: 9,  rol:"CO", nombre:"Rec Ficha Ponente",            tipo:"ACT",    offIni:-37, offFin:-33 },
  { id: 10, rol:"CO", nombre:"Opti SEO Titulo",              tipo:"FASE",   offIni:-33, offFin:-33 },
  { id: 11, rol:"CO", nombre:"Envio Mail SEO Ficha",         tipo:"ACT",    offIni:-33, offFin:-33 },
  { id: 12, rol:"TR", nombre:"Opti SEO Titulo (sub)",        tipo:"ACT",    offIni:-33, offFin:-33 },
  { id: 13, rol:"CO", nombre:"Val Coord Esp SEO",            tipo:"ACT",    offIni:-33, offFin:-33 },
  { id: 14, rol:"CO", nombre:"Preguntas de Sondeo",          tipo:"FASE",   offIni:-32, offFin:-25 },
  { id: 15, rol:"CO", nombre:"Env Mail Preg Esp",            tipo:"ACT",    offIni:-32, offFin:-32 },
  { id: 16, rol:"CO", nombre:"Rec Preg Esp",                 tipo:"ACT",    offIni:-30, offFin:-25 },
  { id: 17, rol:"CO", nombre:"Real Piezas Graficas",         tipo:"FASE",   offIni:-33, offFin:-27 },
  { id: 18, rol:"CO", nombre:"Solic Piezas Graficas",        tipo:"ACT",    offIni:-33, offFin:-33 },
  { id: 19, rol:"CO", nombre:"Diseño Opc Piezas",            tipo:"ACT",    offIni:-33, offFin:-30 },
  { id: 20, rol:"CO", nombre:"Val Opc Piezas Esp",           tipo:"ACT",    offIni:-30, offFin:-30 },
  { id: 21, rol:"CO", nombre:"Diseño Piezas Falt",           tipo:"ACT",    offIni:-30, offFin:-27 },
  { id: 22, rol:"CO", nombre:"Recep Piezas Culm",            tipo:"ACT",    offIni:-27, offFin:-27 },
  { id: 23, rol:"CO", nombre:"Crear Sesion Teams",           tipo:"FASE",   offIni:-27, offFin:-27 },
  { id: 24, rol:"CO", nombre:"Crear Reu Teams + Preg",       tipo:"ACT",    offIni:-27, offFin:-27 },
  { id: 25, rol:"CO", nombre:"Publicidad RRSS",              tipo:"FASE",   offIni:-26, offFin:  0 },
  { id: 26, rol:"CO", nombre:"Crear Copy Post",              tipo:"ACT",    offIni:-26, offFin:-26 },
  { id: 27, rol:"TR", nombre:"Configurar Meta Ads",          tipo:"ACT",    offIni:-26, offFin:-26 },
  { id: 28, rol:"TR", nombre:"Activar Publicidad",           tipo:"ACT",    offIni:-21, offFin:-21 },
  { id: 29, rol:"TR", nombre:"Sinc Publi + Hubspot",         tipo:"ACT",    offIni:-26, offFin:-26 },
  { id: 30, rol:"TR", nombre:"Sinc Form Meta Zoom",          tipo:"ACT",    offIni:-26, offFin:-26 },
  { id: 31, rol:"TR", nombre:"Val Publicidad Trafficker",    tipo:"ACT",    offIni:-26, offFin:-26 },
  { id: 32, rol:"TR", nombre:"Apagar Publicidad",            tipo:"ACT",    offIni:  0, offFin:  0 },
  { id: 33, rol:"CO", nombre:"LandP Pre Wbr",                tipo:"FASE",   offIni:-26, offFin:-20 },
  { id: 34, rol:"CO", nombre:"Sol Script Pre CM",            tipo:"ACT",    offIni:-26, offFin:-25 },
  { id: 35, rol:"TR", nombre:"Envio Req WebM Pre",           tipo:"ACT",    offIni:-24, offFin:-24 },
  { id: 36, rol:"TR", nombre:"Conf LandP WebM",              tipo:"ACT",    offIni:-23, offFin:-20 },
  { id: 37, rol:"TR", nombre:"Val Sinc LandP Zoom",          tipo:"ACT",    offIni:-20, offFin:-20 },
  { id: 38, rol:"CO", nombre:"Encuesta",                     tipo:"FASE",   offIni:-19, offFin:-16 },
  { id: 39, rol:"CO", nombre:"Coord Preg Encuesta",          tipo:"ACT",    offIni:-19, offFin:-16 },
  { id: 40, rol:"CO", nombre:"Crear Form Google",            tipo:"ACT",    offIni:-16, offFin:-16 },
  { id: 41, rol:"CO", nombre:"Certificado",                  tipo:"FASE",   offIni:-15, offFin:-15 },
  { id: 42, rol:"CM", nombre:"Elab Cert PPT",                tipo:"ACT",    offIni:-15, offFin:-15 },
  { id: 43, rol:"CM", nombre:"Sinc Cert Encuesta",           tipo:"ACT",    offIni:-15, offFin:-15 },
  { id: 44, rol:"CO", nombre:"Presentación Comercial",       tipo:"FASE",   offIni:-13, offFin: -9 },
  { id: 45, rol:"CO", nombre:"Cord Presentacion Comercial",  tipo:"ACT",    offIni:-13, offFin:-11 },
  { id: 46, rol:"CO", nombre:"Armar Presentación PPT",       tipo:"ACT",    offIni:-11, offFin: -9 },
  { id: 47, rol:"CO", nombre:"Día Evento",                   tipo:"EVENTO", offIni:  0, offFin:  0 },
  { id: 48, rol:"CO", nombre:"Informe Resultados",           tipo:"ACT",    offIni:  1, offFin:  1 },
  { id: 49, rol:"CO", nombre:"Mail Agradecimiento",          tipo:"FASE",   offIni:  1, offFin:  1 },
  { id: 50, rol:"CM", nombre:"Env Req Mail CM Agrad",        tipo:"ACT",    offIni:  1, offFin:  1 },
  { id: 51, rol:"CM", nombre:"Val Env Mail CM Agrad",        tipo:"ACT",    offIni:  1, offFin:  1 },
  { id: 52, rol:"CO", nombre:"Video Youtube",                tipo:"FASE",   offIni:  1, offFin:  5 },
  { id: 53, rol:"CO", nombre:"Sol CM Sub Youtube",           tipo:"ACT",    offIni:  1, offFin:  1 },
  { id: 54, rol:"CM", nombre:"Sub Video Youtube",            tipo:"ACT",    offIni:  2, offFin:  5 },
  { id: 55, rol:"CM", nombre:"Val Sub Video Youtube",        tipo:"ACT",    offIni:  5, offFin:  5 },
  { id: 56, rol:"CO", nombre:"Ficha Post Wbr",               tipo:"FASE",   offIni:  1, offFin:  9 },
  { id: 57, rol:"CO", nombre:"Env Ficha Exp Post Wbr",       tipo:"ACT",    offIni:  1, offFin:  1 },
  { id: 58, rol:"CO", nombre:"Rec Ficha Val Post Wbr",       tipo:"ACT",    offIni:  1, offFin:  5 },
  { id: 59, rol:"CO", nombre:"Env SEO Opti Post Wbr",        tipo:"ACT",    offIni:  5, offFin:  5 },
  { id: 60, rol:"CO", nombre:"Rec Ficha Opti Post Wbr",      tipo:"ACT",    offIni:  6, offFin:  6 },
  { id: 61, rol:"CO", nombre:"Env Ficha Opti Esp Post Wbr",  tipo:"ACT",    offIni:  6, offFin:  6 },
  { id: 62, rol:"CO", nombre:"Rec Ficha Opti Esp Post Wbr",  tipo:"ACT",    offIni:  6, offFin:  9 },
  { id: 63, rol:"CO", nombre:"LandP Post Wbr",               tipo:"FASE",   offIni:  9, offFin: 12 },
  { id: 64, rol:"CM", nombre:"Sol Script Hubspot Post Wbr",  tipo:"ACT",    offIni:  9, offFin:  9 },
  { id: 65, rol:"CM", nombre:"Rec Script Hubspot Post Wbr",  tipo:"ACT",    offIni: 10, offFin: 10 },
  { id: 66, rol:"CM", nombre:"Env Req WebM Post Wbr",        tipo:"ACT",    offIni: 10, offFin: 10 },
  { id: 67, rol:"CM", nombre:"Conf Publi Artic Post Wbr",    tipo:"ACT",    offIni: 10, offFin: 12 },
  { id: 68, rol:"CM", nombre:"Sinc LandP Mail Post Wbr",     tipo:"ACT",    offIni: 12, offFin: 12 },
  { id: 69, rol:"CM", nombre:"Prob Vinc Post Wbr",           tipo:"ACT",    offIni: 12, offFin: 12 },
  { id: 70, rol:"CO", nombre:"Cierre de Webinar",            tipo:"ACT",    offIni: 12, offFin: 12 },
];

const PARENT_MAP: Record<number, number> = {
  3:2, 4:2,
  6:5, 7:5, 8:5, 9:5,
  11:10, 12:10, 13:10,
  15:14, 16:14,
  18:17, 19:17, 20:17, 21:17, 22:17,
  24:23,
  26:25, 27:25, 28:25, 29:25, 30:25, 31:25, 32:25,
  34:33, 35:33, 36:33, 37:33,
  39:38, 40:38,
  42:41, 43:41,
  45:44, 46:44,
  50:49, 51:49,
  53:52, 54:52, 55:52,
  57:56, 58:56, 59:56, 60:56, 61:56, 62:56,
  64:63, 65:63, 66:63, 67:63, 68:63, 69:63,
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function crearTareasParaUsuario(
  wfId: string,
  fechaHito: Date,
  negocio: string,
  rolToUser: Record<Rol, string>,
) {
  const idMap: Record<number, string> = {};

  for (const t of TASKS) {
    const userId = rolToUser[t.rol];
    if (!userId) continue;

    const durDias = t.offFin - t.offIni + 1;
    const tarea = await prisma.tareaInstancia.create({
      data: {
        workflowInstanciaId:    wfId,
        asignadoAId:            userId,
        origen:                 "ASIGNADA_JEFE",
        estado:                 "PENDIENTE",
        nombreAdHoc:            t.nombre,
        descripcionAdHoc:       t.nombre,
        puntosBaseAdHoc:        5,
        tiempoEstimadoMinAdHoc: durDias * 480,
        tiempoEstimadoMaxAdHoc: durDias * 480,
        fechaEstimadaInicio:    addDays(fechaHito, t.offIni),
        fechaEstimadaFin:       addDays(fechaHito, t.offFin),
        esHito:                 t.tipo === "EVENTO",
        ordenGantt:             t.id,
        negocio,
        duracionMinutos:        durDias * 480,
      },
    });
    idMap[t.id] = tarea.id;
  }

  // Segunda pasada: parentId
  for (const t of TASKS) {
    const parentExcelId = PARENT_MAP[t.id];
    if (!parentExcelId || !idMap[t.id] || !idMap[parentExcelId]) continue;
    await prisma.tareaInstancia.update({
      where: { id: idMap[t.id] },
      data:  { parentId: idMap[parentExcelId] },
    });
  }

  return idMap;
}

async function main() {
  // Obtener usuarios por puesto
  const users = await prisma.user.findMany({
    where: {
      puestoId: { in: ["puesto-eventos", "puesto-trafficker", "puesto-content-manager"] },
      activo: true,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, nombre: true, apellido: true, puestoId: true },
  });

  // Un usuario de referencia por puesto (el más antiguo)
  const byPuesto: Record<string, string> = {};
  for (const u of users) {
    if (!byPuesto[u.puestoId]) byPuesto[u.puestoId] = u.id;
  }

  const rolToUser: Record<Rol, string> = {
    CO: byPuesto["puesto-eventos"],
    TR: byPuesto["puesto-trafficker"],
    CM: byPuesto["puesto-content-manager"],
  };

  console.log("Usuarios de referencia:");
  for (const [puesto, id] of Object.entries(byPuesto)) {
    const u = users.find((x: any) => x.id === id);
    console.log(`  ${puesto.replace("puesto-", "")} → ${u?.nombre} ${u?.apellido}`);
  }

  // Limpiar todas las TareaInstancia existentes
  await prisma.dependenciaInstancia.deleteMany({});
  await prisma.checklistItemMarcado.deleteMany({});
  const del = await prisma.tareaInstancia.deleteMany({});
  console.log(`\nTareas eliminadas: ${del.count}`);

  // Obtener proyectos existentes
  const workflows = await prisma.workflowInstancia.findMany({
    select: { id: true, nombre: true, fechaHito: true, negocio: true },
    orderBy: { fechaHito: "asc" },
  });
  console.log(`Proyectos encontrados: ${workflows.length}`);

  let totalCreadas = 0;

  for (const wf of workflows) {
    process.stdout.write(`  ${wf.nombre} ... `);
    await crearTareasParaUsuario(wf.id, wf.fechaHito, wf.negocio, rolToUser);
    totalCreadas += TASKS.length;
    console.log(`${TASKS.length} tareas`);
  }

  console.log(`\nTotal creadas (usuarios base): ${totalCreadas}`);

  // Usuarios extra con el mismo puesto (ej: king con puesto-eventos)
  const extraCO = users.filter(
    (u: any) => u.puestoId === "puesto-eventos" && u.id !== rolToUser["CO"]
  );
  const extraTR = users.filter(
    (u: any) => u.puestoId === "puesto-trafficker" && u.id !== rolToUser["TR"]
  );
  const extraCM = users.filter(
    (u: any) => u.puestoId === "puesto-content-manager" && u.id !== rolToUser["CM"]
  );

  const extras = [
    ...extraCO.map((u: any) => ({ ...u, rol: "CO" as Rol })),
    ...extraTR.map((u: any) => ({ ...u, rol: "TR" as Rol })),
    ...extraCM.map((u: any) => ({ ...u, rol: "CM" as Rol })),
  ];

  if (extras.length > 0) {
    console.log(`\nUsuarios extra (misma asignación por rol):`);
    for (const extra of extras) {
      console.log(`  ${extra.nombre} ${extra.apellido} (${extra.puestoId})`);
      for (const wf of workflows) {
        const altRolToUser = { ...rolToUser, [extra.rol]: extra.id };
        await crearTareasParaUsuario(wf.id, wf.fechaHito, wf.negocio, altRolToUser);
        totalCreadas += TASKS.length;
      }
    }
  }

  console.log(`\nTotal final: ${totalCreadas} tareas`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
