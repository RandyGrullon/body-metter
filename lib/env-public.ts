/**
 * Orígenes públicos para enlaces entre Eaty y Body Matter (subdominios en prod).
 * En local: http://localhost:3000 y http://localhost:3001 por defecto.
 */
export function getEatyPublicOrigin(): string {
  const v = process.env.NEXT_PUBLIC_EATY_ORIGIN?.trim();
  if (v) return v.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getBodyMatterPublicOrigin(): string {
  const v = process.env.NEXT_PUBLIC_BODYMATTER_ORIGIN?.trim();
  if (v) return v.replace(/\/$/, "");
  return "http://localhost:3001";
}
