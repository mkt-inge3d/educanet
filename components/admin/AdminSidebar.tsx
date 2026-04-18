"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Trophy,
  Users,
  TrendingUp,
  Route,
  Building,
  ArrowLeft,
  Shield,
  Flag,
} from "lucide-react";
import { EducanetLogo } from "@/components/shared/EducanetLogo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RolUsuario } from "@prisma/client";
import {
  puedeGestionarCursos,
  puedeGestionarBadges,
  puedeGestionarMetricas,
  puedeGestionarRutas,
  puedeVerAnaliticas,
  puedeGestionarUsuarios,
} from "@/lib/admin/permisos";

const secciones = [
  {
    title: "Vision general",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, check: () => true },
      { label: "Analiticas", href: "/admin/analiticas", icon: BarChart3, check: puedeVerAnaliticas },
    ],
  },
  {
    title: "Contenido",
    items: [
      { label: "Cursos", href: "/admin/cursos", icon: BookOpen, check: puedeGestionarCursos },
      { label: "Badges", href: "/admin/badges", icon: Trophy, check: puedeGestionarBadges },
    ],
  },
  {
    title: "Personas",
    items: [
      { label: "Usuarios", href: "/admin/usuarios", icon: Users, check: puedeGestionarUsuarios },
      { label: "Metricas", href: "/admin/metricas", icon: TrendingUp, check: puedeGestionarMetricas },
    ],
  },
  {
    title: "Comunidad",
    items: [
      { label: "Moderacion", href: "/admin/moderacion", icon: Flag, check: () => true },
    ],
  },
  {
    title: "Desarrollo",
    items: [
      { label: "Rutas de carrera", href: "/admin/rutas-carrera", icon: Route, check: puedeGestionarRutas },
      { label: "Puestos y areas", href: "/admin/puestos-areas", icon: Building, check: puedeGestionarUsuarios },
    ],
  },
];

export function AdminSidebar({ rol }: { rol: RolUsuario }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Link href="/admin">
          <EducanetLogo variant="full" />
        </Link>
      </div>

      <div className="px-3 py-2">
        <Badge className="w-full justify-center bg-primary/10 text-primary text-xs">
          <Shield className="mr-1 h-3 w-3" />
          Modo Admin
        </Badge>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {secciones.map((seccion) => {
          const items = seccion.items.filter((item) => item.check(rol));
          if (items.length === 0) return null;

          return (
            <div key={seccion.title} className="mb-4">
              <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {seccion.title}
              </p>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/cursos"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mi dashboard
        </Link>
      </div>
    </aside>
  );
}
