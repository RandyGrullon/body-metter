import { FieldValue } from "firebase-admin/firestore";
import {
  getAdminAppProjectIdForDiagnostics,
  getAdminAuth,
  getAdminFirestore,
  isFirebaseServiceAccountJsonConfigured,
} from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { getCookieValueFromRequest } from "@/lib/parse-cookie-header";
import { EATY_SERVER_SESSION_COOKIE } from "@/lib/server-auth-session-constants";

export class HttpApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpApiError";
    this.status = status;
  }
}

function getBearerIdToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  const t = h.slice(7).trim();
  return t.length > 0 ? t : null;
}

function getSessionCookieRaw(req: Request): string | null {
  return getCookieValueFromRequest(req, EATY_SERVER_SESSION_COOKIE);
}

function logAuthFailure(label: string, e: unknown): void {
  const code =
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
      ? (e as { code: string }).code
      : null;
  const message = e instanceof Error ? e.message : String(e);
  logger.error(label, code ? `${code}: ${message}` : message);
}

export async function requireUidFromRequest(req: Request): Promise<string> {
  const bearer = getBearerIdToken(req);
  const sessionCookie = getSessionCookieRaw(req);
  const auth = getAdminAuth();

  if (bearer) {
    try {
      return await auth.verifyIdToken(bearer, true).then((d) => d.uid);
    } catch (e) {
      if (!sessionCookie) {
        logAuthFailure("verifyIdToken", e);
      }
    }
  }

  if (sessionCookie) {
    try {
      return await auth
        .verifySessionCookie(sessionCookie, true)
        .then((d) => d.uid);
    } catch (e) {
      logAuthFailure("verifySessionCookie", e);
    }
  } else if (!bearer) {
    if (process.env.NODE_ENV === "development") {
      logger.error(
        "requireUidFromRequest",
        "Sin credenciales: Authorization Bearer, cookie eaty_session o inicia sesión."
      );
    }
  }

  const base = "Sesión inválida o expirada. Vuelve a iniciar sesión.";
  if (process.env.NODE_ENV === "development") {
    const adminP = getAdminAppProjectIdForDiagnostics();
    const fromEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    const hasServiceJson = isFirebaseServiceAccountJsonConfigured();
    const hint = !hasServiceJson
      ? " (dev) Falta FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 en .env."
      : fromEnv && adminP && fromEnv !== adminP
        ? ` (dev) project_id servicio=${adminP} ≠ NEXT_PUBLIC=${fromEnv}.`
        : ` (dev) Admin project_id=${adminP ?? "?"}.`;
    throw new HttpApiError(401, `${base}${hint}`);
  }

  throw new HttpApiError(401, base);
}

function usageDayKeyUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailyGymTipsLimit(): number {
  const n = parseInt(process.env.DAILY_GYM_TIPS_LIMIT ?? "30", 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

function dailyGymRoutineLimit(): number {
  const n = parseInt(process.env.DAILY_GYM_ROUTINE_AI_LIMIT ?? "15", 10);
  return Number.isFinite(n) && n > 0 ? n : 15;
}

export async function enforceDailyQuota(
  uid: string,
  kind: "gym_tips" | "gym_routine"
): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.doc(`users/${uid}/usage/${usageDayKeyUtc()}`);
  const gymTipsLimit = dailyGymTipsLimit();
  const gymRoutineLimit = dailyGymRoutineLimit();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data() ?? {};
    const analyzeCount =
      typeof d.analyzeCount === "number" ? d.analyzeCount : 0;
    const tipsCount = typeof d.tipsCount === "number" ? d.tipsCount : 0;
    const gymTipsCount =
      typeof d.gymTipsCount === "number" ? d.gymTipsCount : 0;
    const gymRoutineCount =
      typeof d.gymRoutineCount === "number" ? d.gymRoutineCount : 0;

    if (kind === "gym_tips") {
      if (gymTipsCount >= gymTipsLimit) {
        throw new HttpApiError(
          429,
          `Límite diario de consejos gym por IA (${gymTipsLimit}) alcanzado.`
        );
      }
      tx.set(
        ref,
        {
          analyzeCount,
          tipsCount,
          gymTipsCount: gymTipsCount + 1,
          gymRoutineCount,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      if (gymRoutineCount >= gymRoutineLimit) {
        throw new HttpApiError(
          429,
          `Límite diario de rutinas generadas por IA (${gymRoutineLimit}) alcanzado.`
        );
      }
      tx.set(
        ref,
        {
          analyzeCount,
          tipsCount,
          gymTipsCount,
          gymRoutineCount: gymRoutineCount + 1,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  });
}
