import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { NumeroAnimado } from "@/components/ui/primitives/NumeroAnimado";

export async function StatsLanding() {
  "use cache";
  cacheLife("hours");
  cacheTag("stats-landing");
  const [cursos, certificados, badges] = await Promise.all([
    prisma.curso.count({ where: { publicado: true } }),
    prisma.certificado.count(),
    prisma.userBadge.count(),
  ]);

  const stats = [
    { label: "Cursos disponibles", value: cursos },
    { label: "Certificados emitidos", value: certificados },
    { label: "Logros desbloqueados", value: badges },
  ];

  return (
    <section className="relative border-y border-border/30 px-4 py-24">
      <div className="relative mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <div className="text-5xl font-semibold tracking-tighter md:text-6xl">
                <NumeroAnimado value={stat.value} />
              </div>
              <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
