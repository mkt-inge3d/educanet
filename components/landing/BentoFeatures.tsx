import { Award, BookOpen, Sparkles, Target, Trophy, Users } from "lucide-react";

import { BentoGrid, BentoItem } from "@/components/ui/primitives/BentoGrid";
import { GlassCard } from "@/components/ui/primitives/GlassCard";

export function BentoFeatures() {
  return (
    <section id="features" className="relative px-4 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-semibold tracking-tighter md:text-5xl">
            Un solo lugar para{" "}
            <span className="text-shimmer-2026">todo lo que importa</span>{" "}
            en tu carrera.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Aprende, demuestra impacto, gana reconocimiento y asciende. Educanet
            integra lo que antes estaba en 5 herramientas distintas.
          </p>
        </div>

        <BentoGrid className="mx-auto max-w-6xl">
          <BentoItem span="2x2">
            <GlassCard className="flex h-full flex-col justify-between p-8">
              <div className="glass mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-3 text-2xl font-semibold">
                  KPIs medibles y justos
                </h3>
                <p className="text-muted-foreground">
                  Cada rol con sus métricas claras. Las decisiones se basan en
                  datos, no en percepciones subjetivas. Los topes diarios evitan
                  gaming del sistema.
                </p>
              </div>
            </GlassCard>
          </BentoItem>

          <BentoItem span="1x2">
            <GlassCard className="h-full p-6">
              <div className="glass mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Capacitación con propósito
              </h3>
              <p className="text-sm text-muted-foreground">
                Cursos asignados según tu ruta de carrera. Contenido contextual,
                no genérico.
              </p>
            </GlassCard>
          </BentoItem>

          <BentoItem span="2x1">
            <GlassCard className="flex h-full items-center gap-4 p-6">
              <div className="glass flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">
                  Reconocimiento entre pares
                </h3>
                <p className="text-sm text-muted-foreground">
                  30 puntos por cada reconocimiento. Lo que aportas se nota.
                </p>
              </div>
            </GlassCard>
          </BentoItem>

          <BentoItem span="1x1">
            <GlassCard className="flex h-full flex-col justify-between p-6">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <div className="text-3xl font-semibold tabular-nums">+2,000</div>
                <div className="text-xs text-muted-foreground">
                  pts posibles al mes
                </div>
              </div>
            </GlassCard>
          </BentoItem>

          <BentoItem span="1x1">
            <GlassCard className="flex h-full flex-col justify-between p-6">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <div className="text-3xl font-semibold tabular-nums">4</div>
                <div className="text-xs text-muted-foreground">
                  rangos mensuales
                </div>
              </div>
            </GlassCard>
          </BentoItem>

          <BentoItem span="2x1">
            <GlassCard className="flex h-full items-center gap-4 p-6">
              <Sparkles className="h-8 w-8 flex-shrink-0 text-primary" />
              <div>
                <h3 className="mb-1 text-lg font-semibold">
                  Misiones semanales
                </h3>
                <p className="text-sm text-muted-foreground">
                  3 objetivos personalizados cada lunes, mezclando aprendizaje y
                  KPIs.
                </p>
              </div>
            </GlassCard>
          </BentoItem>
        </BentoGrid>
      </div>
    </section>
  );
}
