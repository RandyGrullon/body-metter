import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { appFirebase } from "./firebase";
import { logger } from "@/lib/logger";
import type {
  BodyMeasurement,
  CardioSegment,
  CustomExercise,
  Routine,
  RoutineTemplateExercise,
  Workout,
  WorkoutExerciseInstance,
  WorkoutSet,
  WorkoutStatus,
} from "@/types/gym";

const getDb = () => appFirebase.db;

function tsToDate(t: Timestamp | Date | undefined | null): Date {
  if (!t) return new Date();
  return t instanceof Timestamp ? t.toDate() : t;
}

function normalizeSet(raw: Record<string, unknown>): WorkoutSet {
  return {
    setIndex: Number(raw.setIndex ?? 0),
    setType: (raw.setType as WorkoutSet["setType"]) ?? "working",
    weightKg:
      raw.weightKg === null || raw.weightKg === undefined
        ? null
        : Number(raw.weightKg),
    reps:
      raw.reps === null || raw.reps === undefined ? null : Number(raw.reps),
    completed: Boolean(raw.completed),
    restSecondsTarget:
      raw.restSecondsTarget === undefined || raw.restSecondsTarget === null
        ? null
        : Number(raw.restSecondsTarget),
    rpe:
      raw.rpe === undefined || raw.rpe === null ? null : Number(raw.rpe),
    timeUnderTensionSec:
      raw.timeUnderTensionSec === undefined || raw.timeUnderTensionSec === null
        ? null
        : Number(raw.timeUnderTensionSec),
    durationSec:
      raw.durationSec === undefined || raw.durationSec === null
        ? null
        : Number(raw.durationSec),
    distanceM:
      raw.distanceM === undefined || raw.distanceM === null
        ? null
        : Number(raw.distanceM),
    caloriesEstimate:
      raw.caloriesEstimate === undefined || raw.caloriesEstimate === null
        ? null
        : Number(raw.caloriesEstimate),
    inclinePercent:
      raw.inclinePercent === undefined || raw.inclinePercent === null
        ? null
        : Number(raw.inclinePercent),
    isIncremental: raw.isIncremental === true,
    progressionNote:
      typeof raw.progressionNote === "string" ? raw.progressionNote : null,
    bodyweight: raw.bodyweight === true,
    addedWeightKg:
      raw.addedWeightKg === undefined || raw.addedWeightKg === null
        ? null
        : Number(raw.addedWeightKg),
  };
}

function normalizeExercise(
  raw: Record<string, unknown>
): WorkoutExerciseInstance {
  const setsRaw = Array.isArray(raw.sets) ? raw.sets : [];
  return {
    id: String(raw.id ?? ""),
    order: Number(raw.order ?? 0),
    nameSnapshot: String(raw.nameSnapshot ?? ""),
    exerciseRefId:
      raw.exerciseRefId === null || raw.exerciseRefId === undefined
        ? null
        : String(raw.exerciseRefId),
    customExerciseId:
      raw.customExerciseId === null || raw.customExerciseId === undefined
        ? null
        : String(raw.customExerciseId),
    notes: typeof raw.notes === "string" ? raw.notes : null,
    supersetGroupId:
      typeof raw.supersetGroupId === "string" ? raw.supersetGroupId : null,
    equipmentUsed:
      typeof raw.equipmentUsed === "string" ? raw.equipmentUsed : null,
    sets: setsRaw.map((s) => normalizeSet(s as Record<string, unknown>)),
  };
}

function normalizeCardio(raw: Record<string, unknown>): CardioSegment {
  return {
    id: String(raw.id ?? ""),
    label: String(raw.label ?? ""),
    machine: typeof raw.machine === "string" ? raw.machine : null,
    durationSec: Number(raw.durationSec ?? 0),
    distanceM:
      raw.distanceM === undefined || raw.distanceM === null
        ? null
        : Number(raw.distanceM),
    caloriesEstimate:
      raw.caloriesEstimate === undefined || raw.caloriesEstimate === null
        ? null
        : Number(raw.caloriesEstimate),
    inclinePercent:
      raw.inclinePercent === undefined || raw.inclinePercent === null
        ? null
        : Number(raw.inclinePercent),
    notes: typeof raw.notes === "string" ? raw.notes : null,
  };
}

export function workoutFromFirestore(
  id: string,
  data: Record<string, unknown>
): Workout {
  const ex = Array.isArray(data.exercises) ? data.exercises : [];
  const cardio = Array.isArray(data.cardioSegments) ? data.cardioSegments : [];
  return {
    id,
    title: String(data.title ?? "Entreno"),
    status: (data.status as WorkoutStatus) ?? "completed",
    blockType:
      (data.blockType as Workout["blockType"]) === "cardio" ||
      (data.blockType as Workout["blockType"]) === "mixed"
        ? (data.blockType as Workout["blockType"])
        : "strength",
    startedAt: tsToDate(data.startedAt as Timestamp),
    endedAt: data.endedAt ? tsToDate(data.endedAt as Timestamp) : null,
    notes: typeof data.notes === "string" ? data.notes : null,
    exercises: ex.map((e) =>
      normalizeExercise(e as Record<string, unknown>)
    ),
    cardioSegments: cardio.map((c) =>
      normalizeCardio(c as Record<string, unknown>)
    ),
    createdAt: tsToDate(data.createdAt as Timestamp),
    updatedAt: tsToDate(data.updatedAt as Timestamp),
  };
}

function workoutToFirestore(w: Workout): Record<string, unknown> {
  return {
    title: w.title,
    status: w.status,
    blockType: w.blockType,
    startedAt: Timestamp.fromDate(w.startedAt),
    endedAt: w.endedAt ? Timestamp.fromDate(w.endedAt) : null,
    notes: w.notes,
    exercises: w.exercises,
    cardioSegments: w.cardioSegments,
    updatedAt: Timestamp.now(),
  };
}

export async function listWorkouts(
  userId: string,
  max = 40
): Promise<Workout[]> {
  const ref = collection(getDb(), "users", userId, "workouts");
  const q = query(ref, orderBy("startedAt", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    workoutFromFirestore(d.id, d.data() as Record<string, unknown>)
  );
}

export async function getWorkout(
  userId: string,
  workoutId: string
): Promise<Workout | null> {
  const dref = doc(getDb(), "users", userId, "workouts", workoutId);
  const snap = await getDoc(dref);
  if (!snap.exists()) return null;
  return workoutFromFirestore(snap.id, snap.data() as Record<string, unknown>);
}

export async function getInProgressWorkout(
  userId: string
): Promise<Workout | null> {
  const ref = collection(getDb(), "users", userId, "workouts");
  const q = query(ref, where("status", "==", "in_progress"), limit(10));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const sorted = snap.docs
    .map((d) => workoutFromFirestore(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  return sorted[0] ?? null;
}

/** Firestore requiere índice compuesto status + startedAt para esta consulta */
export async function createWorkout(
  userId: string,
  title = "Entreno"
): Promise<string> {
  const ref = collection(getDb(), "users", userId, "workouts");
  const now = Timestamp.now();
  const docRef = await addDoc(ref, {
    title,
    status: "in_progress",
    blockType: "strength",
    startedAt: now,
    endedAt: null,
    notes: null,
    exercises: [],
    cardioSegments: [],
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function saveWorkout(
  userId: string,
  workout: Workout
): Promise<void> {
  const dref = doc(getDb(), "users", userId, "workouts", workout.id);
  const data = workoutToFirestore(workout);
  await updateDoc(dref, data);
}

export async function setWorkoutCompleted(
  userId: string,
  workoutId: string,
  exercises: WorkoutExerciseInstance[],
  cardioSegments: CardioSegment[],
  notes: string | null
): Promise<void> {
  const dref = doc(getDb(), "users", userId, "workouts", workoutId);
  await updateDoc(dref, {
    status: "completed",
    endedAt: Timestamp.now(),
    exercises,
    cardioSegments,
    notes: notes ?? null,
    updatedAt: Timestamp.now(),
  });
}

export async function abandonWorkout(
  userId: string,
  workoutId: string
): Promise<void> {
  const dref = doc(getDb(), "users", userId, "workouts", workoutId);
  await updateDoc(dref, {
    status: "abandoned",
    endedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/** Última sesión completada con ese ejercicio de catálogo (autofill) */
export async function getLastCompletedSetsForCatalogExercise(
  userId: string,
  exerciseRefId: string
): Promise<WorkoutSet[] | null> {
  const workouts = await listWorkouts(userId, 30);
  for (const w of workouts) {
    if (w.status !== "completed") continue;
    const inst = w.exercises.find((e) => e.exerciseRefId === exerciseRefId);
    if (inst && inst.sets.length > 0) {
      return inst.sets.map((s) => ({ ...s }));
    }
  }
  return null;
}

export async function listCustomExercises(
  userId: string
): Promise<CustomExercise[]> {
  const ref = collection(getDb(), "users", userId, "customExercises");
  const q = query(ref, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const x = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      name: String(x.name ?? ""),
      muscleTags: Array.isArray(x.muscleTags)
        ? (x.muscleTags as string[])
        : [],
      equipment: typeof x.equipment === "string" ? x.equipment : null,
      imageUrl: typeof x.imageUrl === "string" ? x.imageUrl : null,
      instructions:
        typeof x.instructions === "string" ? x.instructions : null,
      createdAt: tsToDate(x.createdAt as Timestamp),
      updatedAt: tsToDate(x.updatedAt as Timestamp),
    };
  });
}

export async function createCustomExercise(
  userId: string,
  data: Omit<CustomExercise, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = collection(getDb(), "users", userId, "customExercises");
  const now = Timestamp.now();
  const docRef = await addDoc(ref, {
    name: data.name,
    muscleTags: data.muscleTags,
    equipment: data.equipment,
    imageUrl: data.imageUrl,
    instructions: data.instructions,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateCustomExerciseImageUrl(
  userId: string,
  exerciseId: string,
  imageUrl: string
): Promise<void> {
  await updateDoc(
    doc(getDb(), "users", userId, "customExercises", exerciseId),
    { imageUrl, updatedAt: Timestamp.now() }
  );
}

export async function listRoutines(userId: string): Promise<Routine[]> {
  const ref = collection(getDb(), "users", userId, "routines");
  const q = query(ref, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const x = d.data() as Record<string, unknown>;
    const ex = Array.isArray(x.exercises) ? x.exercises : [];
    return {
      id: d.id,
      title: String(x.title ?? "Rutina"),
      exercises: ex.map((e) => {
        const r = e as Record<string, unknown>;
        return {
          exerciseRefId:
            r.exerciseRefId === null || r.exerciseRefId === undefined
              ? null
              : String(r.exerciseRefId),
          customExerciseId:
            r.customExerciseId === null || r.customExerciseId === undefined
              ? null
              : String(r.customExerciseId),
          nameSnapshot: String(r.nameSnapshot ?? ""),
          targetSets: Number(r.targetSets ?? 3),
          targetRepsHint:
            typeof r.targetRepsHint === "string" ? r.targetRepsHint : null,
        } satisfies RoutineTemplateExercise;
      }),
      createdAt: tsToDate(x.createdAt as Timestamp),
      updatedAt: tsToDate(x.updatedAt as Timestamp),
    };
  });
}

export async function deleteRoutine(
  userId: string,
  routineId: string
): Promise<void> {
  await deleteDoc(doc(getDb(), "users", userId, "routines", routineId));
}

export async function saveRoutine(
  userId: string,
  routine: Omit<Routine, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<string> {
  const now = Timestamp.now();
  if (routine.id) {
    const dref = doc(getDb(), "users", userId, "routines", routine.id);
    await setDoc(
      dref,
      {
        title: routine.title,
        exercises: routine.exercises,
        updatedAt: now,
      },
      { merge: true }
    );
    return routine.id;
  }
  const ref = collection(getDb(), "users", userId, "routines");
  const docRef = await addDoc(ref, {
    title: routine.title,
    exercises: routine.exercises,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function addBodyMeasurement(
  userId: string,
  data: Omit<BodyMeasurement, "id" | "measuredAt"> & { measuredAt?: Date }
): Promise<string> {
  const ref = collection(getDb(), "users", userId, "bodyMeasurements");
  const measuredAt = data.measuredAt ?? new Date();
  const docRef = await addDoc(ref, {
    weightKg: data.weightKg,
    waistCm: data.waistCm,
    neckCm: data.neckCm,
    notes: data.notes,
    measuredAt: Timestamp.fromDate(measuredAt),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function listBodyMeasurements(
  userId: string,
  max = 60
): Promise<BodyMeasurement[]> {
  const ref = collection(getDb(), "users", userId, "bodyMeasurements");
  const q = query(ref, orderBy("measuredAt", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const x = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      measuredAt: tsToDate(x.measuredAt as Timestamp),
      weightKg:
        x.weightKg === undefined || x.weightKg === null
          ? null
          : Number(x.weightKg),
      waistCm:
        x.waistCm === undefined || x.waistCm === null
          ? null
          : Number(x.waistCm),
      neckCm:
        x.neckCm === undefined || x.neckCm === null ? null : Number(x.neckCm),
      notes: typeof x.notes === "string" ? x.notes : null,
    };
  });
}

export function computeWorkoutVolumeKg(workout: Workout): number {
  let vol = 0;
  for (const ex of workout.exercises) {
    for (const s of ex.sets) {
      if (!s.completed || s.reps == null) continue;
      if (s.bodyweight) {
        const add = s.addedWeightKg ?? 0;
        vol += add * s.reps;
      } else if (s.weightKg != null) {
        vol += s.weightKg * s.reps;
      }
    }
  }
  return Math.round(vol);
}

export function exportWorkoutsToJsonString(workouts: Workout[]): string {
  return JSON.stringify(
    workouts.map((w) => ({ ...w, startedAt: w.startedAt.toISOString() })),
    null,
    2
  );
}

export async function startWorkoutFromRoutine(
  userId: string,
  routine: Routine
): Promise<string> {
  const wid = await createWorkout(userId, routine.title);
  const dref = doc(getDb(), "users", userId, "workouts", wid);
  const exercises: WorkoutExerciseInstance[] = routine.exercises.map(
    (tpl, i) => {
      const n = Math.max(1, tpl.targetSets);
      const sets: WorkoutSet[] = [];
      for (let j = 1; j <= n; j += 1) {
        sets.push({
          setIndex: j,
          setType: j === 1 ? "warmup" : "working",
          weightKg: null,
          reps: null,
          completed: false,
          restSecondsTarget: j === 1 ? 60 : 120,
        });
      }
      return {
        id: crypto.randomUUID(),
        order: i,
        nameSnapshot: tpl.nameSnapshot,
        exerciseRefId: tpl.exerciseRefId,
        customExerciseId: tpl.customExerciseId,
        notes: null,
        supersetGroupId: null,
        equipmentUsed: null,
        sets,
      };
    }
  );
  await updateDoc(dref, {
    exercises,
    blockType: "strength",
    updatedAt: Timestamp.now(),
  });
  return wid;
}

export async function createRoutineFromWorkout(
  userId: string,
  workout: Workout,
  title: string
): Promise<string> {
  const exercises: RoutineTemplateExercise[] = workout.exercises.map((e) => ({
    exerciseRefId: e.exerciseRefId,
    customExerciseId: e.customExerciseId,
    nameSnapshot: e.nameSnapshot,
    targetSets: Math.max(1, e.sets.length),
    targetRepsHint:
      e.sets.find((s) => s.reps != null)?.reps != null
        ? String(e.sets.find((s) => s.reps != null)!.reps)
        : "8-12",
  }));
  return saveRoutine(userId, { title, exercises });
}

export async function duplicateWorkoutAsNew(
  userId: string,
  source: Workout
): Promise<string> {
  const newId = await createWorkout(
    userId,
    `${source.title} (copia)`
  );
  const dref = doc(getDb(), "users", userId, "workouts", newId);
  const exercises = source.exercises.map((e, i) => ({
    ...e,
    id: crypto.randomUUID(),
    order: i,
    sets: e.sets.map((s, j) => ({
      ...s,
      setIndex: j + 1,
      completed: false,
    })),
  }));
  await updateDoc(dref, {
    exercises,
    cardioSegments: source.cardioSegments.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
    })),
    blockType: source.blockType,
    status: "in_progress",
    startedAt: Timestamp.now(),
    endedAt: null,
    updatedAt: Timestamp.now(),
  });
  return newId;
}
