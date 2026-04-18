import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { obtenerCursoDetalle, obtenerCursosSimilares } from "@/lib/cursos/queries";
import { CursoHero } from "@/components/curso/detalle/CursoHero";
import { CursoSidebar } from "@/components/curso/detalle/CursoSidebar";
import { TimelineContenido } from "@/components/curso/detalle/timeline/TimelineContenido";
import { CursoSobreElCurso } from "@/components/curso/detalle/CursoSobreElCurso";
import { CursoRecursos } from "@/components/curso/detalle/CursoRecursos";
import { CursosSimilares } from "@/components/curso/detalle/CursosSimilares";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
}

export default async function CursoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireAuth();
  const curso = await obtenerCursoDetalle(slug, user.id);

  if (!curso) notFound();

  const similares = await obtenerCursosSimilares(
    curso.id,
    curso.area?.id ?? null
  );

  const ctaHref =
    curso.estado === "no-iniciado"
      ? `/cursos/${curso.slug}/${curso.modulos[0]?.lecciones[0]?.slug ?? ""}`
      : curso.ultimaLeccionSlug
        ? `/cursos/${curso.slug}/${curso.ultimaLeccionSlug}`
        : `/cursos/${curso.slug}/${curso.modulos[0]?.lecciones[0]?.slug ?? ""}`;

  const ctaLabel =
    curso.estado === "completado"
      ? "Repasar curso"
      : curso.estado === "en-progreso"
        ? "Continuar"
        : "Empezar curso";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <CursoHero curso={curso} />

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile sidebar */}
          <div className="mb-6 lg:hidden">
            <CursoSidebar
              curso={curso}
              ctaHref={ctaHref}
              ctaLabel={ctaLabel}
            />
          </div>

          <Tabs defaultValue="contenido">
            <TabsList>
              <TabsTrigger value="contenido">Contenido</TabsTrigger>
              <TabsTrigger value="sobre">Sobre el curso</TabsTrigger>
              <TabsTrigger value="recursos">Recursos</TabsTrigger>
            </TabsList>

            <TabsContent value="contenido" className="mt-4">
              <TimelineContenido curso={curso} />
            </TabsContent>

            <TabsContent value="sobre" className="mt-4">
              <CursoSobreElCurso curso={curso} />
            </TabsContent>

            <TabsContent value="recursos" className="mt-4">
              <CursoRecursos recursos={curso.recursos} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-20">
            <CursoSidebar
              curso={curso}
              ctaHref={ctaHref}
              ctaLabel={ctaLabel}
            />
          </div>
        </aside>
      </div>

      {similares.length > 0 && <CursosSimilares cursos={similares} />}
    </div>
  );
}
