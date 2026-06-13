import { parseGymTipsFromApi } from "@/lib/gym-schemas";
import type { PersonalizedGymTip } from "@/lib/gym-schemas";
import { GroqApiError } from "@/lib/groq-api-error";
import {
  gymRoutineApiResponseSchema,
  type GymRoutineFromApi,
} from "@/lib/gym-routine-api-schema";

export async function generateGymTips(options: {
  recentWorkoutsSummary: string;
  fitnessGoal?: string | null;
  injuriesNote?: string | null;
  idToken: string;
}): Promise<PersonalizedGymTip[]> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (options.idToken.trim()) {
    h.Authorization = `Bearer ${options.idToken.trim()}`;
  }

  const res = await fetch("/api/gym-tips", {
    method: "POST",
    credentials: "include",
    headers: h,
    body: JSON.stringify({
      recentWorkoutsSummary: options.recentWorkoutsSummary,
      fitnessGoal: options.fitnessGoal,
      injuriesNote: options.injuriesNote,
    }),
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Error ${res.status}`;
    throw new GroqApiError(errMsg, res.status);
  }

  try {
    return parseGymTipsFromApi(data);
  } catch {
    throw new GroqApiError("Respuesta de consejos gym inválida.", 500);
  }
}

export async function generateGymRoutineAi(options: {
  goal: string;
  daysPerWeek: number;
  level: "beginner" | "intermediate" | "advanced";
  equipment: string;
  sessionMinutes: number;
  injuriesNote?: string | null;
  idToken: string;
}): Promise<GymRoutineFromApi> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (options.idToken.trim()) {
    h.Authorization = `Bearer ${options.idToken.trim()}`;
  }

  const res = await fetch("/api/gym-routine", {
    method: "POST",
    credentials: "include",
    headers: h,
    body: JSON.stringify({
      goal: options.goal,
      daysPerWeek: options.daysPerWeek,
      level: options.level,
      equipment: options.equipment,
      sessionMinutes: options.sessionMinutes,
      injuriesNote: options.injuriesNote,
    }),
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Error ${res.status}`;
    throw new GroqApiError(errMsg, res.status);
  }

  const parsed = gymRoutineApiResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new GroqApiError("Respuesta de rutina IA inválida.", 500);
  }
  return parsed.data.routine;
}
