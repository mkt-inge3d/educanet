import Link from "next/link";

import { EducanetLogo } from "@/components/shared/EducanetLogo";

export function FooterLanding() {
  return (
    <footer className="relative border-t border-border/40 px-4 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <EducanetLogo variant="full" />

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <Link href="/verificar" className="hover:text-foreground transition-colors">
            Verificar certificado
          </Link>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Acceder
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          El conocimiento es poder.
        </p>
      </div>
    </footer>
  );
}
