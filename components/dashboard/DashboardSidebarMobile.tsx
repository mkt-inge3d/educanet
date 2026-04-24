"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Library, TrendingUp, LineChart,
  Trophy, Award, User as UserIcon, LogOut,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EducanetLogo } from "@/components/shared/EducanetLogo";
import { logoutAction } from "@/app/(dashboard)/actions";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Inicio", href: "/home", icon: Home },
  { label: "Catálogo", href: "/cursos", icon: Library },
  { label: "Mi progreso", href: "/mi-progreso", icon: TrendingUp },
  { label: "Desempeño", href: "/desempeno", icon: LineChart },
  { label: "Mis logros", href: "/logros", icon: Trophy },
  { label: "Certificados", href: "/certificados", icon: Award },
  { label: "Mi perfil", href: "/perfil", icon: UserIcon },
];

type MobileUser = {
  nombre: string;
  apellido: string;
  puesto?: { nombre: string } | null;
};

export function DashboardSidebarMobile({ user }: { user: MobileUser }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <Link href="/home">
          <EducanetLogo variant="full" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
      </nav>
      <Separator />
      <div className="p-4">
        <p className="text-sm font-medium">{user.nombre} {user.apellido}</p>
        <p className="text-xs text-muted-foreground">{user.puesto?.nombre ?? "Sin puesto"}</p>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </form>
      </div>
    </div>
  );
}
