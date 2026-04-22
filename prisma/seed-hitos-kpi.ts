import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { HITOS_POR_PUESTO, validarCatalogo } from "../lib/kpis/hitos-seed";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Mapeo de "kpisKey" del seed-piloto-marketing.ts a la nueva clave del catalogo
// de hitos. La clave nueva ASISTENTE_PLANIFICACION reemplaza al puesto viejo
// ASISTENTE_EVENTOS para Pamela.
const PUESTO_A_KPIS_KEY: Record<string, keyof typeof HITOS_POR_PUESTO> = {
  "Disenador Grafico": "DISENADOR_GRAFICO",
  "Content Manager": "CONTENT_MANAGER",
  "Trafficker / SEO / SEM": "TRAFFICKER",
  "Asistente de Planificacion": "ASISTENTE_PLANIFICACION",
};

async function main() {
  console.log("Sembrando catalogo de hitos KPI...\n");

  const errores = validarCatalogo();
  if (errores.length) {
    console.error("Errores en el catalogo:");
    errores.forEach((e) => console.error("  - " + e));
    process.exit(1);
  }
  console.log("  Catalogo validado: 4 puestos x 1000 pts/mes\n");

  // 0. Asegurar que existan los puestos del piloto (idempotente).
  // Asistente de Planificacion es nuevo (no estaba en el seed original).
  const marketing = await prisma.area.findUnique({
    where: { nombre: "Marketing" },
    select: { id: true },
  });
  if (marketing) {
    await prisma.puesto.upsert({
      where: { id: "puesto-asistente-planificacion" },
      create: {
        id: "puesto-asistente-planificacion",
        nombre: "Asistente de Planificacion",
        nivel: 1,
        areaId: marketing.id,
        descripcion:
          "Coordinacion de webinars y eventos, calendario maestro, reportes.",
        orden: 15,
      },
      update: {},
    });
    console.log("  Puesto 'Asistente de Planificacion' asegurado.");
  }

  // 1. Desactivar definiciones legacy de los puestos del piloto
  // (las viejas con peso/tipoMeta y sin frecuencia)
  const puestosNuevos = Object.keys(PUESTO_A_KPIS_KEY);
  const desactivados = await prisma.puestoKpiDefinicion.updateMany({
    where: {
      puesto: { nombre: { in: puestosNuevos } },
      frecuencia: null,
    },
    data: { activa: false },
  });
  console.log(`  Definiciones legacy desactivadas: ${desactivados.count}`);

  // 2. Upsert de los 48 hitos nuevos
  let total = 0;
  for (const [nombrePuesto, kpisKey] of Object.entries(PUESTO_A_KPIS_KEY)) {
    const puesto = await prisma.puesto.findFirst({
      where: { nombre: nombrePuesto },
    });
    if (!puesto) {
      console.warn(`  Puesto "${nombrePuesto}" no existe, salto sus hitos.`);
      continue;
    }
    const hitos = HITOS_POR_PUESTO[kpisKey];
    let creadosPuesto = 0;
    for (let i = 0; i < hitos.length; i++) {
      const h = hitos[i];
      await prisma.puestoKpiDefinicion.upsert({
        where: {
          puestoId_codigo: { puestoId: puesto.id, codigo: h.codigo },
        },
        create: {
          puestoId: puesto.id,
          codigo: h.codigo,
          nombre: h.nombre,
          descripcion: h.descripcion,
          frecuencia: h.frecuencia,
          puntos: h.puntos,
          puntosMaxMes: h.puntosMaxMes,
          requiereEvidencia: h.requiereEvidencia,
          esCondicional: h.esCondicional,
          cantidadMaxMes: h.cantidadMaxMes ?? null,
          activa: true,
          orden: i + 1,
        },
        update: {
          nombre: h.nombre,
          descripcion: h.descripcion,
          frecuencia: h.frecuencia,
          puntos: h.puntos,
          puntosMaxMes: h.puntosMaxMes,
          requiereEvidencia: h.requiereEvidencia,
          esCondicional: h.esCondicional,
          cantidadMaxMes: h.cantidadMaxMes ?? null,
          activa: true,
          orden: i + 1,
        },
      });
      creadosPuesto++;
      total++;
    }
    console.log(`  ${nombrePuesto}: ${creadosPuesto} hitos`);
  }

  console.log(`\nTotal hitos sembrados: ${total} (esperado: 47)`);
  console.log("Listo.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
