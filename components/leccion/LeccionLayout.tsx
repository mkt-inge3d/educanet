"use client";

import { useState, type ReactNode } from "react";
import { PanelLeft, PanelRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LeccionSidebarIzq } from "./LeccionSidebarIzq";
import { LeccionVideo } from "./LeccionVideo";
import { LeccionLectura } from "./LeccionLectura";
import { LeccionQuiz } from "./quiz/LeccionQuiz";
import { LeccionNavegacion } from "./LeccionNavegacion";
import { LeccionCompletadaBanner } from "./LeccionCompletadaBanner";
import type { LeccionDetalleCompleta, ModuloConLeccionesYProgreso, LeccionAdyacente } from "@/types/lecciones";

export function LeccionLayout({
  leccion,
  estructura,
  cursoSlug,
  anterior,
  siguiente,
  seccionesInferiores,
  panelDerecho,
}: {
  leccion: LeccionDetalleCompleta;
  estructura: ModuloConLeccionesYProgreso[];
  cursoSlug: string;
  anterior: LeccionAdyacente | null;
  siguiente: LeccionAdyacente | null;
  seccionesInferiores?: ReactNode;
  panelDerecho: ReactNode;
}) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const totalLecciones = estructura.reduce((acc, m) => acc + m.lecciones.length, 0);
  const completadas = estructura.reduce(
    (acc, m) => acc + m.lecciones.filter((l) => l.completada).length,
    0
  );

  const sidebarContent = (
    <LeccionSidebarIzq
      estructura={estructura}
      cursoSlug={cursoSlug}
      cursoTitulo={leccion.curso.titulo}
      leccionActualSlug={leccion.slug}
      leccionActualId={leccion.id}
      totalLecciones={totalLecciones}
      completadas={completadas}
    />
  );

  const panelContent = panelDerecho;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r bg-card lg:block overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile sheets */}
      <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
      <Sheet open={rightOpen} onOpenChange={setRightOpen}>
        <SheetContent side="right" className="w-[380px] p-0 sm:max-w-[380px]">
          {panelContent}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-16 z-10 flex items-center gap-2 border-b bg-card/90 px-4 py-2 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setLeftOpen(true)}
            aria-label="Menu del curso"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          <nav className="flex-1 min-w-0 text-sm">
            <Link
              href={`/cursos/${cursoSlug}`}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              {leccion.curso.titulo}
            </Link>
            <span className="mx-1 text-muted-foreground">/</span>
            <span className="text-muted-foreground">{leccion.modulo.titulo}</span>
          </nav>

          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setRightOpen(true)}
            aria-label="Notas y recursos"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Lesson content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <LeccionCompletadaBanner
              completada={leccion.completada}
              puntos={leccion.puntosRecompensa}
            />

            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{leccion.titulo}</h1>
              {leccion.descripcion && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {leccion.descripcion}
                </p>
              )}
            </div>

            {leccion.tipo === "VIDEO" && (
              <LeccionVideo
                leccionId={leccion.id}
                bunnyVideoId={leccion.bunnyVideoId}
                videoUrl={leccion.videoUrl}
                duracionSegundos={leccion.duracionSegundos}
                porcentajeVisto={leccion.porcentajeVisto}
                completada={leccion.completada}
                puntosRecompensa={leccion.puntosRecompensa}
              />
            )}

            {leccion.tipo === "LECTURA" && (
              <LeccionLectura
                leccionId={leccion.id}
                contenido={leccion.contenidoMarkdown ?? ""}
                completada={leccion.completada}
                puntosRecompensa={leccion.puntosRecompensa}
              />
            )}

            {leccion.tipo === "QUIZ" && leccion.quiz && (
              <LeccionQuiz
                quiz={leccion.quiz}
                completada={leccion.completada}
                mejorIntento={leccion.mejorIntentoQuiz}
              />
            )}

            {seccionesInferiores && (
              <div className="mt-8 space-y-10 border-t pt-8">
                {seccionesInferiores}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <LeccionNavegacion
          cursoSlug={cursoSlug}
          anterior={anterior}
          siguiente={siguiente}
          completada={leccion.completada}
          tipo={leccion.tipo}
          leccionId={leccion.id}
        />
      </div>

      {/* Desktop right panel */}
      <aside className="hidden w-[420px] shrink-0 border-l bg-card lg:flex lg:flex-col">
        {panelContent}
      </aside>
    </div>
  );
}
