import { createClient } from "@supabase/supabase-js";

const BUCKET = "kpi-evidencias";
export const TIPOS_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
];
export const TAMANO_MAX_BYTES = 5 * 1024 * 1024; // 5MB

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function extensionDeTipo(tipo: string): string {
  if (tipo === "application/pdf") return "pdf";
  if (tipo === "image/jpeg" || tipo === "image/jpg") return "jpg";
  if (tipo === "image/png") return "png";
  if (tipo === "image/webp") return "webp";
  throw new Error(`Tipo no soportado: ${tipo}`);
}

export async function subirEvidenciaKpi(params: {
  userId: string;
  instanciaId: string;
  buffer: Buffer;
  tipo: string;
}): Promise<{ path: string; tipo: string }> {
  if (!TIPOS_PERMITIDOS.includes(params.tipo)) {
    throw new Error(`Tipo de archivo no permitido: ${params.tipo}`);
  }
  if (params.buffer.byteLength > TAMANO_MAX_BYTES) {
    throw new Error("El archivo supera los 5MB permitidos");
  }

  const ext = extensionDeTipo(params.tipo);
  const path = `${params.userId}/${params.instanciaId}.${ext}`;

  const supabase = getServiceSupabase();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, params.buffer, {
      contentType: params.tipo,
      upsert: true,
    });

  if (error) {
    throw new Error(`Error subiendo evidencia: ${error.message}`);
  }

  return { path, tipo: params.tipo };
}

export async function obtenerUrlFirmadaEvidencia(
  path: string,
  expiresInSeconds = 300
): Promise<string> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Error generando URL firmada: ${error?.message}`);
  }

  return data.signedUrl;
}

export async function eliminarEvidencia(path: string): Promise<void> {
  const supabase = getServiceSupabase();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Error eliminando evidencia: ${error.message}`);
}
