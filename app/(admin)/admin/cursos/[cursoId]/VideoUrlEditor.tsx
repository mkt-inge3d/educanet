"use client";

import { useState, useTransition } from "react";
import { Check, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actualizarVideoUrlLeccion } from "@/lib/admin/cursos-actions";

export function VideoUrlEditor({
  leccionId,
  currentUrl,
  hasBunny,
}: {
  leccionId: string;
  currentUrl: string | null;
  hasBunny: boolean;
}) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await actualizarVideoUrlLeccion(leccionId, url.trim() || null);
      setSaved(true);
      toast.success("URL de video guardada");
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleClear = () => {
    setUrl("");
  };

  return (
    <div className="space-y-2 pl-6">
      {hasBunny && (
        <p className="text-xs text-warning">
          Esta lección ya tiene Bunny Stream configurado. La URL de R2 tendrá prioridad.
        </p>
      )}
      <div className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <Input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setSaved(false); }}
          placeholder="https://pub-xxx.r2.dev/video.mp4"
          className="h-8 text-xs font-mono"
        />
        {url && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending || saved}
          className="h-8 px-3 text-xs shrink-0"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
      {currentUrl && (
        <p className="text-[11px] text-muted-foreground truncate pl-5">
          Actual: {currentUrl}
        </p>
      )}
    </div>
  );
}
