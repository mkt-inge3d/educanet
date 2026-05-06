import { LoginForm } from "./login-form";

export const metadata = { title: "Iniciar sesion" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido de vuelta
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
