"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "../actions";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
          defaultValue={state.values?.email ?? ""}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contrasena</Label>
          <Link
            href="/reset-password"
            className="text-xs text-primary hover:underline"
          >
            Olvidaste tu contrasena?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Iniciar sesion
        </Button>
      </motion.div>

      <p className="text-center text-sm text-muted-foreground">
        No tienes cuenta?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Registrate
        </Link>
      </p>
    </form>
  );
}
