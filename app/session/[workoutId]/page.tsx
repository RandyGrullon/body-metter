"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getWorkout, listCustomExercises } from "@/lib/gym";
import { SessionWorkoutShell } from "@/components/gym/session-workout-shell";
import type { CustomExercise, Workout } from "@/types/gym";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

export default function SessionPage() {
  const params = useParams();
  const workoutId = typeof params.workoutId === "string" ? params.workoutId : "";
  const { user } = useAuth();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [custom, setCustom] = useState<CustomExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !workoutId) return;
    setLoading(true);
    try {
      const [w, c] = await Promise.all([
        getWorkout(user.uid, workoutId),
        listCustomExercises(user.uid),
      ]);
      setWorkout(w);
      setCustom(c);
    } catch (e) {
      logger.error("session load", e);
    } finally {
      setLoading(false);
    }
  }, [user, workoutId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!user) {
    return null;
  }

  if (loading || !workout) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SessionWorkoutShell
      userId={user.uid}
      initial={workout}
      customExercises={custom}
      onClose={() => {
        router.push("/history");
      }}
    />
  );
}
