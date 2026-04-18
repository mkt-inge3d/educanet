import { obtenerCursosRelacionados } from "@/lib/cursos/relacionados-queries";
import { CursoCard } from "@/components/curso/CursoCard";

export async function CursosRelacionados({
  cursoId,
  userId,
  limite = 3,
}: {
  cursoId: string;
  userId: string;
  limite?: number;
}) {
  const cursos = await obtenerCursosRelacionados({ cursoId, userId, limite });

  if (cursos.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Tambien te puede interesar</h2>
        <p className="text-sm text-muted-foreground">
          Continua aprendiendo con estos cursos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cursos.map((c) => (
          <CursoCard
            key={c.id}
            slug={c.slug}
            titulo={c.titulo}
            descripcionCorta={c.descripcionCorta}
            nivel={c.nivel}
            duracionMinutos={c.duracionMinutos}
            puntosRecompensa={c.puntosRecompensa}
            instructorNombre={c.instructorNombre}
            thumbnailUrl={c.thumbnailUrl}
            porcentaje={c.porcentaje > 0 ? c.porcentaje : undefined}
          />
        ))}
      </div>
    </section>
  );
}
