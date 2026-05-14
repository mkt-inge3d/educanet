"use client";

import { useTransition } from "react";
import { Check, Building2 } from "lucide-react";
import { cambiarOrgActivaAction } from "@/lib/organizations/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type OrgOption = { id: string; nombre: string; slug: string };

/**
 * Selector de organización activa.
 * Se oculta automáticamente si el usuario solo pertenece a una org.
 */
export function OrgSwitcher({
  orgs,
  currentOrgId,
}: {
  orgs: OrgOption[];
  currentOrgId: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (orgs.length <= 1) return null;

  const handleSelect = (orgId: string) => {
    if (orgId === currentOrgId || isPending) return;
    startTransition(async () => {
      const res = await cambiarOrgActivaAction(orgId);
      if (res.success) {
        toast.success("Organización cambiada");
      } else {
        toast.error(res.error ?? "No se pudo cambiar");
      }
    });
  };

  return (
    <div className="px-2 py-1.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 px-1 pb-1">
        Organización
      </p>
      <div className="space-y-0.5">
        {orgs.map((org) => {
          const active = org.id === currentOrgId;
          return (
            <button
              key={org.id}
              onClick={() => handleSelect(org.id)}
              disabled={isPending}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground",
                isPending && "opacity-50",
              )}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 truncate">{org.nombre}</span>
              {active && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
