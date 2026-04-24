/**
 * Catálogo de negocios / marcas con estilos. Función pura — importable
 * desde server y client.
 */
import type { Negocio } from "@prisma/client";

export type NegocioInfo = {
  codigo: Negocio;
  label: string;
  labelCorto: string;
  /** Color hex principal (también usado como tinte en badges). */
  color: string;
  /** Clases Tailwind para badges / chips (auto-adapta a dark). */
  badgeClass: string;
  /** Clase de borde izquierdo para cards (accent discreto). */
  borderClass: string;
  /** Clase de dot indicador. */
  dotClass: string;
};

export const NEGOCIOS: Record<Negocio, NegocioInfo> = {
  ANSYS: {
    codigo: "ANSYS",
    label: "Ansys",
    labelCorto: "Ansys",
    color: "#E8471C",
    badgeClass: "bg-[#E8471C]/10 text-[#E8471C] border-[#E8471C]/30",
    borderClass: "border-l-[#E8471C]",
    dotClass: "bg-[#E8471C]",
  },
  AUTODESK_MFG: {
    codigo: "AUTODESK_MFG",
    label: "Autodesk MFG",
    labelCorto: "Autodesk MFG",
    color: "#0696D7",
    badgeClass: "bg-[#0696D7]/10 text-[#0696D7] border-[#0696D7]/30",
    borderClass: "border-l-[#0696D7]",
    dotClass: "bg-[#0696D7]",
  },
  AUTODESK_AEC: {
    codigo: "AUTODESK_AEC",
    label: "Autodesk AEC",
    labelCorto: "Autodesk AEC",
    color: "#1A7FC1",
    badgeClass: "bg-[#1A7FC1]/10 text-[#1A7FC1] border-[#1A7FC1]/30",
    borderClass: "border-l-[#1A7FC1]",
    dotClass: "bg-[#1A7FC1]",
  },
  ORACLE: {
    codigo: "ORACLE",
    label: "Oracle",
    labelCorto: "Oracle",
    color: "#C74634",
    badgeClass: "bg-[#C74634]/10 text-[#C74634] border-[#C74634]/30",
    borderClass: "border-l-[#C74634]",
    dotClass: "bg-[#C74634]",
  },
  INGE3D: {
    codigo: "INGE3D",
    label: "Inge3d",
    labelCorto: "Inge3d",
    color: "#7C3AED",
    badgeClass: "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30",
    borderClass: "border-l-[#7C3AED]",
    dotClass: "bg-[#7C3AED]",
  },
  LYRACODE: {
    codigo: "LYRACODE",
    label: "Lyracode",
    labelCorto: "Lyracode",
    color: "#14B8A6",
    badgeClass: "bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/30",
    borderClass: "border-l-[#14B8A6]",
    dotClass: "bg-[#14B8A6]",
  },
  CURSOS: {
    codigo: "CURSOS",
    label: "Cursos",
    labelCorto: "Cursos",
    color: "#F59E0B",
    badgeClass: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
    borderClass: "border-l-[#F59E0B]",
    dotClass: "bg-[#F59E0B]",
  },
};

export const LISTA_NEGOCIOS: NegocioInfo[] = [
  NEGOCIOS.ANSYS,
  NEGOCIOS.AUTODESK_MFG,
  NEGOCIOS.AUTODESK_AEC,
  NEGOCIOS.ORACLE,
  NEGOCIOS.INGE3D,
  NEGOCIOS.LYRACODE,
  NEGOCIOS.CURSOS,
];

export function infoNegocio(codigo: Negocio | null | undefined): NegocioInfo | null {
  if (!codigo) return null;
  return NEGOCIOS[codigo] ?? null;
}
