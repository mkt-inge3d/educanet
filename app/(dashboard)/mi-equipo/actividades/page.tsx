import { Activity } from "lucide-react";
import { requireJefe } from "@/lib/equipo/jefe";
import {
  agruparPorMiembro,
  obtenerActividadDelEquipo,
  obtenerResumenActividad,
} from "@/lib/equipo/actividades";
import { Card, CardContent } from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";
import { SelectorFecha } from "@/components/mi-equipo/actividades/SelectorFecha";
import { ResumenDiario } from "@/components/mi-equipo/actividades/ResumenDiario";
import { FeedActividades } from "@/components/mi-equipo/actividades/FeedActividades";

export const metadata = { title: "Actividad del equipo" };

function fechaHoyIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseFechaParam(valor: string | undefined, hoy: string): Date {
  const iso = valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : hoy;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

type SearchParams = { fecha?: string };

export default async function ActividadesEquipoPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireJefe();
  const areaId = user.areaId!;

  const { fecha: fechaParam } = await props.searchParams;
  const hoy = fechaHoyIso();
  const fechaActual =
    fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) ? fechaParam : hoy;
  const fecha = parseFechaParam(fechaActual, hoy);

  const items = await obtenerActividadDelEquipo({
    areaId,
    jefeId: user.id,
    fecha,
  });
  const resumen = await obtenerResumenActividad({
    areaId,
    jefeId: user.id,
    items,
  });
  const porMiembro = agruparPorMiembro(items);
  const totalMiembros =
    resumen.miembrosActivos + resumen.miembrosSinActividad.length;

  return (
    <div className="relative mx-auto max-w-6xl space-y-6">
      <section className="relative mb-2 overflow-hidden pb-4 pt-2">
        <HaloBackground variant="top" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {user.area?.nombre ?? "Área"} · reporte automático
            </p>
            <KineticTitle
              text="Actividad del equipo"
              as="h1"
              className="text-3xl font-semibold tracking-tighter sm:text-4xl"
            />
            <p className="max-w-2xl text-sm text-muted-foreground">
              Qué hizo tu equipo en el día: tareas completadas, validaciones,
              KPIs aprobados y aprendizaje. Se actualiza solo.
            </p>
          </div>
          <SelectorFecha fechaActual={fechaActual} hoy={hoy} />
        </div>
      </section>

      <ResumenDiario resumen={resumen} totalMiembros={totalMiembros} />

      {resumen.miembrosSinActividad.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Sin actividad
            </p>
            <AvatarGroup>
              {resumen.miembrosSinActividad.slice(0, 8).map((m) => {
                const inic = `${m.nombre[0] ?? ""}${m.apellido[0] ?? ""}`.toUpperCase();
                return (
                  <Avatar key={m.id} size="sm">
                    {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
                    <AvatarFallback>{inic}</AvatarFallback>
                  </Avatar>
                );
              })}
              {resumen.miembrosSinActividad.length > 8 && (
                <AvatarGroupCount className="size-6 text-[10px]">
                  +{resumen.miembrosSinActividad.length - 8}
                </AvatarGroupCount>
              )}
            </AvatarGroup>
            <p className="flex-1 text-xs text-muted-foreground">
              {resumen.miembrosSinActividad
                .slice(0, 3)
                .map((m) => `${m.nombre} ${m.apellido[0]}.`)
                .join(", ")}
              {resumen.miembrosSinActividad.length > 3 &&
                ` y ${resumen.miembrosSinActividad.length - 3} más`}{" "}
              no registraron movimientos. Puede ser un día libre o trabajo
              offline.
            </p>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Nada que reportar</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              No hubo movimientos en el equipo este día. Probá con otra fecha o
              esperá a que llegue actividad.
            </p>
          </CardContent>
        </Card>
      ) : (
        <FeedActividades cronologico={items} porMiembro={porMiembro} />
      )}
    </div>
  );
}
