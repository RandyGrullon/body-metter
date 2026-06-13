/** Referencia al catálogo global o ejercicio personalizado del usuario */
export type WorkoutExerciseSource =
  | { kind: "catalog"; exerciseRefId: string }
  | { kind: "custom"; customExerciseId: string };

export type WorkoutSetType = "warmup" | "working" | "failure" | "dropset";

export type WorkoutStatus = "in_progress" | "completed" | "abandoned";

export type WorkoutBlockType = "strength" | "cardio" | "mixed";

/** Serie de fuerza o métricas mixtas (cardio en mismo documento vía campos opcionales) */
export interface WorkoutSet {
  setIndex: number;
  setType: WorkoutSetType;
  /** Peso efectivo en kg (canónico en Firestore) */
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
  restSecondsTarget?: number | null;
  rpe?: number | null;
  timeUnderTensionSec?: number | null;
  durationSec?: number | null;
  distanceM?: number | null;
  caloriesEstimate?: number | null;
  inclinePercent?: number | null;
  isIncremental?: boolean;
  progressionNote?: string | null;
  bodyweight?: boolean;
  addedWeightKg?: number | null;
}

export interface WorkoutExerciseInstance {
  id: string;
  order: number;
  nameSnapshot: string;
  exerciseRefId: string | null;
  customExerciseId: string | null;
  notes?: string | null;
  supersetGroupId?: string | null;
  equipmentUsed?: string | null;
  sets: WorkoutSet[];
}

/** Segmento cardio resumido (bloque aparte opcional) */
export interface CardioSegment {
  id: string;
  label: string;
  machine?: string | null;
  durationSec: number;
  distanceM?: number | null;
  caloriesEstimate?: number | null;
  inclinePercent?: number | null;
  notes?: string | null;
}

export interface Workout {
  id: string;
  title: string;
  status: WorkoutStatus;
  blockType: WorkoutBlockType;
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
  exercises: WorkoutExerciseInstance[];
  cardioSegments: CardioSegment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomExercise {
  id: string;
  name: string;
  muscleTags: string[];
  equipment: string | null;
  imageUrl: string | null;
  instructions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineTemplateExercise {
  exerciseRefId: string | null;
  customExerciseId: string | null;
  nameSnapshot: string;
  targetSets: number;
  targetRepsHint: string | null;
}

export interface Routine {
  id: string;
  title: string;
  exercises: RoutineTemplateExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BodyMeasurement {
  id: string;
  measuredAt: Date;
  weightKg: number | null;
  waistCm: number | null;
  neckCm: number | null;
  notes: string | null;
}

export interface CatalogExercise {
  id: string;
  nameEs: string;
  muscleGroups: string[];
  equipment: string;
  imageUrl: string;
  instructions: string;
  /** IDs de ejercicios del mismo catálogo sugeridos como sustituto */
  substituteIds?: string[];
}
