const DRAFT_KEY = "bodymatter_gym_workout_draft_v1";

export type GymWorkoutDraftPayload = {
  workoutId: string;
  updatedAt: string;
  payload: unknown;
};

export function saveWorkoutDraftLocal(draft: GymWorkoutDraftPayload): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

export function loadWorkoutDraftLocal(): GymWorkoutDraftPayload | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GymWorkoutDraftPayload;
  } catch {
    return null;
  }
}

export function clearWorkoutDraftLocal(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
