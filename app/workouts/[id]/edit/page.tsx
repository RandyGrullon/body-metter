"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { listCustomExercises, listRoutines } from "@/lib/gym";
import { RoutineForm } from "@/components/routines/routine-form";
import type { CustomExercise, Routine } from "@/types/gym";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

export default function EditRoutinePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [custom, setCustom] = useState<CustomExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      const [routines, c] = await Promise.all([
        listRoutines(user.uid),
        listCustomExercises(user.uid),
      ]);
      setRoutine(routines.find((x) => x.id === id) ?? null);
      setCustom(c);
    } catch (e) {
      logger.error("edit routine load", e);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

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

  if (!routine) {
    return <p className="text-sm text-muted-foreground">Rutina no encontrada.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Editar rutina</h1>
      <RoutineForm userId={user.uid} customExercises={custom} initial={routine} />
    </div>
  );
}
