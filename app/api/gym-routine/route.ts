import { NextResponse } from "next/server";
import { z } from "zod";
import { runGymRoutineGroq } from "@/lib/groq-gym";
import {
  HttpApiError,
  enforceDailyQuota,
  requireUidFromRequest,
} from "@/lib/api-auth-usage";
import { logger } from "@/lib/logger";
import { getCatalogExerciseById } from "@/lib/exercise-catalog";
export const runtime = "nodejs";

const bodySchema = z.object({
  goal: z.string().min(3).max(500),
  daysPerWeek: z.number().int().min(1).max(7),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  equipment: z.string().min(1).max(400),
  sessionMinutes: z.number().int().min(15).max(180),
  injuriesNote: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);

    const json: unknown = await req.json();
    const body = bodySchema.parse(json);

    await enforceDailyQuota(uid, "gym_routine");

    const raw = await runGymRoutineGroq({
      goal: body.goal,
      daysPerWeek: body.daysPerWeek,
      level: body.level,
      equipment: body.equipment,
      sessionMinutes: body.sessionMinutes,
      injuriesNote: body.injuriesNote ?? null,
    });

    const exercises = raw.exercises
      .map((ex) => {
        const cat = getCatalogExerciseById(ex.exerciseRefId);
        if (!cat) return null;
        return {
          exerciseRefId: ex.exerciseRefId,
          customExerciseId: null as string | null,
          nameSnapshot: cat.nameEs,
          targetSets: ex.targetSets,
          targetRepsHint: ex.targetRepsHint ?? null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    if (exercises.length < 3) {
      throw new HttpApiError(
        422,
        "La IA devolvió ejercicios no reconocidos. Vuelve a generar o revisa el catálogo."
      );
    }

    return NextResponse.json({
      routine: {
        title: raw.title,
        exercises,
      },
    });
  } catch (e) {
    if (e instanceof HttpApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const message =
      e instanceof z.ZodError ?
        e.issues.map((x) => x.message).join("; ")
      : e instanceof Error ?
        e.message
      : "Error al generar rutina.";
    const status = e instanceof z.ZodError ? 400 : 500;
    if (!(e instanceof z.ZodError)) {
      logger.error("gym-routine", e);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
