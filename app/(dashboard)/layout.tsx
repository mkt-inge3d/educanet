import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BannerPiloto } from "@/components/piloto/BannerPiloto";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const cookieStore = await cookies();
  const sidebarCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  const orgs = (user.memberships ?? []).map((m) => ({
    id: m.organization.id,
    nombre: m.organization.nombre,
    slug: m.organization.slug,
  }));
  const currentOrgId =
    user.currentOrgId ??
    user.organizationId ??
    orgs[0]?.id ??
    null;

  const sidebarUser = {
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    rol: user.rol,
    puesto: user.puesto,
    orgs,
    currentOrgId,
  };

  const headerUser = {
    ...sidebarUser,
    puntosTotales: user.puntosTotales,
    rachaActual: user.rachaActual,
  };

  return (
    <DashboardShell
      sidebarUser={sidebarUser}
      headerUser={headerUser}
      initialCollapsed={sidebarCollapsed}
    >
      <BannerPiloto areaId={user.areaId} />
      {children}
    </DashboardShell>
  );
}
