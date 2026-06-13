import { NextResponse } from "next/server";
import { z } from "zod";
import { runGymTipsGroq } from "@/lib/groq-gym";
import {
  HttpApiError,
  enforceDailyQuota,
  requireUidFromRequest,
} from "@/lib/api-auth-usage";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const bodySchema = z.object({
  recentWorkoutsSummary: z.string().max(8000).optional(),
  fitnessGoal: z.string().max(80).optional().nullable(),
  injuriesNote: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);

    const json: unknown = await req.json();
    const body = bodySchema.parse(json);

    await enforceDailyQuota(uid, "gym_tips");

    const tips = await runGymTipsGroq({
      recentWorkoutsSummary: body.recentWorkoutsSummary?.trim() || "",
      fitnessGoal: body.fitnessGoal ?? null,
      injuriesNote: body.injuriesNote ?? null,
    });

    return NextResponse.json({ tips });
  } catch (e) {
    if (e instanceof HttpApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const message =
      e instanceof z.ZodError ?
        e.issues.map((x) => x.message).join("; ")
      : e instanceof Error ?
        e.message
      : "Error al generar consejos gym.";
    const status = e instanceof z.ZodError ? 400 : 500;
    if (!(e instanceof z.ZodError)) {
      logger.error("gym-tips", e);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
