"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Trophy,
  Award,
  User as UserIcon,
  LogOut,
  Target,
  Heart,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EducanetLogo } from "@/components/shared/EducanetLogo";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  soloJefe?: boolean;
};

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Aprender",
    items: [
      { label: "Inicio", href: "/home", icon: Home },
      { label: "Catálogo", href: "/cursos", icon: BookOpen },
    ],
  },
  {
    title: "Crecer",
    items: [
      { label: "Mi progreso", href: "/mi-progreso", icon: Target },
      { label: "Mis tareas", href: "/tareas", icon: ClipboardCheck },
      { label: "Reconocimientos", href: "/reconocimientos", icon: Heart },
      { label: "Mi equipo", href: "/mi-equipo", icon: Users, soloJefe: true },
      { label: "Revisar hitos", href: "/mi-equipo/validacion-kpis", icon: ClipboardCheck, soloJefe: true },
    ],
  },
  {
    title: "Logros",
    items: [
      { label: "Mis logros", href: "/logros", icon: Trophy },
      { label: "Certificados", href: "/certificados", icon: Award },
    ],
  },
  {
    title: "Cuenta",
    items: [{ label: "Mi perfil", href: "/perfil", icon: UserIcon }],
  },
];

type MobileUser = {
  nombre: string;
  apellido: string;
  rol?: string;
  puesto?: { nombre: string } | null;
};

export function DashboardSidebarMobile({ user }: { user: MobileUser }) {
  const pathname = usePathname();

  const esJefe = user.puesto?.nombre?.startsWith("Jefe") ?? false;
  const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
  const puedeVerJefe = esJefe || esAdmin;

  const seccionesFiltradas = sections.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.soloJefe || puedeVerJefe),
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <Link href="/home">
          <EducanetLogo variant="full" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {seccionesFiltradas.map((section, si) => (
          <div key={section.title} className={si > 0 ? "mt-4" : ""}>
            <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <Separator />
      <div className="p-4">
        <p className="text-sm font-medium">{user.nombre} {user.apellido}</p>
        <p className="text-xs text-muted-foreground">{user.puesto?.nombre ?? "Sin puesto"}</p>
        <form action="/api/auth/logout" method="POST" className="mt-3">
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
