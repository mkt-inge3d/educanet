import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Sparkles, Trophy, Award, Target, Users } from "lucide-react";

import { GlassCard } from "@/components/ui/primitives/GlassCard";
import { NumeroAnimado } from "@/components/ui/primitives/NumeroAnimado";
import { Button } from "@/components/ui/button";
import type { TipoRango } from "@prisma/client";

export function RangoBentoCard({
  rango,
  puntos,
  siguienteRango,
  porcentaje,
  diasRestantes,
}: {
  rango: TipoRango;
  puntos: number;
  siguienteRango: TipoRango | null;
  porcentaje: number;
  diasRestantes: number;
}) {
  const labels: Record<TipoRango, string> = {
    BRONCE: "Bronce",
    PLATA: "Plata",
    ORO: "Oro",
    DIAMANTE: "Diamante",
  };
  return (
    <GlassCard intensity="strong" className="h-full p-6" withPointerGlow>
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Rango del mes
          </div>
          <div className="mt-2 text-shimmer-2026 text-5xl font-semibold tracking-tight">
            {labels[rango]}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">
            <NumeroAnimado value={puntos} /> pts acumulados
          </div>
          {siguienteRango && (
            <div className="mt-1 text-xs text-muted-foreground">
              Faltan {Math.round(100 - porcentaje)}% para {labels[siguienteRango]}
            </div>
          )}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${Math.min(porcentaje, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {diasRestantes} días restantes en el mes
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function CursoEnProgresoBentoCard({
  curso,
}: {
  curso: { slug: string; titulo: string; porcentaje: number } | null;
}) {
  if (!curso) {
    return (
      <GlassCard className="h-full p-5" interactive>
        <Link href="/cursos" className="flex h-full flex-col justify-between">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Explorar catálogo</div>
            <div className="text-xs text-muted-foreground">
              Empezá un curso cuando quieras
            </div>
          </div>
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full p-5" interactive>
      <Link
        href={`/cursos/${curso.slug}`}
        className="flex h-full flex-col justify-between"
      >
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Continúa con
        </div>
        <div>
          <div className="line-clamp-2 text-base font-semibold">
            {curso.titulo}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(curso.porcentaje, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            <NumeroAnimado value={curso.porcentaje} suffix="%" /> completado
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}

export function RachaBentoCard({ racha }: { racha: number }) {
  const copy =
    racha >= 7
      ? "Imparable"
      : racha >= 1
        ? `${7 - racha} para badge`
        : "Empezá hoy";

  return (
    <GlassCard className="h-full p-5" interactive>
      <div className="flex h-full items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Racha
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            <NumeroAnimado value={racha} /> {racha === 1 ? "día" : "días"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{copy}</div>
        </div>
        <Flame className="h-8 w-8 text-warning" />
      </div>
    </GlassCard>
  );
}

export function PuntosTotalesBentoCard({ puntos }: { puntos: number }) {
  return (
    <GlassCard className="h-full p-5" interactive>
      <div className="flex h-full items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Puntos totales
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            <NumeroAnimado value={puntos} />
          </div>
        </div>
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
    </GlassCard>
  );
}

export function MisionesResumenBentoCard({
  activas,
  completadas,
}: {
  activas: number;
  completadas: number;
}) {
  return (
    <GlassCard className="h-full p-5" interactive>
      <Link href="/mi-progreso" className="flex h-full items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Misiones esta semana
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">
              <NumeroAnimado value={completadas} />
            </span>
            <span className="text-sm text-muted-foreground">/ {activas} completadas</span>
          </div>
        </div>
        <Target className="h-8 w-8 text-primary" />
      </Link>
    </GlassCard>
  );
}

export function RutaCarreraBentoCard({
  ruta,
}: {
  ruta: {
    puestoDestino: string;
    progreso: number;
  } | null;
}) {
  if (!ruta) {
    return (
      <GlassCard className="h-full p-5" interactive>
        <Link href="/mi-carrera" className="flex h-full items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Mi carrera
            </div>
            <div className="mt-1 text-sm">Sin ruta asignada aún</div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full p-5" interactive>
      <Link href="/mi-carrera" className="flex h-full flex-col justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Camino a {ruta.puestoDestino}
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold tabular-nums">
              <NumeroAnimado value={ruta.progreso} suffix="%" />
            </span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(ruta.progreso, 100)}%` }}
            />
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}

export function LogrosRecientesBentoCard({
  badges,
}: {
  badges: { nombre: string }[];
}) {
  if (badges.length === 0) {
    return (
      <GlassCard className="h-full p-5">
        <Link href="/logros" className="flex h-full items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Logros
            </div>
            <div className="mt-1 text-sm">Completá una lección para tu primer badge</div>
          </div>
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full p-5" interactive>
      <Link href="/logros" className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Últimos logros
          </div>
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="flex gap-2">
          {badges.slice(0, 3).map((b) => (
            <div
              key={b.nombre}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
              title={b.nombre}
            >
              <Trophy className="h-5 w-5" />
            </div>
          ))}
          {badges.length > 3 && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
              +{badges.length - 3}
            </div>
          )}
        </div>
      </Link>
    </GlassCard>
  );
}

export function CertificadosBentoCard({ count }: { count: number }) {
  return (
    <GlassCard className="h-full p-5" interactive>
      <Link href="/certificados" className="flex h-full items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Certificados
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            <NumeroAnimado value={count} />
          </div>
        </div>
        <Award className="h-8 w-8 text-primary" />
      </Link>
    </GlassCard>
  );
}

export function ActividadEquipoBentoCard({
  actividad,
}: {
  actividad: { userNombre: string; descripcion: string }[];
}) {
  if (actividad.length === 0) return null;

  return (
    <GlassCard className="h-full p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          En tu área
        </div>
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>
      <ul className="space-y-2">
        {actividad.slice(0, 3).map((a, i) => (
          <li key={i} className="text-xs text-muted-foreground line-clamp-1">
            <span className="font-medium text-foreground">{a.userNombre}</span>{" "}
            {a.descripcion}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function IrAMiProgresoBentoCard() {
  return (
    <GlassCard className="h-full p-5" interactive intensity="standard">
      <Link href="/mi-progreso" className="flex h-full items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Ver detalle
          </div>
          <div className="mt-1 text-base font-semibold">Mi progreso</div>
        </div>
        <Button variant="glass" size="icon-sm" tabIndex={-1}>
          <ArrowRight />
        </Button>
      </Link>
    </GlassCard>
  );
}
