"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PuntosDisplay } from "@/components/shared/PuntosDisplay";
import { RachaIndicator } from "@/components/shared/RachaIndicator";
import { NotificacionesBell } from "./NotificacionesBell";
import { ThemeToggle } from "./ThemeToggle";
import { DashboardSidebarMobile } from "./DashboardSidebarMobile";
import { CommandPalette } from "@/components/busqueda/CommandPalette";

type HeaderUser = {
  nombre: string;
  apellido: string;
  email: string;
  puntosTotales: number;
  rachaActual: number;
  puesto?: { nombre: string } | null;
};

export function DashboardHeader({ user }: { user: HeaderUser }) {
  return (
    <header className="glass-subtle sticky top-0 z-20 flex h-16 items-center gap-4 px-4 md:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-72 p-0">
          <DashboardSidebarMobile user={user} />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="flex-1">
        <CommandPalette />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <RachaIndicator dias={user.rachaActual} size="sm" showLabel={false} />
        <PuntosDisplay puntos={user.puntosTotales} size="sm" />
        <NotificacionesBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
