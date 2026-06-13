"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  computePersonalRecords,
  summarizeWorkoutsForGymTips,
} from "@/lib/gym-analytics";
import { computeWorkoutVolumeKg, listWorkouts } from "@/lib/gym";
import { getEatyPublicOrigin } from "@/lib/env-public";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Workout } from "@/types/gym";
import { ExternalLink, Loader2, TrendingUp } from "lucide-react";
import { logger } from "@/lib/logger";

export default function ProfilePage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setWorkouts(await listWorkouts(user.uid, 80));
    } catch (e) {
      logger.error("profile", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completed = useMemo(
    () => workouts.filter((w) => w.status === "completed"),
    [workouts]
  );

  const prs = useMemo(() => computePersonalRecords(workouts), [workouts]);

  const lastVol = useMemo(() => {
    const last = completed[0];
    return last ? computeWorkoutVolumeKg(last) : 0;
  }, [completed]);

  const summary = useMemo(
    () => summarizeWorkoutsForGymTips(workouts),
    [workouts]
  );

  const eatyUrl = getEatyPublicOrigin();

  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Perfil</h1>
      <p className="text-sm text-muted-foreground">{user.email}</p>

      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Entrenos completados
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {completed.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Último volumen (kg·reps)
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {lastVol.toLocaleString("es-ES")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4" aria-hidden />
                Resumen para IA
              </div>
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                {summary || "Sin datos aún."}
              </p>
            </CardContent>
          </Card>

          {prs.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold">PRs estimados</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {prs.slice(0, 8).map((p) => (
                    <li key={p.key} className="flex justify-between gap-2">
                      <span className="truncate">{p.nameSnapshot}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {p.bestWeightKg} kg × {p.repsAtBest}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Button asChild className="w-full sm:w-auto">
            <a href={eatyUrl} rel="noopener noreferrer">
              Abrir Eaty
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Origen Eaty:{" "}
            <Link href="/integracion" className="underline">
              configuración
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
