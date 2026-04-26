import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Award } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { CertificadoCard } from "@/components/certificados/CertificadoCard";

export const metadata = { title: "Mis certificados" };

async function obtenerCertificadosUsuario(userId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("certificados", `certificados-${userId}`);
  return prisma.certificado.findMany({
    where: { userId },
    include: { curso: { select: { titulo: true, slug: true, instructorNombre: true } } },
    orderBy: { fechaEmision: "desc" },
  });
}

export default async function CertificadosPage() {
  const user = await requireAuth();

  const certificados = await obtenerCertificadosUsuario(user.id);

  const horasTotales = certificados.reduce(
    (acc, c) => acc + c.horasEquivalentes,
    0
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis certificados</h1>
        <p className="text-sm text-muted-foreground">
          {certificados.length > 0
            ? `${certificados.length} certificado${certificados.length > 1 ? "s" : ""} · ${horasTotales} horas de formacion`
            : "Aqui apareceran tus certificados al completar cursos"}
        </p>
      </div>

      {certificados.length === 0 ? (
        <EmptyState
          icono={Award}
          titulo="Tu primer certificado esta cerca"
          descripcion="Completa un curso para obtener tu certificado oficial."
          accion={{ label: "Ver catalogo", href: "/cursos" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificados.map((cert) => (
            <CertificadoCard
              key={cert.id}
              id={cert.id}
              cursoTitulo={cert.curso.titulo}
              fechaEmision={cert.fechaEmision}
              codigoVerificacion={cert.codigoVerificacion}
              horasEquivalentes={cert.horasEquivalentes}
              tienePdf={!!cert.urlPdf}
            />
          ))}
        </div>
      )}
    </div>
  );
}
