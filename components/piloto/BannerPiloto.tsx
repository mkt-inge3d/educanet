import { Beaker, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { obtenerPilotoContextoPorArea } from "@/lib/piloto/queries";

export async function BannerPiloto({
  areaId,
}: {
  areaId: string | null | undefined;
}) {
  const { enPiloto, mostrarBanner, diasRestantes } =
    await obtenerPilotoContextoPorArea(areaId);

  if (!enPiloto || !mostrarBanner) return null;

  return (
    <div className="border-b bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Beaker className="h-3 w-3" />
            MODO PILOTO
          </span>
          <span className="text-foreground">Sistema en fase piloto.</span>
          <span className="hidden text-muted-foreground sm:inline">
            Los puntos no afectan evaluaciones formales este mes.
          </span>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="hidden text-xs text-muted-foreground md:inline">
            Termina en {diasRestantes} dias
          </span>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Info className="mr-1 h-3 w-3" />
                  Que significa?
                </Button>
              }
            />
            <PopoverContent className="w-80">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold">Estamos probando algo nuevo</h4>
                <p className="text-muted-foreground">
                  Durante este mes estamos pilotando un sistema que suma
                  tus logros (KPIs, cursos, reconocimientos, compromisos)
                  en un solo lugar.
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">
                    Los puntos y rangos son solo para aprender:
                  </strong>{" "}
                  no afectan tu evaluacion formal, tu salario, ni
                  decisiones de RRHH este mes.
                </p>
                <p className="text-muted-foreground">
                  Al final evaluaremos juntos si lo adoptamos, lo ajustamos
                  o lo descartamos.
                </p>
                <p className="border-t pt-2 text-xs">
                  Preguntas? Habla con tu jefe directo.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
