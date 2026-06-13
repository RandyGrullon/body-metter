/**
 * Reparto de discos por lado para una barra olímpica (20 kg) en kg.
 * Lista de placas disponibles por lado (orden descendente típico).
 */
const DEFAULT_PLATES_KG_SIDE = [20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25] as const;

const BAR_KG = 20;

export type PlateBreakdown = {
  /** Peso total deseado en la barra (incluye barra) */
  targetTotalKg: number;
  /** Peso a cargar con discos (total - barra) */
  loadPerSideKg: number;
  /** Discos por lado: peso -> cantidad */
  platesPerSide: { weightKg: number; count: number }[];
  /** Residuo no alcanzable con el inventario */
  remainderKgPerSide: number;
};

export function calculatePlatesPerSide(params: {
  targetTotalKg: number;
  /** Placas disponibles por lado (mismas en ambos lados); por defecto olímpico */
  inventoryPerSide?: readonly number[];
}): PlateBreakdown {
  const inv = params.inventoryPerSide ?? DEFAULT_PLATES_KG_SIDE;
  const sorted = [...inv].sort((a, b) => b - a);
  const loadTotal = Math.max(0, params.targetTotalKg - BAR_KG);
  const perSide = loadTotal / 2;
  let remaining = perSide;
  const plates: { weightKg: number; count: number }[] = [];

  for (const w of sorted) {
    if (w <= 0) continue;
    const n = Math.floor(remaining / w);
    if (n > 0) {
      plates.push({ weightKg: w, count: n });
      remaining = Math.round((remaining - n * w) * 1000) / 1000;
    }
  }

  return {
    targetTotalKg: params.targetTotalKg,
    loadPerSideKg: perSide,
    platesPerSide: plates,
    remainderKgPerSide: remaining,
  };
}
