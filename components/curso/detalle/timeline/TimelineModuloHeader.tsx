export function TimelineModuloHeader({
  titulo,
  descripcion,
  indice,
}: {
  titulo: string;
  descripcion: string | null;
  indice: number;
}) {
  return (
    <div
      className={
        "relative pl-[3.75rem] " +
        (indice === 0 ? "pb-3 pt-1" : "pb-3 pt-8")
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
        Modulo {indice + 1}
      </p>
      <h3 className="mt-0.5 text-lg font-semibold text-foreground">{titulo}</h3>
      {descripcion && (
        <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
      )}
    </div>
  );
}
