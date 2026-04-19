import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="auth-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="1" className="fill-primary/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-dots)" />
        </svg>
      </div>

      <header className="px-6 py-5 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2 text-primary">
          <GraduationCap className="h-7 w-7" />
          <span className="text-lg font-bold tracking-tight">Educanet</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        Necesitas ayuda?{" "}
        <a
          href="mailto:soporte@educanet.local"
          className="text-primary hover:underline"
        >
          Contacta a soporte
        </a>
      </footer>
    </div>
  );
}
