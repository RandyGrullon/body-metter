import { describe, expect, it } from "vitest";
import {
  gymTipsResponseSchema,
  parseGymTipsFromApi,
  staticFallbackGymTips,
} from "@/lib/gym-schemas";

const validPayload = {
  tips: [
    {
      focusTitle: "Técnica de press banca",
      whatToChange:
        "Mantén los codos a 45° y pies firmes para transferir fuerza",
      whereApply: "En la primera serie de trabajo del press plano",
      whyItHelps: "Mayor estabilidad y menos tensión en hombros.",
      techniqueCue: "Aprieta la barra como si la quisieras doblar.",
      videoSearchQuery: "press banca técnica codos",
      miniSteps: [
        "Retracción escapular antes de despegar la barra del rack.",
        "Desciende tocando el pecho sin rebotar y sube en línea recta.",
      ],
      safetyNote: "No diagnostico lesiones; ante dolor agudo, detén y consulta.",
    },
    {
      focusTitle: "Progresión de cargas",
      whatToChange: "Añade 2,5 kg solo si completas todas las reps con buena forma",
      whereApply: "En remo con barra al final del tirón",
      miniSteps: [
        "Registra peso y sensación RPE al terminar cada bloque.",
        "Si RPE supera 9, mantén carga la semana siguiente.",
      ],
      videoSearchQuery: "progresión lineal gimnasio",
    },
    {
      focusTitle: "Descanso guiado",
      whatToChange: "Temporizador 2:30 entre series pesadas de pierna",
      whereApply: "Sentadilla y prensa el mismo día",
      miniSteps: [
        "Inicia el temporizador al rack la barra.",
        "Camina suave o respira en caja 4-4-4-4 entre series.",
      ],
      videoSearchQuery: "descanso entre series pierna",
    },
  ],
};

describe("gymTipsResponseSchema", () => {
  it("acepta payload válido", () => {
    const r = gymTipsResponseSchema.safeParse(validPayload);
    expect(r.success).toBe(true);
  });

  it("rechaza menos de 3 tips", () => {
    const r = gymTipsResponseSchema.safeParse({
      tips: validPayload.tips.slice(0, 2),
    });
    expect(r.success).toBe(false);
  });
});

describe("parseGymTipsFromApi", () => {
  it("parsea y devuelve tips", () => {
    const tips = parseGymTipsFromApi(validPayload);
    expect(tips).toHaveLength(3);
    expect(tips[0]?.focusTitle).toContain("press");
  });

  it("lanza si el payload es inválido", () => {
    expect(() => parseGymTipsFromApi({ tips: [] })).toThrow();
  });
});

describe("staticFallbackGymTips", () => {
  it("devuelve al menos 3 consejos", () => {
    const tips = staticFallbackGymTips();
    expect(tips.length).toBeGreaterThanOrEqual(3);
  });
});
