import { CalendarOff } from "lucide-react";
import { requireJefe } from "@/lib/equipo/jefe";
import {
  obtenerAgendaDelEquipo,
  resumirAgenda,
} from "@/lib/equipo/agenda";
import { Card, CardContent } from "@/components/ui/card";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";
import { SelectorFecha } from "@/components/mi-equipo/actividades/SelectorFecha";
import { StatsAgenda } from "@/components/mi-equipo/agenda/StatsAgenda";
import { FilaMiembroAgendaItem } from "@/components/mi-equipo/agenda/FilaMiembroAgenda";

export const metadata = { title: "Agenda del equipo" };

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

const ORDEN_CARGA = { ROJO: 0, AMARILLO: 1, VERDE: 2, VACIO: 3 } as const;

type SearchParams = { fecha?: string };

export default async function AgendaEquipoPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireJefe();
  const areaId = user.areaId!;

  const { fecha: fechaParam } = await props.searchParams;
  const hoy = fechaHoyIso();
  const fechaActual =
    fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) ? fechaParam : hoy;
  const fecha = parseFechaParam(fechaActual, hoy);

  const filas = await obtenerAgendaDelEquipo({
    areaId,
    jefeId: user.id,
    fecha,
  });
  const resumen = resumirAgenda(filas);

  const ordenadas = [...filas].sort(
    (a, b) =>
      ORDEN_CARGA[a.carga] - ORDEN_CARGA[b.carga] ||
      a.nombre.localeCompare(b.nombre),
  );

  return (
    <div className="relative mx-auto max-w-6xl space-y-6">
      <section className="relative mb-2 overflow-hidden pb-4 pt-2">
        <HaloBackground variant="top" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {user.area?.nombre ?? "Área"} · planificación diaria
            </p>
            <KineticTitle
              text="Agenda del equipo"
              as="h1"
              className="text-3xl font-semibold tracking-tighter sm:text-4xl"
            />
            <p className="max-w-2xl text-sm text-muted-foreground">
              Mapeá lo que cada persona del equipo tiene asignado para el día.
              Detectá sobrecarga, gaps y tareas que vencen.
            </p>
          </div>
          <SelectorFecha
            fechaActual={fechaActual}
            hoy={hoy}
            basePath="/mi-equipo/agenda"
            permitirFuturo
          />
        </div>
      </section>

      <StatsAgenda resumen={resumen} />

      {filas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CalendarOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No hay miembros en el área</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Cuando incorporés gente al equipo vas a ver su agenda diaria acá.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ordenadas.map((f) => (
            <FilaMiembroAgendaItem
              key={f.userId}
              fila={f}
              fechaDelDia={fecha}
            />
          ))}
        </div>
      )}
    </div>
  );
}
