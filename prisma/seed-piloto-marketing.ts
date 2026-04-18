import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { KPIS_POR_PUESTO } from "../lib/kpis/definiciones-seed";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

/**
 * Piloto de Marketing: 5 puestos + definiciones de KPI + usuarios del piloto
 * + KpiAsignaciones del mes actual + registros semanales realistas.
 *
 * Requiere que los siguientes usuarios existan en Supabase Auth:
 *   content@educanet.local, trafficker@educanet.local,
 *   disenador@educanet.local, eventos@educanet.local
 *
 * (jefe.marketing@educanet.local ya existe).
 */

const PUESTOS_PILOTO = [
  {
    id: "puesto-content-manager",
    nombre: "Content Manager",
    nivel: 2,
    descripcion: "Responsable del plan editorial y contenido de marca",
    orden: 10,
    kpisKey: "CONTENT_MANAGER" as const,
    email: "content@educanet.local",
    perfil: { nombre: "Sofia", apellido: "Martinez" },
  },
  {
    id: "puesto-trafficker",
    nombre: "Trafficker / SEO / SEM",
    nivel: 2,
    descripcion: "Gestion de pauta pagada y optimizacion de conversion",
    orden: 11,
    kpisKey: "TRAFFICKER" as const,
    email: "trafficker@educanet.local",
    perfil: { nombre: "Diego", apellido: "Rivas" },
  },
  {
    id: "puesto-disenador",
    nombre: "Disenador Grafico",
    nivel: 2,
    descripcion: "Produccion visual y cumplimiento del manual de marca",
    orden: 12,
    kpisKey: "DISENADOR_GRAFICO" as const,
    email: "disenador@educanet.local",
    perfil: { nombre: "Lucia", apellido: "Fernandez" },
  },
  {
    id: "puesto-jefe-marketing",
    nombre: "Jefe de Marketing",
    nivel: 3,
    descripcion: "Direccion del area y desarrollo del equipo",
    orden: 13,
    kpisKey: "JEFE_MARKETING" as const,
    email: "jefe.marketing@educanet.local",
    perfil: null, // ya tiene perfil
  },
  {
    id: "puesto-eventos",
    nombre: "Asistente de Eventos",
    nivel: 1,
    descripcion: "Coordinacion y ejecucion de eventos de la marca",
    orden: 14,
    kpisKey: "ASISTENTE_EVENTOS" as const,
    email: "eventos@educanet.local",
    perfil: { nombre: "Mateo", apellido: "Chavez" },
  },
];

function isoWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff =
    (target.getTime() - firstThursday.getTime()) / (1000 * 60 * 60 * 24);
  return 1 + Math.round((diff - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

async function main() {
  console.log("Sembrando piloto de Marketing...\n");

  const marketing = await prisma.area.findUnique({
    where: { nombre: "Marketing" },
    select: { id: true },
  });
  if (!marketing) {
    console.error("Area Marketing no existe. Corre db:seed primero.");
    process.exit(1);
  }

  // 1. Crear/actualizar puestos
  for (const p of PUESTOS_PILOTO) {
    await prisma.puesto.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        nombre: p.nombre,
        nivel: p.nivel,
        areaId: marketing.id,
        descripcion: p.descripcion,
        orden: p.orden,
      },
      update: {
        nombre: p.nombre,
        nivel: p.nivel,
        areaId: marketing.id,
        descripcion: p.descripcion,
        orden: p.orden,
      },
    });
  }
  console.log(`  Puestos: ${PUESTOS_PILOTO.length} creados/actualizados`);

  // 2. Crear definiciones de KPI por puesto
  let totalDefs = 0;
  for (const p of PUESTOS_PILOTO) {
    const defs = KPIS_POR_PUESTO[p.kpisKey];
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      await prisma.puestoKpiDefinicion.upsert({
        where: {
          puestoId_codigo: {
            puestoId: p.id,
            codigo: d.codigo,
          },
        },
        create: {
          puestoId: p.id,
          codigo: d.codigo,
          nombre: d.nombre,
          descripcion: d.descripcion,
          unidad: d.unidad,
          peso: d.peso,
          tipoMeta: d.tipoMeta,
          valorObjetivoDefault: d.valorObjetivoDefault ?? null,
          bonusPorcentaje: d.bonusPorcentaje ?? 15,
          orden: i + 1,
        },
        update: {
          nombre: d.nombre,
          descripcion: d.descripcion,
          unidad: d.unidad,
          peso: d.peso,
          tipoMeta: d.tipoMeta,
          valorObjetivoDefault: d.valorObjetivoDefault ?? null,
          bonusPorcentaje: d.bonusPorcentaje ?? 15,
          orden: i + 1,
        },
      });
      totalDefs++;
    }
  }
  console.log(`  Definiciones KPI: ${totalDefs} creadas/actualizadas`);

  // 3. Usuarios del piloto (matchear por email)
  const usuariosPiloto = [];
  const faltantes = [];
  for (const p of PUESTOS_PILOTO) {
    const user = await prisma.user.findUnique({
      where: { email: p.email },
    });
    if (!user) {
      faltantes.push(p.email);
      continue;
    }
    const actualizado = await prisma.user.update({
      where: { id: user.id },
      data: {
        puestoId: p.id,
        areaId: marketing.id,
        ...(p.perfil ? { nombre: p.perfil.nombre, apellido: p.perfil.apellido } : {}),
      },
    });
    usuariosPiloto.push({ user: actualizado, puestoId: p.id, kpisKey: p.kpisKey });
  }

  if (faltantes.length) {
    console.log(
      `  Faltan en Supabase Auth: ${faltantes.join(", ")}. El resto se sembro correctamente.`
    );
  }

  // 4. Asignaciones del mes actual + registros de las ultimas semanas
  const ahora = new Date();
  const mes = ahora.getMonth() + 1;
  const anio = ahora.getFullYear();
  const semanaActual = isoWeek(ahora);

  let totalAsig = 0;
  let totalRegistros = 0;
  let totalEventos = 0;

  for (const u of usuariosPiloto) {
    const defs = await prisma.puestoKpiDefinicion.findMany({
      where: { puestoId: u.puestoId, activa: true },
      orderBy: { orden: "asc" },
    });

    // Factor de "salud" del usuario: content y trafficker bajos para
    // mostrar el multiplicador. Jefe y eventos altos. Disenador medio.
    const factorSalud: Record<string, number> = {
      CONTENT_MANAGER: 0.55,
      TRAFFICKER: 0.65,
      DISENADOR_GRAFICO: 0.85,
      JEFE_MARKETING: 1.1,
      ASISTENTE_EVENTOS: 0.95,
    };
    const factor = factorSalud[u.kpisKey] ?? 0.8;

    for (const d of defs) {
      const valorObjetivo = d.valorObjetivoDefault ?? 100;
      const valorBaseline =
        d.tipoMeta === "RELATIVA_BASELINE" ? valorObjetivo * 0.9 : null;

      const asig = await prisma.kpiAsignacion.upsert({
        where: {
          userId_definicionId_periodoMes_periodoAnio: {
            userId: u.user.id,
            definicionId: d.id,
            periodoMes: mes,
            periodoAnio: anio,
          },
        },
        create: {
          userId: u.user.id,
          definicionId: d.id,
          periodoMes: mes,
          periodoAnio: anio,
          valorObjetivo,
          valorBaseline,
        },
        update: {
          valorObjetivo,
          valorBaseline,
        },
      });
      totalAsig++;

      // Crear registros de las 2 ultimas semanas (semana actual y previa)
      for (const semana of [semanaActual - 1, semanaActual]) {
        if (semana < 1) continue;
        const ruido = 0.85 + Math.random() * 0.3;
        let valor = valorObjetivo * factor * ruido;
        if (d.tipoMeta === "BINARIA") {
          valor = factor > 0.7 ? 1 : 0;
        }
        await prisma.kpiRegistroSemanal.upsert({
          where: {
            asignacionId_semanaDelAnio_anio: {
              asignacionId: asig.id,
              semanaDelAnio: semana,
              anio,
            },
          },
          create: {
            asignacionId: asig.id,
            semanaDelAnio: semana,
            anio,
            valor: Number(valor.toFixed(2)),
            reportadoPorId: u.user.id,
          },
          update: {
            valor: Number(valor.toFixed(2)),
          },
        });
        totalRegistros++;
      }
    }

    // 5. Simular algunos eventos de gamificacion para poblar el breakdown
    // (lecciones, compromisos, reconocimientos)
    const eventosSemilla: Array<{
      tipo: "LECCION_COMPLETADA" | "COMPROMISO_CUMPLIDO" | "RECONOCIMIENTO_RECIBIDO";
      fuente: "APRENDIZAJE" | "COMPROMISOS" | "RECONOCIMIENTOS";
      cantidad: number;
      repeticiones: number;
    }> = [
      {
        tipo: "LECCION_COMPLETADA",
        fuente: "APRENDIZAJE",
        cantidad: 10,
        repeticiones: Math.floor(factor * 15),
      },
      {
        tipo: "COMPROMISO_CUMPLIDO",
        fuente: "COMPROMISOS",
        cantidad: 25,
        repeticiones: Math.floor(factor * 5),
      },
      {
        tipo: "RECONOCIMIENTO_RECIBIDO",
        fuente: "RECONOCIMIENTOS",
        cantidad: 40,
        repeticiones: Math.floor(factor * 2),
      },
    ];

    for (const ev of eventosSemilla) {
      for (let i = 0; i < ev.repeticiones; i++) {
        await prisma.eventoGamificacion.create({
          data: {
            userId: u.user.id,
            tipo: ev.tipo,
            fuente: ev.fuente,
            cantidad: ev.cantidad,
            cantidadBruta: ev.cantidad,
            mesPeriodo: mes,
            anioPeriodo: anio,
          },
        });
        totalEventos++;
      }
    }

    // 6. Recalcular RangoMensual (llamamos directo a prisma porque el
    //    motor requiere import circular resuelto; para seed usamos
    //    calculo simple)
    const eventosAgg = await prisma.eventoGamificacion.groupBy({
      by: ["fuente"],
      where: { userId: u.user.id, mesPeriodo: mes, anioPeriodo: anio },
      _sum: { cantidad: true },
    });
    const porFuente: Record<string, number> = {
      APRENDIZAJE: 0,
      KPIS: 0,
      COMPROMISOS: 0,
      RECONOCIMIENTOS: 0,
      MISIONES: 0,
      EQUIPO: 0,
      SISTEMA: 0,
    };
    for (const e of eventosAgg) {
      porFuente[e.fuente] = e._sum.cantidad ?? 0;
    }
    const total = Object.values(porFuente).reduce((a, b) => a + b, 0);
    const rango =
      total >= 1800
        ? "DIAMANTE"
        : total >= 1400
          ? "ORO"
          : total >= 800
            ? "PLATA"
            : "BRONCE";

    await prisma.rangoMensual.upsert({
      where: {
        userId_periodoMes_periodoAnio: {
          userId: u.user.id,
          periodoMes: mes,
          periodoAnio: anio,
        },
      },
      create: {
        userId: u.user.id,
        periodoMes: mes,
        periodoAnio: anio,
        puntosTotales: total,
        puntosKpis: porFuente.KPIS,
        puntosCursos: porFuente.APRENDIZAJE,
        puntosCompromisos: porFuente.COMPROMISOS,
        puntosReconocimientos: porFuente.RECONOCIMIENTOS,
        puntosMisiones: porFuente.MISIONES,
        cumplimientoKpis: factor * 100,
        multiplicadorAplicado: factor < 0.7,
        rango,
      },
      update: {
        puntosTotales: total,
        puntosKpis: porFuente.KPIS,
        puntosCursos: porFuente.APRENDIZAJE,
        puntosCompromisos: porFuente.COMPROMISOS,
        puntosReconocimientos: porFuente.RECONOCIMIENTOS,
        puntosMisiones: porFuente.MISIONES,
        cumplimientoKpis: factor * 100,
        multiplicadorAplicado: factor < 0.7,
        rango,
      },
    });
  }

  console.log(`  Asignaciones: ${totalAsig}`);
  console.log(`  Registros semanales: ${totalRegistros}`);
  console.log(`  Eventos seed: ${totalEventos}`);
  console.log(`  Usuarios piloto sembrados: ${usuariosPiloto.length}`);

  // ─── Categorias de reconocimiento ──────────────────────────────────────
  const CATEGORIAS = [
    { codigo: "COLABORACION", nombre: "Gran colaborador", descripcion: "Ayudo mas alla de lo pedido, apoyo a otros roles", emoji: "🤝", color: "#3B82F6", orden: 1 },
    { codigo: "EXCELENCIA", nombre: "Excelencia en entregables", descripcion: "Calidad superior en un trabajo concreto", emoji: "🎯", color: "#10B981", orden: 2 },
    { codigo: "INNOVACION", nombre: "Idea brillante", descripcion: "Propuesta creativa que mejoro un proceso o resultado", emoji: "💡", color: "#F59E0B", orden: 3 },
    { codigo: "ACTITUD", nombre: "Actitud ejemplar", descripcion: "Mantuvo energia positiva en un momento retador", emoji: "⚡", color: "#EC4899", orden: 4 },
    { codigo: "IMPACTO", nombre: "Impacto en resultados", descripcion: "Su trabajo movio la aguja en un KPI del equipo", emoji: "🚀", color: "#8B5CF6", orden: 5 },
    { codigo: "APRENDIZAJE", nombre: "Mentor del equipo", descripcion: "Compartio conocimiento, enseño a otros", emoji: "📚", color: "#14B8A6", orden: 6 },
  ];
  for (const c of CATEGORIAS) {
    await prisma.categoriaReconocimiento.upsert({
      where: { codigo: c.codigo },
      create: c,
      update: c,
    });
  }
  const cats = await prisma.categoriaReconocimiento.findMany({
    orderBy: { orden: "asc" },
  });
  console.log(`  Categorias reconocimiento: ${cats.length}`);

  // ─── Reconocimientos demo entre los 5 del piloto ──────────────────────
  const userIds = usuariosPiloto.map((u) => u.user.id);
  await prisma.reconocimiento.deleteMany({
    where: {
      OR: [
        { nominadorId: { in: userIds } },
        { reconocidoId: { in: userIds } },
      ],
    },
  });

  const textosDemo = [
    "Me ayudo fuera de horario con el pitch del cliente. La pieza quedo impecable.",
    "Propuso una idea para reducir el tiempo de entrega que aplicamos el mismo dia.",
    "Reviso mi draft con atencion al detalle y me salvo de 2 errores importantes.",
    "Presento resultados al directorio con mucha claridad. Gran representacion del equipo.",
    "En una semana dificil mantuvo a todos enfocados sin bajar la moral.",
    "Capacito al equipo nuevo con paciencia y estructura. Aporto valor real.",
    "Conecto con el cliente dificil y logro destrabar el proyecto.",
    "Su analisis de metricas nos ahorro 30% del budget de la campana.",
  ];

  const recsDemo: Array<[number, number, number, number]> = [
    [0, 1, 0, 1],
    [3, 0, 1, 0],
    [2, 3, 2, 2],
    [4, 2, 0, 3],
    [1, 3, 4, 4],
    [3, 4, 5, 5],
    [0, 2, 3, 6],
    [1, 4, 2, 7],
  ];

  let recCreados = 0;
  for (let i = 0; i < recsDemo.length; i++) {
    const [nomIdx, recIdx, catIdx, textoIdx] = recsDemo[i];
    const nominador = usuariosPiloto[nomIdx].user;
    const reconocido = usuariosPiloto[recIdx].user;
    if (nominador.id === reconocido.id) continue;
    const semana = i < 4 ? semanaActual - 1 : semanaActual;
    await prisma.reconocimiento.create({
      data: {
        nominadorId: nominador.id,
        reconocidoId: reconocido.id,
        categoriaId: cats[catIdx].id,
        mensaje: textosDemo[textoIdx],
        semanaDelAnio: Math.max(1, semana),
        anio,
        puntosOtorgados: 30,
      },
    });
    await prisma.eventoGamificacion.create({
      data: {
        userId: reconocido.id,
        tipo: "RECONOCIMIENTO_RECIBIDO",
        fuente: "RECONOCIMIENTOS",
        cantidad: 30,
        cantidadBruta: 30,
        mesPeriodo: mes,
        anioPeriodo: anio,
      },
    });
    recCreados++;
  }
  console.log(`  Reconocimientos demo: ${recCreados}`);

  // ─── Misiones de la semana para cada user ─────────────────────────────
  await prisma.mision.deleteMany({
    where: { userId: { in: userIds }, semanaDelAnio: semanaActual, anio },
  });

  const { generarMisionesSemanalesUsuario } = await import(
    "../lib/misiones/generador"
  );
  let misionesGeneradas = 0;
  for (const u of usuariosPiloto) {
    const r = await generarMisionesSemanalesUsuario({
      userId: u.user.id,
      semanaDelAnio: semanaActual,
      anio,
    });
    misionesGeneradas += r.generadas;
  }
  console.log(`  Misiones generadas: ${misionesGeneradas}`);

  // ─── Compromisos demo (mix de estados) ────────────────────────────────
  await prisma.compromiso.deleteMany({
    where: { userId: { in: userIds } },
  });

  const hoy = new Date();
  const en3 = new Date();
  en3.setDate(en3.getDate() + 3);
  const hace2 = new Date();
  hace2.setDate(hace2.getDate() - 2);
  const hace5 = new Date();
  hace5.setDate(hace5.getDate() - 5);

  let comprCreados = 0;
  for (let i = 0; i < usuariosPiloto.length; i++) {
    const u = usuariosPiloto[i].user;

    // Pendiente futuro
    await prisma.compromiso.create({
      data: {
        userId: u.id,
        titulo: [
          "Entregar draft del newsletter semanal",
          "Publicar 3 piezas en redes segun calendario",
          "Terminar wireframes del landing",
          "Review de metricas del mes con el equipo",
          "Coordinar proveedores del evento del viernes",
        ][i],
        descripcion: null,
        fechaLimite: en3,
        semanaDelAnio: semanaActual,
        anio,
        estado: "PENDIENTE",
      },
    });
    comprCreados++;

    // Cumplido pasado (con evento)
    const c2 = await prisma.compromiso.create({
      data: {
        userId: u.id,
        titulo: [
          "Revision del calendario editorial",
          "Setup de Google Tag Manager",
          "Banner del lanzamiento",
          "1:1 con el equipo",
          "Checklist del evento anterior",
        ][i],
        fechaLimite: hace2,
        fechaCumplimiento: hace2,
        semanaDelAnio: Math.max(1, semanaActual - 1),
        anio,
        estado: "CUMPLIDO",
        autoReportadoCumplido: true,
        validadoEn: new Date(),
        puntosOtorgados: 25,
      },
    });
    await prisma.eventoGamificacion.create({
      data: {
        userId: u.id,
        tipo: "COMPROMISO_CUMPLIDO",
        fuente: "COMPROMISOS",
        cantidad: 25,
        cantidadBruta: 25,
        referenciaId: c2.id,
        mesPeriodo: mes,
        anioPeriodo: anio,
      },
    });
    comprCreados++;

    // Uno cumplido_auto esperando validacion (solo para 3 users)
    if (i < 3) {
      await prisma.compromiso.create({
        data: {
          userId: u.id,
          titulo: [
            "Cerrar reporte de CPL del mes",
            "Subir assets al brand kit",
            "Presupuesto del evento de julio",
          ][i],
          fechaLimite: hace2,
          fechaCumplimiento: new Date(),
          semanaDelAnio: semanaActual,
          anio,
          estado: "CUMPLIDO_AUTO",
          autoReportadoCumplido: true,
        },
      });
      comprCreados++;
    }

    // Atrasado (solo user 0 y 1, para mostrar el estado)
    if (i < 2) {
      await prisma.compromiso.create({
        data: {
          userId: u.id,
          titulo: [
            "Revisar analytics del lanzamiento",
            "Optimizar 2 campañas de Meta",
          ][i],
          fechaLimite: hace5,
          semanaDelAnio: Math.max(1, semanaActual - 1),
          anio,
          estado: "ATRASADO",
        },
      });
      comprCreados++;
    }
  }
  console.log(`  Compromisos demo: ${comprCreados}`);

  // ─── Configuracion del piloto ────────────────────────────────────────
  const finPiloto = new Date();
  finPiloto.setDate(finPiloto.getDate() + 30);
  const finBanner = new Date();
  finBanner.setDate(finBanner.getDate() + 14);
  const finAnon = new Date();
  finAnon.setDate(finAnon.getDate() + 28);

  await prisma.configuracionPiloto.upsert({
    where: { areaId: marketing.id },
    create: {
      areaId: marketing.id,
      activo: true,
      fechaInicio: new Date(),
      fechaFin: finPiloto,
      metaCumplimientoKpis: 80,
      bonusEquipoPuntos: 150,
      anonimizarParaJefe: true,
      fechaFinAnonimizacion: finAnon,
      mostrarBannerPiloto: true,
      fechaFinBanner: finBanner,
      notas: "Piloto de 1 mes del sistema de gamificacion — equipo Marketing",
    },
    update: {},
  });
  console.log(`  Configuracion piloto: 1 area (Marketing)`);

  // ─── Encuestas demo ──────────────────────────────────────────────────
  await prisma.encuestaSemanal.deleteMany({
    where: { userId: { in: userIds } },
  });

  const encuestasDemo: Array<[number, number, number, number, number, string | null, string | null, string | null]> = [
    // user-index, semana-offset, justicia, motivacion, claridad, kpiJusto, kpiInjusto, comentario
    [0, 0, 4, 4, 4, "Cumplimiento del plan editorial", null, null],
    [1, 0, 3, 4, 3, null, "CPL vs meta", "El CPL depende mucho del mercado, no solo de mi trabajo"],
    [2, 0, 5, 5, 4, "Piezas entregadas vs solicitadas", null, null],
    [3, 0, 4, 3, 4, null, null, "Motivante ver el progreso de todo el equipo"],
    [0, -1, 3, 4, 3, null, "Engagement promedio", "Engagement depende del tema, no siempre de la calidad"],
    [1, -1, 4, 4, 4, "Reportes semanales a tiempo", null, null],
    [4, -1, 4, 5, 5, "Eventos sin incidencias", null, "El sistema motiva porque se ve el avance del equipo"],
    [2, -1, 5, 4, 5, null, null, null],
  ];

  const semanaActualNum = isoWeek(ahora);
  let encuestasCreadas = 0;
  for (const [userIdx, offset, justicia, motivacion, claridad, kpiJusto, kpiInjusto, comentario] of encuestasDemo) {
    if (userIdx >= usuariosPiloto.length) continue;
    const user = usuariosPiloto[userIdx].user;
    const semana = Math.max(1, semanaActualNum + offset);
    await prisma.encuestaSemanal.create({
      data: {
        userId: user.id,
        semanaDelAnio: semana,
        anio,
        justiciaKpis: justicia,
        motivacionSistema: motivacion,
        claridadProgreso: claridad,
        kpiMasJusto: kpiJusto,
        kpiMenosJusto: kpiInjusto,
        comentario,
        puntosOtorgados: 20,
      },
    });
    encuestasCreadas++;
  }
  console.log(`  Encuestas demo: ${encuestasCreadas}`);

  console.log("\nListo.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
