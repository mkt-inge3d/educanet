import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await cookies();
  const user = await requireRole(["ADMIN", "RRHH"]);
  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();

  return (
    <div className="flex min-h-full overflow-x-hidden">
      <AdminSidebar rol={user.rol} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card/90 px-4 backdrop-blur-sm md:px-6">
          <div />
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {user.rol}
            </Badge>
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">{user.nombre}</span>
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="icon-sm" type="submit" aria-label="Cerrar sesion">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>

        <main className="flex min-w-0 flex-1 flex-col p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
