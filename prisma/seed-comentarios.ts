import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

/**
 * Seed de comentarios, likes y cursos relacionados.
 * Requiere que seed.ts y seed-post-auth.ts ya corrieran.
 *
 * Ejecutar: npm run db:seed-comentarios
 */
async function main() {
  console.log("Sembrando comentarios, likes y cursos relacionados...\n");

  const [admin, ana, carlos, maria, jefeMkt] = await Promise.all([
    prisma.user.findUnique({ where: { email: "admin@educanet.local" } }),
    prisma.user.findUnique({ where: { email: "ana.garcia@educanet.local" } }),
    prisma.user.findUnique({ where: { email: "carlos.lopez@educanet.local" } }),
    prisma.user.findUnique({ where: { email: "maria.torres@educanet.local" } }),
    prisma.user.findUnique({ where: { email: "jefe.marketing@educanet.local" } }),
  ]);

  if (!admin || !ana || !carlos || !maria || !jefeMkt) {
    console.error("Usuarios faltantes. Corre primero db:seed-post-auth.");
    process.exit(1);
  }

  const induccion = await prisma.curso.findUnique({
    where: { slug: "induccion-empresa" },
    include: {
      modulos: {
        orderBy: { orden: "asc" },
        include: { lecciones: { orderBy: { orden: "asc" } } },
      },
    },
  });
  const marketing = await prisma.curso.findUnique({
    where: { slug: "fundamentos-marketing-digital" },
    include: {
      modulos: {
        orderBy: { orden: "asc" },
        include: { lecciones: { orderBy: { orden: "asc" } } },
      },
    },
  });

  if (!induccion || !marketing) {
    console.error("No encuentro los cursos base. Corre primero db:seed.");
    process.exit(1);
  }

  const primeraInduccion = induccion.modulos[0]?.lecciones[0];
  const segundaInduccion = induccion.modulos[0]?.lecciones[1] ?? primeraInduccion;
  const primeraMkt = marketing.modulos[0]?.lecciones[0];
  const segundaMkt = marketing.modulos[0]?.lecciones[1] ?? primeraMkt;

  if (!primeraInduccion || !primeraMkt) {
    console.error("Cursos sin lecciones.");
    process.exit(1);
  }

  // Limpiar existentes de estos dos cursos para idempotencia
  const leccionesInduccion = induccion.modulos.flatMap((m) =>
    m.lecciones.map((l) => l.id)
  );
  const leccionesMkt = marketing.modulos.flatMap((m) =>
    m.lecciones.map((l) => l.id)
  );
  await prisma.comentario.deleteMany({
    where: { leccionId: { in: [...leccionesInduccion, ...leccionesMkt] } },
  });
  await prisma.cursoRelacionado.deleteMany({
    where: {
      OR: [
        { cursoOrigenId: induccion.id },
        { cursoOrigenId: marketing.id },
      ],
    },
  });

  // ─── Induccion: 8 comentarios top-level + hilos ─────────────────────────
  const c1 = await prisma.comentario.create({
    data: {
      userId: ana.id,
      leccionId: primeraInduccion.id,
      contenido:
        "Muy buena bienvenida! Me quedo clarisimo el diferencial de la empresa.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  });
  const c2 = await prisma.comentario.create({
    data: {
      userId: carlos.id,
      leccionId: primeraInduccion.id,
      contenido:
        "Agregaria mas ejemplos del area de Ventas, pero en general muy util para ubicarte.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
    },
  });
  await prisma.comentario.create({
    data: {
      userId: maria.id,
      leccionId: primeraInduccion.id,
      contenido:
        "Recien empiezo y me ayuda mucho este recorrido por la cultura del equipo.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  });
  const c4 = await prisma.comentario.create({
    data: {
      userId: jefeMkt.id,
      leccionId: primeraInduccion.id,
      contenido:
        "Excelente material. Chicos, aprovechen para conectar con la gente de otras areas en sus primeros dias.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
  });
  const c5 = await prisma.comentario.create({
    data: {
      userId: ana.id,
      leccionId: segundaInduccion.id,
      contenido:
        "Me quede con una duda sobre los canales de comunicacion interna. Alguien ya lo uso?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
  });

  // Respuestas al c1
  await prisma.comentario.create({
    data: {
      userId: jefeMkt.id,
      leccionId: primeraInduccion.id,
      comentarioPadreId: c1.id,
      contenido: "Gracias Ana, me alegra que te sirviera!",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 46),
    },
  });
  await prisma.comentario.create({
    data: {
      userId: maria.id,
      leccionId: primeraInduccion.id,
      comentarioPadreId: c1.id,
      contenido: "+1, me encanto la parte de la historia de la empresa.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40),
    },
  });
  // Respuesta al c5
  await prisma.comentario.create({
    data: {
      userId: carlos.id,
      leccionId: segundaInduccion.id,
      comentarioPadreId: c5.id,
      contenido:
        "Ana, el canal oficial es Slack. RRHH te agrega en los primeros dias.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  });

  // ─── Marketing: 5 comentarios ───────────────────────────────────────────
  const m1 = await prisma.comentario.create({
    data: {
      userId: carlos.id,
      leccionId: primeraMkt.id,
      contenido:
        "Muy claro el concepto de funnel. Aplica igual para B2B o lo adaptan?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  });
  const m2 = await prisma.comentario.create({
    data: {
      userId: ana.id,
      leccionId: primeraMkt.id,
      contenido:
        "Yo ya lo aplique en mi primer brief y me ahorro como 3 iteraciones con el jefe.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60),
    },
  });
  await prisma.comentario.create({
    data: {
      userId: maria.id,
      leccionId: primeraMkt.id,
      contenido: "Me gustaria ver un ejemplo real del negocio. Algun caso?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
    },
  });
  await prisma.comentario.create({
    data: {
      userId: ana.id,
      leccionId: segundaMkt.id,
      contenido:
        "Los KPIs que mencionan son los que tenemos en el panel de control actual?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    },
  });
  await prisma.comentario.create({
    data: {
      userId: jefeMkt.id,
      leccionId: primeraMkt.id,
      comentarioPadreId: m1.id,
      contenido:
        "Carlos, en B2B lo adaptamos alargando el middle of funnel y sumando nurturing por email.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 70),
    },
  });

  // ─── Likes ──────────────────────────────────────────────────────────────
  const likes: Array<[string, string]> = [
    [carlos.id, c1.id],
    [maria.id, c1.id],
    [jefeMkt.id, c1.id],
    [ana.id, c2.id],
    [jefeMkt.id, c4.id],
    [ana.id, c4.id],
    [carlos.id, c4.id],
    [maria.id, c4.id],
    [ana.id, m1.id],
    [maria.id, m1.id],
    [carlos.id, m2.id],
    [jefeMkt.id, m2.id],
  ];

  for (const [userId, comentarioId] of likes) {
    await prisma.comentarioLike.upsert({
      where: { userId_comentarioId: { userId, comentarioId } },
      create: { userId, comentarioId },
      update: {},
    });
  }

  // ─── Cursos relacionados ───────────────────────────────────────────────
  await prisma.cursoRelacionado.create({
    data: {
      cursoOrigenId: induccion.id,
      cursoDestinoId: marketing.id,
      orden: 0,
    },
  });
  await prisma.cursoRelacionado.create({
    data: {
      cursoOrigenId: marketing.id,
      cursoDestinoId: induccion.id,
      orden: 0,
    },
  });

  console.log("  ✓ Comentarios: 13 (incluyendo respuestas)");
  console.log(`  ✓ Likes: ${likes.length}`);
  console.log("  ✓ Cursos relacionados: 2");
  console.log("\nListo.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
