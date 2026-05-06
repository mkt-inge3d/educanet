import type { RolUsuario } from "@prisma/client";

export function puedeGestionarCursos(rol: RolUsuario): boolean {
  return rol === "ADMIN";
}

export function puedeGestionarBadges(rol: RolUsuario): boolean {
  return rol === "ADMIN";
}

export function puedeGestionarRoles(rol: RolUsuario): boolean {
  return rol === "ADMIN";
}

export function puedeGestionarUsuarios(rol: RolUsuario): boolean {
  return rol === "ADMIN" || rol === "RRHH";
}

export function puedeGestionarMetricas(rol: RolUsuario): boolean {
  return rol === "ADMIN" || rol === "RRHH";
}

export function puedeGestionarRutas(rol: RolUsuario): boolean {
  return rol === "ADMIN" || rol === "RRHH";
}

export function puedeVerAnaliticas(rol: RolUsuario): boolean {
  return rol === "ADMIN" || rol === "RRHH";
}

export function puedeGestionarCalendarios(rol: RolUsuario): boolean {
  return rol === "ADMIN";
}

export type SeccionAdmin = {
  label: string;
  href: string;
  icono: string;
  requiere: (rol: RolUsuario) => boolean;
};
