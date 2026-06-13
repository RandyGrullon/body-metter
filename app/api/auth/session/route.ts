import { NextResponse } from "next/server";
import {
  FIREBASE_ADMIN_MISSING_CREDENTIALS_MSG,
  getAdminAuth,
} from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { EATY_SERVER_SESSION_COOKIE } from "@/lib/server-auth-session-constants";

export const runtime = "nodejs";

const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;
const COOKIE_MAX_AGE_SEC = 5 * 24 * 60 * 60;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function sessionCookieDomain(): string | undefined {
  const d = process.env.SERVER_SESSION_COOKIE_DOMAIN?.trim();
  return d && d.length > 0 ? d : undefined;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("idToken" in body) ||
    typeof (body as { idToken: unknown }).idToken !== "string"
  ) {
    return NextResponse.json({ error: "Falta idToken." }, { status: 400 });
  }
  const idToken = (body as { idToken: string }).idToken.trim();
  if (!idToken) {
    return NextResponse.json(
      { error: "idToken de sesión vacío." },
      { status: 400 }
    );
  }

  try {
    const auth = getAdminAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });
    const res = NextResponse.json({ ok: true });
    const domain = sessionCookieDomain();
    res.cookies.set(EATY_SERVER_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SEC,
      ...(domain ? { domain } : {}),
    });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (
      e instanceof Error &&
      (message === FIREBASE_ADMIN_MISSING_CREDENTIALS_MSG ||
        message.includes("FIREBASE_SERVICE_ACCOUNT_JSON") ||
        message.includes("FIREBASE_SERVICE_ACCOUNT_JSON_BASE64") ||
        message.includes("Falta credencial de servicio") ||
        message.includes("cuenta de servicio") ||
        message.includes("project_id"))
    ) {
      logger.error("createSessionCookie (Admin no configurado)", message);
      const body =
        message === FIREBASE_ADMIN_MISSING_CREDENTIALS_MSG ?
          { error: FIREBASE_ADMIN_MISSING_CREDENTIALS_MSG }
        : message.startsWith("FIREBASE_SERVICE_ACCOUNT_JSON") ||
            message.startsWith("FIREBASE_SERVICE_ACCOUNT_JSON_BASE64") ?
          { error: message }
        : { error: FIREBASE_ADMIN_MISSING_CREDENTIALS_MSG };
      return NextResponse.json(body, { status: 503 });
    }
    logger.error("createSessionCookie", message);
    return NextResponse.json(
      { error: "No se pudo crear la sesión. Vuelve a iniciar sesión." },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  const domain = sessionCookieDomain();
  res.cookies.set(EATY_SERVER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    ...(domain ? { domain } : {}),
  });
  return res;
}
