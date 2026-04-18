import { Captions, MessageCircle, StickyNote } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EditorNotas } from "./notas/EditorNotas";
import { SeccionComentariosPanel } from "./comentarios/SeccionComentariosPanel";
import type { NotaLeccion } from "@/types/lecciones";

export async function LeccionPanelDer({
  leccionId,
  notas,
  currentUserId,
  esAdmin,
}: {
  leccionId: string;
  notas: NotaLeccion[];
  currentUserId: string;
  esAdmin: boolean;
}) {
  return (
    <Tabs defaultValue="comentarios" className="flex h-full flex-col">
      <TabsList className="mx-3 mt-3 grid grid-cols-3">
        <TabsTrigger value="comentarios" className="text-xs">
          <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
          Comentarios
        </TabsTrigger>
        <TabsTrigger value="notas" className="text-xs">
          <StickyNote className="mr-1.5 h-3.5 w-3.5" />
          Notas
        </TabsTrigger>
        <TabsTrigger value="transcripcion" className="text-xs">
          <Captions className="mr-1.5 h-3.5 w-3.5" />
          Texto
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="comentarios"
        className="mt-3 flex-1 overflow-hidden"
      >
        <SeccionComentariosPanel
          leccionId={leccionId}
          currentUserId={currentUserId}
          esAdmin={esAdmin}
        />
      </TabsContent>

      <TabsContent value="notas" className="mt-3 flex-1 overflow-y-auto p-4">
        <EditorNotas leccionId={leccionId} notasIniciales={notas} />
      </TabsContent>

      <TabsContent
        value="transcripcion"
        className="mt-3 flex-1 overflow-y-auto p-4"
      >
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Captions className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            La transcripcion estara disponible proximamente
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
