import { Suspense } from "react";

import { requireAuth } from "@/lib/auth";
import { obtenerDatosHome } from "@/lib/dashboard/queries";
import { obtenerProgresoMes } from "@/lib/kpis/mi-progreso-queries";
import { mesActual } from "@/lib/gamificacion/periodo";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

import { BentoGrid, BentoItem } from "@/components/ui/primitives/BentoGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroWelcome } from "@/components/dashboard/home/HeroWelcome";
import {
  RangoBentoCard,
  CursoEnProgresoBentoCard,
  RachaBentoCard,
  PuntosTotalesBentoCard,
  MisionesResumenBentoCard,
  RutaCarreraBentoCard,
  LogrosRecientesBentoCard,
  CertificadosBentoCard,
  ActividadEquipoBentoCard,
  IrAMiProgresoBentoCard,
} from "@/components/dashboard/home/BentoCards";
import { WidgetTareaActual } from "@/components/tareas/WidgetTareaActual";

export const metadata = { title: "Inicio" };

async function obtenerMisionesResumen(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`misiones-resumen-${userId}`);
  return prisma.mision.groupBy({ by: ["estado"], where: { userId }, _count: true });
}

export default async function HomePage() {
  const user = await requireAuth();
  const { mes, anio } = mesActual();

  const [datos, progreso, misionesCount] = await Promise.all([
    obtenerDatosHome(user.id),
    obtenerProgresoMes(user.id, mes, anio),
    obtenerMisionesResumen(user.id),
  ]);

  if (!datos) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No pudimos cargar tu panel.
      </div>
    );
  }

  const activas =
    misionesCount.find((m) => m.estado === "ACTIVA")?._count ?? 0;
  const completadas =
    misionesCount.find((m) => m.estado === "COMPLETADA")?._count ?? 0;

  const rutaResumen = datos.rutaCarrera
    ? {
        puestoDestino: datos.rutaCarrera.puestoDestino.nombre,
        progreso: Math.round(
          (datos.rutaCarrera.cursos.filter((c) =>
            datos.cursosCompletados.some((cc) => cc.id === c.cursoId),
          ).length /
            Math.max(datos.rutaCarrera.cursos.length, 1)) *
            100,
        ),
      }
    : null;

  const cursoEnProgreso = datos.cursosEnProgreso[0]
    ? {
        slug: datos.cursosEnProgreso[0].slug,
        titulo: datos.cursosEnProgreso[0].titulo,
        porcentaje: datos.cursosEnProgreso[0].porcentaje,
      }
    : null;

  const actividad = datos.actividadEquipo.map((a) => ({
    userNombre: `${a.user.nombre} ${a.user.apellido}`,
    descripcion: `sumó ${a.cantidad} pts`,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <HeroWelcome
        user={{ nombre: datos.usuario.nombre }}
        stats={{
          rango: progreso.rangoActual,
          puntosMes: progreso.puntosTotales,
          puntosSiguienteRango: progreso.puntosParaSiguiente,
          porcentajeRango: progreso.porcentajeAlSiguiente,
        }}
      />

      <div className="mb-6">
        <Suspense fallback={null}>
          <WidgetTareaActual userId={user.id} />
        </Suspense>
      </div>

      <BentoGrid>
        <BentoItem span="2x2">
          <RangoBentoCard
            rango={progreso.rangoActual}
            puntos={progreso.puntosTotales}
            siguienteRango={progreso.siguienteRango}
            porcentaje={progreso.porcentajeAlSiguiente}
            diasRestantes={progreso.diasRestantes}
          />
        </BentoItem>

        <BentoItem span="2x1">
          <CursoEnProgresoBentoCard curso={cursoEnProgreso} />
        </BentoItem>

        <BentoItem span="1x1">
          <RachaBentoCard racha={datos.usuario.rachaActual} />
        </BentoItem>

        <BentoItem span="1x1">
          <PuntosTotalesBentoCard puntos={datos.usuario.puntosTotales} />
        </BentoItem>

        <BentoItem span="3x1">
          <MisionesResumenBentoCard activas={activas} completadas={completadas} />
        </BentoItem>

        <BentoItem span="3x1">
          <RutaCarreraBentoCard ruta={rutaResumen} />
        </BentoItem>

        <BentoItem span="2x1">
          <LogrosRecientesBentoCard
            badges={datos.logrosRecientes.map((b) => ({ nombre: b.badge.nombre }))}
          />
        </BentoItem>

        <BentoItem span="2x1">
          <Suspense fallback={<Skeleton className="h-full rounded-[var(--radius)]" />}>
            <ActividadEquipoBentoCard actividad={actividad} />
          </Suspense>
        </BentoItem>

        <BentoItem span="2x1">
          <CertificadosBentoCard count={datos.certificadosCount} />
        </BentoItem>

        <BentoItem span="full">
          <IrAMiProgresoBentoCard />
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
