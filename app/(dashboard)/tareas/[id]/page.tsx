import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth";
import { esJefeDelArea } from "@/lib/tareas/helpers";
import { obtenerTareaDetalle, obtenerCompanerosArea } from "@/lib/tareas/queries";
import { Button } from "@/components/ui/button";
import { DetalleTareaClient } from "@/components/tareas/DetalleTareaClient";

export const metadata = { title: "Detalle de tarea" };

export default async function TareaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const data = await obtenerTareaDetalle(id, user.id);
  if (!data) notFound();

  let modoLectura = false;
  if (!data.esPropia) {
    const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
    if (esAdmin) {
      // admins pueden ver y editar cualquier tarea
    } else {
      const puedeComoJefe = data.tarea.asignadoAId
        ? await esJefeDelArea(user.id, data.tarea.asignadoAId)
        : false;
      if (!puedeComoJefe) redirect("/unauthorized");
      modoLectura = true;
    }
  }

  const { tarea } = data;

  const companeros = user.areaId
    ? await obtenerCompanerosArea({ areaId: user.areaId, excluirUserId: user.id })
    : [];

  const volverHref = modoLectura
    ? `/mi-equipo/${tarea.asignadoAId}`
    : "/tareas";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href={volverHref} />}>
        <ArrowLeft />
        {modoLectura ? "Volver al equipo" : "Volver al kanban"}
      </Button>

      <DetalleTareaClient tarea={tarea} companeros={companeros} modoLectura={modoLectura} />
    </div>
  );
}
