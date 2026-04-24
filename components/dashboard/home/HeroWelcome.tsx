import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";
import { GlassCard } from "@/components/ui/primitives/GlassCard";
import { NumeroAnimado } from "@/components/ui/primitives/NumeroAnimado";
import type { TipoRango } from "@prisma/client";

function obtenerSaludoPorHora(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

const FRASES = [
  "Tu camino se construye un paso a la vez.",
  "Cada lección cuenta. Cada misión suma.",
  "El esfuerzo de hoy es el progreso de mañana.",
  "Lo que aportas se nota — y se reconoce.",
  "Crecer es lo único que no se negocia.",
];

function fraseDelDia(): string {
  const i = new Date().getDate() % FRASES.length;
  return FRASES[i];
}

interface HeroWelcomeProps {
  user: { nombre: string };
  stats: {
    rango: TipoRango;
    puntosMes: number;
    puntosSiguienteRango: number | null;
    porcentajeRango: number;
  };
}

const LABEL_RANGO: Record<TipoRango, string> = {
  BRONCE: "Bronce",
  PLATA: "Plata",
  ORO: "Oro",
  DIAMANTE: "Diamante",
};

export function HeroWelcome({ user, stats }: HeroWelcomeProps) {
  const saludo = obtenerSaludoPorHora();

  return (
    <section className="relative mb-8 overflow-hidden py-12">
      <HaloBackground variant="top" />

      <div className="relative flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="mb-2 text-sm text-muted-foreground">{saludo},</p>
          <KineticTitle
            text={`${user.nombre} 👋`}
            className="text-4xl font-semibold tracking-tighter md:text-5xl"
          />
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {fraseDelDia()}
          </p>
        </div>

        <GlassCard
          intensity="strong"
          className="hidden w-72 p-6 md:block"
          withPointerGlow={false}
        >
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Tu rango este mes
          </div>
          <div className="mt-2 text-4xl font-semibold">
            {LABEL_RANGO[stats.rango]}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <NumeroAnimado value={stats.puntosMes} /> pts
            {stats.puntosSiguienteRango !== null && (
              <>
                {" "}/ {stats.puntosSiguienteRango.toLocaleString("es")} para
                subir
              </>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${Math.min(stats.porcentajeRango, 100)}%` }}
            />
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
