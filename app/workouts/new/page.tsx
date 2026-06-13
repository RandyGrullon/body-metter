"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { listCustomExercises } from "@/lib/gym";
import { RoutineForm } from "@/components/routines/routine-form";
import type { CustomExercise } from "@/types/gym";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

export default function NewRoutinePage() {
  const { user } = useAuth();
  const [custom, setCustom] = useState<CustomExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setCustom(await listCustomExercises(user.uid));
    } catch (e) {
      logger.error("custom exercises", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex flex-1 justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nueva rutina</h1>
      <RoutineForm userId={user.uid} customExercises={custom} />
    </div>
  );
}
