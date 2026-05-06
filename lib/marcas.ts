export interface MarcaConfig {
  id: string
  label: string
  color: string        // hex para el dot y badge
  textColor: string    // blanco o negro según contraste
  bg: string          // clase Tailwind inline-style background
}

export const MARCAS: MarcaConfig[] = [
  {
    id: "ansys",
    label: "Ansys",
    color: "#FFB71B",
    textColor: "#000",
    bg: "rgb(255,183,27)",
  },
  {
    id: "autodesk-manufactura",
    label: "Autodesk Manufactura",
    color: "#E86B17",
    textColor: "#fff",
    bg: "rgb(232,107,23)",
  },
  {
    id: "autodesk-aec",
    label: "Autodesk AEC",
    color: "#0073CF",
    textColor: "#fff",
    bg: "rgb(0,115,207)",
  },
  {
    id: "autodesk-m&e",
    label: "Autodesk M&E",
    color: "#0B8A3E",
    textColor: "#fff",
    bg: "rgb(11,138,62)",
  },
  {
    id: "ptc",
    label: "PTC",
    color: "#6B2D8B",
    textColor: "#fff",
    bg: "rgb(107,45,139)",
  },
  {
    id: "otro",
    label: "Otro",
    color: "#6B7280",
    textColor: "#fff",
    bg: "rgb(107,114,128)",
  },
]

export const MARCA_POR_ID = new Map(MARCAS.map((m) => [m.id, m]))

export function getMarcaByLabel(label: string): MarcaConfig | undefined {
  return MARCAS.find((m) => m.label.toLowerCase() === label.toLowerCase())
    ?? (label ? MARCAS.find((m) => m.id === "otro") : undefined)
}
