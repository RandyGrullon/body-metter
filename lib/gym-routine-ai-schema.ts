import { z } from "zod";

/** Respuesta esperada del modelo para generar una rutina (solo catálogo). */
export const gymRoutineExerciseAiSchema = z.object({
  exerciseRefId: z.string().min(1).max(80),
  nameSnapshot: z.string().min(2).max(120),
  targetSets: z.number().int().min(1).max(8),
  targetRepsHint: z.string().max(32).nullable().optional(),
});

export const gymRoutineAiResponseSchema = z.object({
  title: z.string().min(3).max(100),
  exercises: z.array(gymRoutineExerciseAiSchema).min(3).max(14),
});

export type GymRoutineAiResponse = z.infer<typeof gymRoutineAiResponseSchema>;
