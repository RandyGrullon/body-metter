import {
  buildGymTipsUserPrompt,
  SYSTEM_GYM_TIPS,
} from "@/lib/gym-tips-prompts";
import { logger } from "@/lib/logger";
import {
  gymTipsResponseSchema,
  staticFallbackGymTips,
  type PersonalizedGymTip,
} from "@/lib/gym-schemas";
import { SYSTEM_JSON_REPAIR } from "@/lib/json-repair-system";
import {
  gymRoutineAiResponseSchema,
  type GymRoutineAiResponse,
} from "@/lib/gym-routine-ai-schema";
import { getCatalogExercises } from "@/lib/exercise-catalog";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY no está configurada en el servidor.");
  }
  return key;
}

function getModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqChatResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  error?: { message?: string };
};

async function groqChatCompletion(params: {
  messages: ChatMessage[];
  responseFormatJson?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const body: Record<string, unknown> = {
    model: getModel(),
    messages: params.messages,
    temperature: params.temperature ?? 0.35,
    max_tokens: params.maxTokens ?? 2048,
    top_p: 1,
    stream: false,
  };

  if (params.responseFormatJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGroqApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as GroqChatResponse;

  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    throw new Error(`Groq: ${msg}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Respuesta vacía del modelo.");
  }

  return content.trim();
}

function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error("No se pudo interpretar JSON del modelo.");
  }
}

export async function runGymTipsGroq(params: {
  recentWorkoutsSummary: string;
  fitnessGoal?: string | null;
  injuriesNote?: string | null;
}): Promise<PersonalizedGymTip[]> {
  const userText = buildGymTipsUserPrompt({
    recentWorkoutsSummary: params.recentWorkoutsSummary,
    fitnessGoal: params.fitnessGoal,
    injuriesNote: params.injuriesNote,
  });

  try {
    const content = await groqChatCompletion({
      messages: [
        { role: "system", content: SYSTEM_GYM_TIPS },
        { role: "user", content: userText },
      ],
      responseFormatJson: true,
      temperature: 0.55,
      maxTokens: 1400,
    });

    try {
      const obj = parseJsonObject<unknown>(content);
      const { tips } = gymTipsResponseSchema.parse(obj);
      return tips;
    } catch {
      const repaired = await groqChatCompletion({
        messages: [
          { role: "system", content: SYSTEM_JSON_REPAIR },
          {
            role: "user",
            content: [
              "Devuelve solo JSON válido. Forma:",
              '{"tips":[{"focusTitle":"...","whatToChange":"...","whereApply":"...","videoSearchQuery":"...","miniSteps":["a","b"]}]}',
              "3 a 5 tips. miniSteps 2-3 strings.",
              "Entrada defectuosa:",
              content.slice(0, 4000),
            ].join("\n"),
          },
        ],
        responseFormatJson: true,
        temperature: 0.2,
        maxTokens: 1000,
      });
      const obj = parseJsonObject<unknown>(repaired);
      const { tips } = gymTipsResponseSchema.parse(obj);
      return tips;
    }
  } catch (e) {
    logger.error("Consejos gym Groq (respaldo)", e);
    return staticFallbackGymTips();
  }
}

function buildCatalogPromptBlock(): string {
  const list = getCatalogExercises();
  return list
    .map((e) => `- id: "${e.id}" | nombre: ${e.nameEs} | músculos: ${e.muscleGroups.join(", ")} | equipo: ${e.equipment}`)
    .join("\n");
}

export async function runGymRoutineGroq(params: {
  goal: string;
  daysPerWeek: number;
  level: "beginner" | "intermediate" | "advanced";
  equipment: string;
  sessionMinutes: number;
  injuriesNote?: string | null;
}): Promise<GymRoutineAiResponse> {
  const catalog = buildCatalogPromptBlock();
  const userPrompt = [
    "Genera UNA rutina de fuerza/condición en español.",
    `Objetivo: ${params.goal}`,
    `Días por semana objetivo: ${params.daysPerWeek} (la rutina puede ser de una sesión típica).`,
    `Nivel: ${params.level}`,
    `Material disponible: ${params.equipment}`,
    `Duración orientativa de sesión: ${params.sessionMinutes} minutos.`,
    params.injuriesNote?.trim()
      ? `Lesiones/limitaciones: ${params.injuriesNote.trim()}`
      : "Sin lesiones declaradas.",
    "",
    "Catálogo de ejercicios (DEBES usar solo exerciseRefId de esta lista):",
    catalog,
    "",
    "Devuelve JSON con forma:",
    '{"title":"string","exercises":[{"exerciseRefId":"id_del_catalogo","nameSnapshot":"nombre visible","targetSets":3,"targetRepsHint":"8-12"}]}',
    "Entre 4 y 10 ejercicios. targetRepsHint puede ser null.",
    "nameSnapshot debe coincidir con el nombre del catálogo del id elegido.",
  ].join("\n");

  const systemRoutine = `Eres entrenador personal. Devuelve SOLO JSON válido (json_object) con la rutina.
Los exerciseRefId deben existir exactamente en el catálogo proporcionado por el usuario.`;

  const content = await groqChatCompletion({
    messages: [
      { role: "system", content: systemRoutine },
      { role: "user", content: userPrompt },
    ],
    responseFormatJson: true,
    temperature: 0.45,
    maxTokens: 1800,
  });

  try {
    const obj = parseJsonObject<unknown>(content);
    return gymRoutineAiResponseSchema.parse(obj);
  } catch (parseErr) {
    logger.warn("gym routine parse retry", parseErr);
    const repaired = await groqChatCompletion({
      messages: [
        { role: "system", content: SYSTEM_JSON_REPAIR },
        {
          role: "user",
          content: [
            "Devuelve solo JSON con rutina. Forma:",
            '{"title":"...","exercises":[{"exerciseRefId":"id","nameSnapshot":"...","targetSets":3,"targetRepsHint":"8-12"}]}',
            "exerciseRefId debe ser uno de los ids listados en la entrada del usuario.",
            "Entrada defectuosa:",
            content.slice(0, 8000),
          ].join("\n"),
        },
      ],
      responseFormatJson: true,
      temperature: 0.2,
      maxTokens: 1600,
    });
    const obj = parseJsonObject<unknown>(repaired);
    return gymRoutineAiResponseSchema.parse(obj);
  }
}
