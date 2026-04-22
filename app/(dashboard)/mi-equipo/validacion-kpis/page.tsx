import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import {
  obtenerColaValidacionJefe,
  obtenerConfiguracionMesJefe,
} from "@/lib/kpis/hitos-queries";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { ItemValidacionKpi } from "@/components/jefe/ItemValidacionKpi";
import { ConfiguracionMesKpis } from "@/components/jefe/ConfiguracionMesKpis";

export const metadata = { title: "Validacion KPIs" };

function esJefeOAdmin(user: { rol: string; puesto: { nombre: string } | null }) {
  if (user.rol === "ADMIN" || user.rol === "RRHH") return true;
  return user.puesto?.nombre.startsWith("Jefe") ?? false;
}

export default async function ValidacionKpisPage() {
  const user = await requireAuth();
  if (!esJefeOAdmin(user)) redirect("/unauthorized");

  const { mes, anio } = mesActual();

  const [cola, configuracion] = await Promise.all([
    obtenerColaValidacionJefe(user.areaId),
    obtenerConfiguracionMesJefe(user.areaId, mes, anio),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/mi-equipo"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver a Mi equipo
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Revisar hitos del equipo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hitos que el equipo marco como terminados. Si encuentras alguno mal,
          regresalo como tarea incompleta y se restaran los puntos automaticamente.
        </p>
      </div>

      <Tabs defaultValue="pendientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pendientes">
            Para revisar ({cola.total})
          </TabsTrigger>
          <TabsTrigger value="configurar">Configurar mes</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-3">
          {cola.total === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Aun no hay hitos terminados para revisar este mes.
            </div>
          ) : (
            cola.items.map((item) => (
              <ItemValidacionKpi key={item.instanciaId} item={item} />
            ))
          )}
        </TabsContent>

        <TabsContent value="configurar">
          <ConfiguracionMesKpis items={configuracion.items} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
