import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  Heart,
  Target,
  ShieldCheck,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { ItemActividad as Item, TipoActividad } from "@/lib/equipo/actividades";

const CONFIG: Record<
  TipoActividad,
  { verbo: string; icon: React.ReactNode; tone: string; bgDot: string }
> = {
  TAREA_COMPLETADA: {
    verbo: "completó",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    tone: "text-success",
    bgDot: "bg-success",
  },
  TAREA_VALIDADA: {
    verbo: "validaste su tarea",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    tone: "text-primary",
    bgDot: "bg-primary",
  },
  KPI_APROBADO: {
    verbo: "alcanzó un hito de KPI",
    icon: <ClipboardCheck className="h-3.5 w-3.5" />,
    tone: "text-primary",
    bgDot: "bg-primary",
  },
  LECCION: {
    verbo: "avanzó en aprendizaje",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    tone: "text-warning",
    bgDot: "bg-warning",
  },
  RECONOCIMIENTO: {
    verbo: "recibió un reconocimiento",
    icon: <Heart className="h-3.5 w-3.5" />,
    tone: "text-rose-500",
    bgDot: "bg-rose-500",
  },
  MISION: {
    verbo: "completó una misión",
    icon: <Target className="h-3.5 w-3.5" />,
    tone: "text-primary",
    bgDot: "bg-primary",
  },
};

function formatHora(d: Date): string {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

type Props = {
  item: Item;
  mostrarHora?: boolean;
};

export function ItemActividad({ item, mostrarHora = true }: Props) {
  const cfg = CONFIG[item.tipo];
  const iniciales = `${item.userNombre[0] ?? ""}${item.userApellido[0] ?? ""}`.toUpperCase();

  const cuerpo = (
    <div className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
      {mostrarHora && (
        <span className="mt-0.5 w-12 shrink-0 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
          {formatHora(item.timestamp)}
        </span>
      )}
      <div className="relative flex shrink-0 items-center justify-center">
        <span
          className={`absolute -left-0.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${cfg.bgDot}`}
          aria-hidden
        />
        <Avatar size="sm" className="ml-1.5">
          {item.userAvatar && <AvatarImage src={item.userAvatar} alt="" />}
          <AvatarFallback>{iniciales}</AvatarFallback>
        </Avatar>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className="font-medium">
            {item.userNombre} {item.userApellido}
          </span>{" "}
          <span className="text-muted-foreground">{cfg.verbo}</span>{" "}
          <span className="font-medium">{item.titulo}</span>
        </p>
        {(item.workflow || item.descripcion) && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {item.workflow && <span>en {item.workflow}</span>}
            {item.workflow && item.descripcion && " · "}
            {item.descripcion}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 self-center">
        {item.puntos != null && item.puntos > 0 && (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
            +{item.puntos}
          </span>
        )}
        <span className={cfg.tone}>{cfg.icon}</span>
      </div>
    </div>
  );

  if (item.referenciaUrl) {
    return (
      <Link href={item.referenciaUrl} className="block">
        {cuerpo}
      </Link>
    );
  }
  return cuerpo;
}
