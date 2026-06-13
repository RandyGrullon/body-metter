import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App | undefined;
/** Rellena al parsear el JSON; sirve de diagnóstico sin leer `options` de App. */
let lastServiceAccountProjectId: string | null = null;

/** Mensaje estable para detectar en API y mostrar ayuda (incl. Vercel). */
export const FIREBASE_ADMIN_MISSING_CREDENTIALS_MSG =
  "Falta credencial de servicio de Firebase Admin. " +
  "En Firebase: Project settings → Service accounts → Generate new private key. " +
  "Local (.env): FIREBASE_SERVICE_ACCOUNT_JSON con el JSON en una línea, o FIREBASE_SERVICE_ACCOUNT_JSON_BASE64. " +
  "Vercel: Project → Settings → Environment Variables; recomendado BASE64 del JSON completo. " +
  "Debe ser el mismo proyecto que NEXT_PUBLIC_FIREBASE_PROJECT_ID.";

function normalizePrivateKeyInServiceAccount(
  parsed: Record<string, unknown>
): Record<string, unknown> {
  const pk = parsed.private_key;
  if (typeof pk !== "string") return parsed;
  return {
    ...parsed,
    private_key: pk.replace(/\\n/g, "\n"),
  };
}

function parseServiceAccountObject(raw: string, label: string): {
  parsed: Record<string, unknown>;
  projectId: string;
} {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(
      `${label}: no es un JSON válido. En Vercel suele funcionar mejor FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 (archivo .json codificado en Base64).`
    );
  }
  const projectIdFromJson =
    typeof parsed.project_id === "string" && parsed.project_id
      ? parsed.project_id
      : undefined;
  if (!projectIdFromJson) {
    throw new Error(
      `${label}: el JSON no contiene project_id. Vuelve a descargar la clave en Firebase (Service account).`
    );
  }
  return {
    parsed: normalizePrivateKeyInServiceAccount(parsed),
    projectId: projectIdFromJson,
  };
}

function tryCredentialFromEnvVars(): {
  parsed: Record<string, unknown>;
  projectId: string;
} | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    return parseServiceAccountObject(rawJson, "FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (b64) {
    let decoded: string;
    try {
      decoded = Buffer.from(b64, "base64").toString("utf8");
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64: no se pudo decodificar Base64."
      );
    }
    const trimmed = decoded.trim();
    if (!trimmed) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64: el contenido decodificado está vacío."
      );
    }
    return parseServiceAccountObject(
      trimmed,
      "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64"
    );
  }

  return null;
}

/**
 * Inicializa Firebase Admin (solo servidor). Prioridad:
 * 1. `FIREBASE_SERVICE_ACCOUNT_JSON` (texto JSON, una línea en local/Vercel)
 * 2. `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` (mismo JSON en Base64; recomendado en Vercel)
 * 3. `GOOGLE_APPLICATION_CREDENTIALS` (ruta a un .json; típico en local)
 */
export function getAdminApp(): App {
  if (app) return app;

  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  const fromEnv = tryCredentialFromEnvVars();
  if (fromEnv) {
    const { parsed, projectId } = fromEnv;
    lastServiceAccountProjectId = projectId;
    app = initializeApp({
      credential: cert(parsed as Parameters<typeof cert>[0]),
      projectId,
    });
    return app;
  }

  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (gac) {
    try {
      const pathToKey = isAbsolute(gac) ? gac : resolve(process.cwd(), gac);
      const parsedRaw = JSON.parse(
        readFileSync(pathToKey, "utf8")
      ) as Record<string, unknown>;
      const parsed = normalizePrivateKeyInServiceAccount(parsedRaw);
      const projectIdFromFile =
        typeof parsed.project_id === "string" && parsed.project_id
          ? parsed.project_id
          : undefined;
      if (!projectIdFromFile) {
        throw new Error(
          "El archivo de GOOGLE_APPLICATION_CREDENTIALS no contiene project_id."
        );
      }
      lastServiceAccountProjectId = projectIdFromFile;
      app = initializeApp({
        credential: cert(parsed as Parameters<typeof cert>[0]),
        projectId: projectIdFromFile,
      });
      return app;
    } catch (e) {
      if (e instanceof Error && e.message.includes("project_id")) {
        throw e;
      }
      throw new Error(
        `No se pudo leer la clave en GOOGLE_APPLICATION_CREDENTIALS (ruta: ${gac}): ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  }

  throw new Error(FIREBASE_ADMIN_MISSING_CREDENTIALS_MSG);
}

/**
 * Mismo `projectId` con el que se emite/verifica el admin (o null si aún no se inicializó).
 */
export function getAdminAppProjectIdForDiagnostics(): string | null {
  if (lastServiceAccountProjectId) {
    return lastServiceAccountProjectId;
  }
  try {
    const a = getAdminApp();
    const id = a?.options?.projectId;
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

export function isFirebaseServiceAccountJsonConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
