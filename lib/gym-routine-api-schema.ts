import { z } from "zod";

/** Payload de `POST /api/gym-routine` (respuesta). */
export const gymRoutineApiResponseSchema = z.object({
  routine: z.object({
    title: z.string().min(1).max(120),
    exercises: z.array(
      z.object({
        exerciseRefId: z.string().min(1),
        customExerciseId: z.string().nullable().optional(),
        nameSnapshot: z.string().min(1),
        targetSets: z.number().int().min(1).max(12),
        targetRepsHint: z.string().max(40).nullable().optional(),
      })
    ),
  }),
});

export type GymRoutineFromApi = z.infer<
  typeof gymRoutineApiResponseSchema
>["routine"];
