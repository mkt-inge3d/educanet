import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="1" className="fill-primary/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <header className="px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight">educanet</span>
          </div>
          <Button size="sm" variant="ghost" render={<Link href="/verificar" />}>
            Verificar certificado
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Crece con tu empresa,{" "}
            <span className="text-primary">crece contigo</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-balance text-base text-muted-foreground">
            Plataforma interna de desarrollo profesional. Aprende, obten
            certificados y avanza en tu carrera.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="min-w-40" render={<Link href="/login" />}>
              Iniciar sesion
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-w-40"
              render={<Link href="/register" />}
            >
              Crear cuenta
            </Button>
          </div>

          <p className="mt-10 text-xs uppercase tracking-widest text-muted-foreground/80">
            El conocimiento es poder
          </p>
        </div>
      </main>

      <footer className="border-t/0 px-6 py-6 text-center text-xs text-muted-foreground">
        Educanet — Capacitacion continua para tu equipo
      </footer>
    </div>
  );
}
