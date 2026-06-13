"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  deleteRoutine,
  listRoutines,
  listWorkouts,
  startWorkoutFromRoutine,
} from "@/lib/gym";
import { summarizeWorkoutsForGymTips } from "@/lib/gym-analytics";
import { GymTipsPanel } from "@/components/gym/gym-tips-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Routine } from "@/types/gym";
import { Loader2, Pencil, Play, Sparkles, Trash2 } from "lucide-react";
import { logger } from "@/lib/logger";

export default function WorkoutsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await listRoutines(user.uid);
      setRoutines(r);
    } catch (e) {
      logger.error("workouts list", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) {
      setIdToken("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const t = await user.getIdToken();
        if (!cancelled) setIdToken(t);
      } catch {
        if (!cancelled) setIdToken("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const [tipsSummaryState, setTipsSummaryState] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const w = await listWorkouts(user.uid, 25);
        if (!cancelled) setTipsSummaryState(summarizeWorkoutsForGymTips(w));
      } catch {
        if (!cancelled) setTipsSummaryState("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, routines.length]);

  const startRoutine = async (r: Routine) => {
    if (!user) return;
    try {
      const id = await startWorkoutFromRoutine(user.uid, r);
      router.push(`/session/${id}`);
    } catch (e) {
      logger.error("start routine", e);
    }
  };

  const removeRoutine = async (id: string) => {
    if (!user) return;
    if (!window.confirm("¿Eliminar esta rutina?")) return;
    try {
      await deleteRoutine(user.uid, id);
      await refresh();
    } catch (e) {
      logger.error("delete routine", e);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rutinas</h1>
          <p className="text-sm text-muted-foreground">
            Crea plantillas y dale a play para entrenar con temporizador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/workouts/ai">
              <Sparkles className="mr-1 h-4 w-4" />
              Rutina con IA
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/workouts/new">Nueva rutina</Link>
          </Button>
        </div>
      </div>

      {idToken ? (
        <GymTipsPanel
          idToken={idToken}
          recentWorkoutsSummary={tipsSummaryState}
          fitnessGoal={null}
        />
      ) : null}

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : routines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay rutinas. Crea una manual o con IA.
            </p>
          ) : (
            <ul className="space-y-2">
              {routines.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 p-3"
                >
                  <span className="font-medium">{r.title}</span>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void startRoutine(r)}
                    >
                      <Play className="mr-1 h-4 w-4" />
                      Play
                    </Button>
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link href={`/workouts/${r.id}/edit`}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => void removeRoutine(r.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
