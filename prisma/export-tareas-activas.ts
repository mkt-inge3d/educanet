import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { writeFileSync } from "fs";
import { join } from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function fmtFecha(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function esc(s: string | null | undefined): string {
  if (!s) return "";
  // Envuelve en comillas dobles y escapa comillas internas
  return `"${String(s).replace(/"/g, '""')}"`;
}

async function main() {
  const tareas = await prisma.tareaInstancia.findMany({
    where: { estado: { in: ["PENDIENTE", "EN_PROGRESO"] } },
    orderBy: [{ estado: "asc" }, { fechaEstimadaFin: "asc" }, { createdAt: "asc" }],
    include: {
      asignadoA: {
        select: {
          nombre: true,
          apellido: true,
          email: true,
          puesto: { select: { nombre: true } },
          area: { select: { nombre: true } },
        },
      },
      catalogoTarea: {
        select: {
          nombre: true,
          categoria: true,
          tipoTrabajo: true,
        },
      },
      workflowInstancia: {
        select: { nombre: true, contextoMarca: true, fechaHito: true },
      },
      checklistMarcados: { select: { marcado: true } },
    },
  });

  type AdHocItem = { texto: string; marcado: boolean };

  const filas = tareas.map((t) => {
    const nombre = t.nombreAdHoc ?? t.catalogoTarea?.nombre ?? "(sin nombre)";
    const categoria = t.catalogoTarea?.categoria.replace(/_/g, " ") ?? "Ad-hoc";
    const tipo = t.catalogoTarea ? "Catálogo" : "Ad-hoc";
    const asignado = t.asignadoA
      ? `${t.asignadoA.nombre} ${t.asignadoA.apellido}`
      : "";
    const email = t.asignadoA?.email ?? "";
    const puesto = t.asignadoA?.puesto?.nombre ?? "";
    const area = t.asignadoA?.area?.nombre ?? "";
    const workflow = t.workflowInstancia
      ? [t.workflowInstancia.nombre, t.workflowInstancia.contextoMarca]
          .filter(Boolean)
          .join(" · ")
      : "";
    const hito = fmtFecha(t.workflowInstancia?.fechaHito);
    const negocio = t.negocio ?? "";
    const fechaInicio = fmtFecha(t.fechaEstimadaInicio);
    const fechaFin = fmtFecha(t.fechaEstimadaFin);

    // Checklist
    const totalChecklist = t.catalogoTarea
      ? t.checklistMarcados.length
      : ((t.checklistAdHoc as AdHocItem[] | null)?.length ?? 0);
    const marcadosChecklist = t.catalogoTarea
      ? t.checklistMarcados.filter((m) => m.marcado).length
      : ((t.checklistAdHoc as AdHocItem[] | null)?.filter((i) => i.marcado).length ?? 0);
    const checklistPct =
      totalChecklist > 0
        ? `${marcadosChecklist}/${totalChecklist} (${Math.round((marcadosChecklist / totalChecklist) * 100)}%)`
        : "";

    const tiempoMin = t.tiempoEstimadoMinAdHoc ?? t.catalogoTarea ? "" : "";
    const puntosBase = t.puntosBaseAdHoc ?? "";

    return [
      esc(t.estado === "PENDIENTE" ? "Pendiente" : "En progreso"),
      esc(nombre),
      esc(tipo),
      esc(categoria),
      esc(asignado),
      esc(email),
      esc(puesto),
      esc(area),
      esc(workflow),
      esc(hito),
      esc(negocio),
      esc(fechaInicio),
      esc(fechaFin),
      esc(checklistPct),
      esc(String(puntosBase)),
    ].join(",");
  });

  const encabezado = [
    "Estado",
    "Tarea",
    "Tipo",
    "Categoría",
    "Asignado a",
    "Email",
    "Puesto",
    "Área",
    "Workflow",
    "Hito",
    "Negocio",
    "Fecha inicio estimada",
    "Fecha fin estimada",
    "Checklist",
    "Puntos base",
  ]
    .map(esc)
    .join(",");

  const csv = "﻿" + [encabezado, ...filas].join("\n"); // BOM para Excel en Windows
  const salida = join(process.cwd(), "tareas-activas.csv");
  writeFileSync(salida, csv, "utf-8");

  console.log(`✓ Exportadas ${tareas.length} tareas → ${salida}`);
  const pendientes = tareas.filter((t) => t.estado === "PENDIENTE").length;
  const enProgreso = tareas.filter((t) => t.estado === "EN_PROGRESO").length;
  console.log(`  Pendientes: ${pendientes} | En progreso: ${enProgreso}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
