import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";

import { DashboardPreview } from "./DashboardPreview";

export function HeroLanding() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-32">
      <HaloBackground variant="top" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="glass mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-1 text-xs font-medium">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Sistema integral de crecimiento profesional</span>
        </div>

        <KineticTitle
          text="Crece con tu equipo,"
          as="h1"
          className="text-5xl font-semibold leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl"
        />
        <KineticTitle
          text="crece contigo."
          as="h1"
          shimmer
          stagger={0.05}
          className="text-5xl font-semibold leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl"
        />

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Educanet une capacitación, performance management y gamificación en
          una sola plataforma. Diseñada para que cada persona vea su camino y
          lo recorra.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button variant="premium" size="xl" render={<Link href="/login" />}>
            Acceder a Educanet
            <ArrowRight />
          </Button>
          <Button variant="subtle" size="xl" render={<Link href="#features" />}>
            Ver cómo funciona
          </Button>
        </div>
      </div>

      <div className="relative mx-auto mt-24 max-w-6xl">
        <DashboardPreview />
      </div>
    </section>
  );
}
