import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { obtenerMiEquipoIds } from "@/lib/equipo/jefe";
import { calcularSaludProyecto, type ProyectoConSalud } from "./salud";

export {
  calcularSaludProyecto,
  agregarResumenProyectos,
  type ProyectoConSalud,
  type SaludProyecto,
  type CargaMiembro,
  type WorkflowParaSalud,
} from "./salud";

export async function obtenerProyectosDelEquipo(params: {
  areaId: string;
  jefeId: string;
}): Promise<ProyectoConSalud[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("proyectos-equipo", `proyectos-equipo-${params.areaId}`);

  const equipoIds = await obtenerMiEquipoIds(params.areaId, params.jefeId);
  const idsRelevantes = [...equipoIds, params.jefeId];

  const workflows = await prisma.workflowInstancia.findMany({
    where: {
      estadoGeneral: { in: ["ACTIVO", "PAUSADO"] },
      OR: [
        { responsableGeneralId: { in: idsRelevantes } },
        { tareas: { some: { asignadoAId: { in: idsRelevantes } } } },
      ],
    },
    include: {
      plantilla: { select: { nombre: true, categoria: true } },
      responsableGeneral: {
        select: { id: true, nombre: true, apellido: true },
      },
      tareas: {
        select: {
          id: true,
          estado: true,
          fechaEstimadaInicio: true,
          fechaEstimadaFin: true,
          completadaEn: true,
          asignadoA: {
            select: { id: true, nombre: true, apellido: true, avatarUrl: true },
          },
        },
      },
    },
    orderBy: { fechaHito: "asc" },
  });

  return workflows.map((w) =>
    calcularSaludProyecto({
      id: w.id,
      nombre: w.nombre,
      contextoMarca: w.contextoMarca,
      fechaHito: w.fechaHito,
      estadoGeneral: w.estadoGeneral,
      responsableGeneral: w.responsableGeneral,
      plantilla: { nombre: w.plantilla.nombre, categoria: w.plantilla.categoria },
      tareas: w.tareas,
    }),
  );
}
