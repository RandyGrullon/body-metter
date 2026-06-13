/**
 * Punto único para logs (sustituible por Sentry/Datadog sin tocar cada call site).
 */
const isDev = process.env.NODE_ENV === "development";

export const logger = {
  error(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.error(`[bodymatter] ${message}`, meta);
      return;
    }
    console.error(`[bodymatter] ${message}`);
  },
  warn(message: string, meta?: unknown): void {
    if (!isDev) return;
    if (meta !== undefined) {
      console.warn(`[bodymatter] ${message}`, meta);
      return;
    }
    console.warn(`[bodymatter] ${message}`);
  },
  info(message: string, meta?: unknown): void {
    if (!isDev) return;
    if (meta !== undefined) {
      console.info(`[bodymatter] ${message}`, meta);
      return;
    }
    console.info(`[bodymatter] ${message}`);
  },
};
