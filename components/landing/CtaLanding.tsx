import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";

export function CtaLanding() {
  return (
    <section className="relative overflow-hidden px-4 py-32">
      <HaloBackground variant="center" />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-shimmer-2026 text-4xl font-semibold tracking-tighter md:text-6xl">
          Tu próximo nivel te espera.
        </h2>
        <p className="mt-6 text-lg text-muted-foreground">
          Únete al equipo que ya está creciendo con Educanet.
        </p>
        <div className="mt-10">
          <Button variant="premium" size="xl" render={<Link href="/login" />}>
            Acceder ahora
          </Button>
        </div>
      </div>
    </section>
  );
}
