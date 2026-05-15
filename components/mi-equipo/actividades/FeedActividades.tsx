"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemActividad } from "./ItemActividad";
import type { ItemActividad as Item } from "@/lib/equipo/actividades";

type Grupo = {
  userId: string;
  userNombre: string;
  userApellido: string;
  userAvatar: string | null;
  items: Item[];
};

type Props = {
  cronologico: Item[];
  porMiembro: Grupo[];
};

export function FeedActividades({ cronologico, porMiembro }: Props) {
  return (
    <Tabs defaultValue="cronologico">
      <TabsList>
        <TabsTrigger value="cronologico">Cronológico</TabsTrigger>
        <TabsTrigger value="por-miembro">Por miembro</TabsTrigger>
      </TabsList>

      <TabsContent value="cronologico" className="mt-3">
        <div className="rounded-xl border border-border/60 bg-card/40 p-2">
          {cronologico.length === 0 ? (
            <VacioFeed />
          ) : (
            <ul className="divide-y divide-border/40">
              {cronologico.map((it) => (
                <li key={it.id}>
                  <ItemActividad item={it} mostrarHora />
                </li>
              ))}
            </ul>
          )}
        </div>
      </TabsContent>

      <TabsContent value="por-miembro" className="mt-3">
        <div className="space-y-3">
          {porMiembro.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card/40 p-2">
              <VacioFeed />
            </div>
          ) : (
            porMiembro.map((g) => {
              const iniciales = `${g.userNombre[0] ?? ""}${g.userApellido[0] ?? ""}`.toUpperCase();
              return (
                <details
                  key={g.userId}
                  open
                  className="group rounded-xl border border-border/60 bg-card/40"
                >
                  <summary className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/40">
                    <Avatar size="sm">
                      {g.userAvatar && <AvatarImage src={g.userAvatar} alt="" />}
                      <AvatarFallback>{iniciales}</AvatarFallback>
                    </Avatar>
                    <p className="flex-1 text-sm font-medium">
                      {g.userNombre} {g.userApellido}
                    </p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums">
                      {g.items.length}{" "}
                      {g.items.length === 1 ? "evento" : "eventos"}
                    </span>
                  </summary>
                  <ul className="divide-y divide-border/40 border-t border-border/40 px-1 py-1">
                    {g.items.map((it) => (
                      <li key={it.id}>
                        <ItemActividad item={it} mostrarHora />
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function VacioFeed() {
  return (
    <div className="flex flex-col items-center gap-1 p-10 text-center text-sm">
      <p className="font-medium">Sin actividad registrada</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Nadie del equipo completó tareas, validó hitos o avanzó en aprendizaje
        este día.
      </p>
    </div>
  );
}
