"use client";

import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { HeartbeatTracker } from "./HeartbeatTracker";
import { cn } from "@/lib/utils";

type SidebarUser = {
  nombre: string;
  apellido: string;
  email: string;
  rol?: string;
  puesto?: { nombre: string } | null;
};

type HeaderUser = SidebarUser & {
  puntosTotales: number;
  rachaActual: number;
};

export function DashboardShell({
  sidebarUser,
  headerUser,
  initialCollapsed,
  children,
}: {
  sidebarUser: SidebarUser;
  headerUser: HeaderUser;
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `sidebar-collapsed=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div className="flex min-h-full">
      <DashboardSidebar user={sidebarUser} collapsed={collapsed} onToggle={toggle} />
      <div
        className={cn(
          "flex flex-1 flex-col transition-[padding] duration-200 ease-in-out",
          collapsed ? "md:pl-[72px]" : "md:pl-[260px]"
        )}
      >
        <DashboardHeader user={headerUser} />
        <HeartbeatTracker />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
