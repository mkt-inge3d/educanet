export function ModuloHeaderSidebar({
  titulo,
  indice,
}: {
  titulo: string;
  indice: number;
}) {
  return (
    <div
      className={
        "relative pl-[42px] pr-3 pb-2 " + (indice === 0 ? "pt-1" : "pt-4")
      }
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground line-clamp-2">
        {titulo}
      </h3>
    </div>
  );
}
