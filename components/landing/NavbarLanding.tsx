"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EducanetLogo } from "@/components/shared/EducanetLogo";
import { GlassNavbar } from "@/components/ui/primitives/GlassNavbar";

export function NavbarLanding() {
  return (
    <GlassNavbar>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Educanet">
            <EducanetLogo variant="full" />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Cómo funciona
            </Link>
            <Link
              href="/verificar"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Verificar certificado
            </Link>
          </nav>

          <Button variant="premium" size="sm" render={<Link href="/login" />}>
            Acceder
          </Button>
        </div>
      </div>
    </GlassNavbar>
  );
}
