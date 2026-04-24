"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  Trophy,
  Award,
  User as UserIcon,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Settings,
  Target,
  Heart,
  CheckSquare,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EducanetLogo } from "@/components/shared/EducanetLogo";
import { logoutAction } from "@/app/(dashboard)/actions";
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
      { label: "Reconocimientos", href: "/reconocimientos", icon: Heart },
      { label: "Mis hitos KPI", href: "/compromisos", icon: CheckSquare },
      { label: "Mi equipo", href: "/mi-equipo", icon: Users, soloJefe: true },
      { label: "Revisar hitos", href: "/mi-equipo/validacion-kpis", icon: ClipboardCheck, soloJefe: true },
      // Ocultos durante el piloto (redundantes con Mi progreso):
      // { label: "Mi carrera", href: "/mi-carrera", icon: TrendingUp },
      // { label: "Desempeno", href: "/desempeno", icon: LineChart },
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

type SidebarUser = {
  nombre: string;
  apellido: string;
  email: string;
  rol?: string;
  puesto?: { nombre: string } | null;
};

export function DashboardSidebar({
  user,
  collapsed,
  onToggle,
}: {
  user: SidebarUser;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const toggle = onToggle;

  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();

  const esJefe = user.puesto?.nombre?.startsWith("Jefe") ?? false;
  const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
  const puedeVerJefe = esJefe || esAdmin;

  const seccionesFiltradas = sections.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.soloJefe || puedeVerJefe),
  }));

  return (
    <TooltipProvider>
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-30 hidden flex-col glass-subtle border-r border-border/50 md:flex"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/home">
            <EducanetLogo variant={collapsed ? "icon" : "full"} />
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggle}
              aria-label="Colapsar sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
          {collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggle}
              aria-label="Expandir sidebar"
              className="absolute -right-3 top-5 z-40 h-6 w-6 rounded-full border bg-card shadow-sm"
            >
              <PanelLeft className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {seccionesFiltradas.map((section, si) => (
            <div key={section.title} className={si > 0 ? "mt-4" : ""}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>
              {collapsed && si > 0 && (
                <Separator className="my-2" />
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={<span className="block" />}>
                        {link}
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return <div key={item.href}>{link}</div>;
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted",
                    collapsed && "justify-center"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {user.nombre} {user.apellido}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.puesto?.nombre ?? "Sin puesto"}
                      </p>
                    </div>
                  )}
                </button>
              }
            />
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem>
                <Link href="/perfil" className="flex w-full items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/perfil" className="flex w-full items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuracion
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  const form = document.createElement("form");
                  form.method = "POST";
                  form.action = "";
                  document.body.appendChild(form);
                  // Use server action via fetch
                  fetch("", { method: "POST" }).then(() => {
                    window.location.href = "/login";
                  });
                }}
              >
                <form action={logoutAction} className="flex w-full items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <button type="submit" className="text-left">Cerrar sesion</button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
