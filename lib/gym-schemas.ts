import { z } from "zod";

export const personalizedGymTipSchema = z.object({
  focusTitle: z.string().min(8).max(120),
  whatToChange: z.string().min(12).max(280),
  whereApply: z.string().min(12).max(200),
  whyItHelps: z.string().min(12).max(220).optional(),
  techniqueCue: z.string().min(12).max(200).optional(),
  videoSearchQuery: z.string().min(4).max(100),
  miniSteps: z.array(z.string().min(12).max(160)).min(2).max(3),
  safetyNote: z.string().min(12).max(200).optional(),
});

export type PersonalizedGymTip = z.infer<typeof personalizedGymTipSchema>;

export const gymTipsResponseSchema = z.object({
  tips: z.array(personalizedGymTipSchema).min(3).max(5),
});

export type GymTipsResponse = z.infer<typeof gymTipsResponseSchema>;

export function parseGymTipsFromApi(data: unknown): PersonalizedGymTip[] {
  const parsed = gymTipsResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Payload de consejos gym inválido");
  }
  return parsed.data.tips;
}

const STATIC_GYM_TIPS: PersonalizedGymTip[] = [
  {
    focusTitle: "Rango de movimiento completo",
    whatToChange:
      "Prioriza recorrido controlado sobre cargar más peso con medio recorrido",
    whereApply: "En ejercicios multiarticulares (sentadilla, press, remo)",
    whyItHelps: "Más estímulo muscular con menos riesgo articular.",
    techniqueCue: "Pausa 1 s en el punto más débil del recorrido.",
    videoSearchQuery: "rango completo sentadilla técnica",
    miniSteps: [
      "Baja 2 segundos, sube 1 segundo sin rebotar arriba.",
      "Filma una serie lateral para revisar profundidad la próxima vez.",
    ],
    safetyNote:
      "Si sientes pinchazo u hormigueo, detén la serie y consulta a un profesional.",
  },
  {
    focusTitle: "Progresión semanal",
    whatToChange: "Sube 2,5–5% carga o 1–2 reps solo cuando todas las series salgan limpias",
    whereApply: "En el último ejercicio de cada grupo muscular del día",
    whyItHelps: "Evita estancar y reduce fatiga acumulada.",
    videoSearchQuery: "doble progresión gimnasio",
    miniSteps: [
      "Anota RPE 1–10 al terminar cada serie para comparar semanas.",
      "Si fallas antes del objetivo, mantén peso y mejora técnica.",
    ],
  },
  {
    focusTitle: "Descanso entre series",
    whatToChange: "Usa temporizador fijo: 2–3 min en básicos, 60–90 s en aislamientos",
    whereApply: "Entre series del mismo ejercicio",
    whyItHelps: "Recuperas ATP y mantienes calidad de reps.",
    videoSearchQuery: "temporizador descanso entre series gimnasio",
    miniSteps: [
      "Empieza el temporizador al terminar la última rep válida.",
      "Camina suave o respira nasal en lugar de mirar el móvil.",
    ],
  },
];

export function staticFallbackGymTips(): PersonalizedGymTip[] {
  return STATIC_GYM_TIPS.map((t) => ({ ...t }));
}
