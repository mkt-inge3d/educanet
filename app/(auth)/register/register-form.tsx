"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { passwordStrength } from "@/lib/auth-schemas";
import { registerAction } from "../actions";

const strengthLabels = ["", "Debil", "Aceptable", "Fuerte", "Excelente"];
const strengthColors = [
  "bg-muted",
  "bg-destructive",
  "bg-warning",
  "bg-success",
  "bg-primary",
];

type AreaConPuestos = {
  id: string;
  nombre: string;
  puestos: { id: string; nombre: string; nivel: number }[];
};

export function RegisterForm({ areas }: { areas: AreaConPuestos[] }) {
  const [state, formAction, isPending] = useActionState(registerAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [areaId, setAreaId] = useState<string>("");
  const [puestoId, setPuestoId] = useState<string>("");
  const strength = passwordStrength(password);

  const puestosDelArea = useMemo(
    () => areas.find((a) => a.id === areaId)?.puestos ?? [],
    [areas, areaId]
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" required autoComplete="given-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input
            id="apellido"
            name="apellido"
            required
            autoComplete="family-name"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2"
      >
        <Label htmlFor="email">Correo electronico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@empresa.com"
          autoComplete="email"
          required
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="space-y-2">
          <Label htmlFor="areaSelect">Area / Equipo</Label>
          <input type="hidden" name="areaId" value={areaId} />
          <Select
            value={areaId}
            onValueChange={(v) => {
              setAreaId(v ?? "");
              setPuestoId("");
            }}
          >
            <SelectTrigger id="areaSelect" className="w-full">
              <SelectValue placeholder="Selecciona tu area" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="puestoSelect">Puesto</Label>
          <input type="hidden" name="puestoId" value={puestoId} />
          <Select
            value={puestoId}
            onValueChange={(v) => setPuestoId(v ?? "")}
            disabled={!areaId}
          >
            <SelectTrigger id="puestoSelect" className="w-full">
              <SelectValue
                placeholder={areaId ? "Selecciona" : "Elige un area"}
              />
            </SelectTrigger>
            <SelectContent>
              {puestosDelArea.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-2"
      >
        <Label htmlFor="password">Contrasena</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Ocultar" : "Mostrar"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    strength >= level ? strengthColors[strength] : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {strengthLabels[strength]}
            </p>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex items-start gap-2"
      >
        <input
          type="checkbox"
          id="acepteTerminos"
          name="acepteTerminos"
          className="mt-1 h-4 w-4 rounded border-border"
          required
        />
        <Label htmlFor="acepteTerminos" className="text-sm font-normal leading-5">
          Acepto los{" "}
          <Link href="/terminos" className="text-primary hover:underline">
            terminos y condiciones
          </Link>
        </Label>
      </motion.div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cuenta
        </Button>
      </motion.div>

      <p className="text-center text-sm text-muted-foreground">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}
