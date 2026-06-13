export const SYSTEM_GYM_TIPS = `Eres entrenador de fuerza y acondicionamiento. El usuario usa Eaty para registrar entrenos.

Responde SOLO JSON (claves en inglés, textos en español):
{"tips":[{"focusTitle":"...","whatToChange":"...","whereApply":"...","whyItHelps":"...","techniqueCue":"...","videoSearchQuery":"...","miniSteps":["...","..."],"safetyNote":"..."}]}

Entre 3 y 5 objetos en tips.
- focusTitle: título corto del foco (técnica, volumen, descanso, deload…).
- whatToChange: acción concreta.
- whereApply: en qué ejercicio o momento del entreno (usa nombres recibidos).
- whyItHelps: beneficio (opcional pero recomendado).
- techniqueCue: una pista técnica breve (opcional).
- videoSearchQuery: 4–10 palabras para buscar vídeo en YouTube/Google.
- miniSteps: 2 o 3 pasos accionables.
- safetyNote: aviso no médico (dolor agudo = parar) opcional.

No diagnostiques lesiones. Sin markdown fuera del JSON.`;

export function buildGymTipsUserPrompt(params: {
  recentWorkoutsSummary: string;
  fitnessGoal?: string | null;
  injuriesNote?: string | null;
}): string {
  const parts = [
    "Resumen reciente de entrenos (texto libre del cliente):",
    params.recentWorkoutsSummary || "(sin datos aún)",
    params.fitnessGoal
      ? `Objetivo declarado en perfil: ${params.fitnessGoal}`
      : "",
    params.injuriesNote
      ? `Notas del usuario (lesiones/molestias autodeclaradas, no verificadas): ${params.injuriesNote}`
      : "",
  ];
  return parts.filter(Boolean).join("\n");
}
