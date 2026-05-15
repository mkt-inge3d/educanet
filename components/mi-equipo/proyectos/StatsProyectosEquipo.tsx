import { CheckCircle2, AlertTriangle, XOctagon, FolderKanban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  total: number;
  saludables: number;
  enRiesgo: number;
  criticos: number;
};

export function StatsProyectosEquipo({ total, saludables, enRiesgo, criticos }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
        label="Proyectos"
        value={total}
        tone="default"
      />
      <Stat
        icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        label="Saludables"
        value={saludables}
        tone="success"
      />
      <Stat
        icon={<AlertTriangle className="h-4 w-4 text-warning" />}
        label="En riesgo"
        value={enRiesgo}
        tone="warning"
      />
      <Stat
        icon={<XOctagon className="h-4 w-4 text-destructive" />}
        label="Críticos"
        value={criticos}
        tone="destructive"
      />
    </div>
  );
}

type Tone = "default" | "success" | "warning" | "destructive";

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: Tone;
}) {
  const ring =
    tone === "success"
      ? "ring-success/20"
      : tone === "warning"
        ? "ring-warning/20"
        : tone === "destructive"
          ? "ring-destructive/20"
          : "ring-border/50";
  return (
    <Card className={`ring-1 ${ring}`}>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className="rounded-md bg-muted/60 p-2">{icon}</div>
      </CardContent>
    </Card>
  );
}
