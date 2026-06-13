import type { Workout, WorkoutExerciseInstance, WorkoutSet } from "@/types/gym";

export type ExerciseVolumeRow = {
  exerciseRefId: string | null;
  customExerciseId: string | null;
  nameSnapshot: string;
  volumeKg: number;
  setsCompleted: number;
};

export function volumeByExercise(workout: Workout): ExerciseVolumeRow[] {
  return workout.exercises.map((ex) => {
    let vol = 0;
    let n = 0;
    for (const s of ex.sets) {
      if (!s.completed || s.reps == null) continue;
      n += 1;
      if (s.bodyweight) {
        vol += (s.addedWeightKg ?? 0) * s.reps;
      } else if (s.weightKg != null) {
        vol += s.weightKg * s.reps;
      }
    }
    return {
      exerciseRefId: ex.exerciseRefId,
      customExerciseId: ex.customExerciseId,
      nameSnapshot: ex.nameSnapshot,
      volumeKg: Math.round(vol),
      setsCompleted: n,
    };
  });
}

export type PersonalRecordRow = {
  key: string;
  nameSnapshot: string;
  bestWeightKg: number;
  repsAtBest: number;
  /** Peso estimado 1RM (Epley) */
  estimatedOneRm: number;
};

function epley1Rm(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

function isWorkingSet(s: WorkoutSet): boolean {
  return s.completed && (s.setType === "working" || s.setType === "failure");
}

/** Mejor carga por movimiento (catálogo o custom) entre entrenos completados */
export function computePersonalRecords(
  workouts: Workout[]
): PersonalRecordRow[] {
  const map = new Map<
    string,
    { name: string; best: number; reps: number }
  >();

  for (const w of workouts) {
    if (w.status !== "completed") continue;
    for (const ex of w.exercises) {
      const key =
        ex.exerciseRefId != null
          ? `c:${ex.exerciseRefId}`
          : ex.customExerciseId != null
            ? `u:${ex.customExerciseId}`
            : `n:${ex.nameSnapshot}`;
      for (const s of ex.sets) {
        if (!isWorkingSet(s) || s.weightKg == null || s.reps == null) continue;
        const cur = map.get(key) ?? { name: ex.nameSnapshot, best: 0, reps: 0 };
        if (s.weightKg > cur.best || (s.weightKg === cur.best && s.reps > cur.reps)) {
          cur.best = s.weightKg;
          cur.reps = s.reps;
          cur.name = ex.nameSnapshot;
        }
        map.set(key, cur);
      }
    }
  }

  return [...map.entries()].map(([key, v]) => ({
    key,
    nameSnapshot: v.name,
    bestWeightKg: v.best,
    repsAtBest: v.reps,
    estimatedOneRm: Math.round(epley1Rm(v.best, v.reps)),
  }));
}

export function summarizeWorkoutsForGymTips(workouts: Workout[], max = 5): string {
  const lines: string[] = [];
  const slice = workouts
    .filter((w) => w.status === "completed")
    .slice(0, max);
  for (const w of slice) {
    const vol = w.exercises.reduce((acc, ex) => {
      let v = 0;
      for (const s of ex.sets) {
        if (!s.completed || s.reps == null) continue;
        const wkg = s.bodyweight ? (s.addedWeightKg ?? 0) : (s.weightKg ?? 0);
        v += wkg * s.reps;
      }
      return acc + v;
    }, 0);
    const names = w.exercises.map((e) => e.nameSnapshot).join(", ");
    lines.push(
      `- ${w.startedAt.toISOString().slice(0, 10)}: ${names || "(sin ejercicios)"} — volumen aprox ${Math.round(vol)} kg·reps`
    );
  }
  return lines.join("\n") || "Sin entrenos completados aún.";
}
