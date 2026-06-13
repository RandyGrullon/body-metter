"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  endOfDay,
  endOfMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import {
  computeWorkoutVolumeKg,
  duplicateWorkoutAsNew,
  getWorkout,
  listWorkouts,
} from "@/lib/gym";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { Workout } from "@/types/gym";
import { Loader2, Copy, Play } from "lucide-react";
import { logger } from "@/lib/logger";

type Period = "day" | "week" | "month" | "pick";

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("week");
  const [pickDate, setPickDate] = useState<Date | undefined>(new Date());

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setWorkouts(await listWorkouts(user.uid, 120));
    } catch (e) {
      logger.error("history", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const now = new Date();
    if (period === "day") {
      const start = startOfDay(now);
      const end = endOfDay(now);
      return workouts.filter(
        (w) =>
          isWithinInterval(w.startedAt, { start, end }) && w.status === "completed"
      );
    }
    if (period === "week") {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfDay(now);
      return workouts.filter(
        (w) =>
          isWithinInterval(w.startedAt, { start, end }) && w.status === "completed"
      );
    }
    if (period === "month") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return workouts.filter(
        (w) =>
          isWithinInterval(w.startedAt, { start, end }) && w.status === "completed"
      );
    }
    if (period === "pick" && pickDate) {
      const start = startOfDay(pickDate);
      const end = endOfDay(pickDate);
      return workouts.filter(
        (w) =>
          isWithinInterval(w.startedAt, { start, end }) && w.status === "completed"
      );
    }
    return workouts.filter((w) => w.status === "completed");
  }, [workouts, period, pickDate]);

  const openWorkout = async (id: string) => {
    if (!user) return;
    const w = await getWorkout(user.uid, id);
    if (w?.status === "in_progress") {
      router.push(`/session/${id}`);
    }
  };

  const dup = async (source: Workout) => {
    if (!user) return;
    try {
      const id = await duplicateWorkoutAsNew(user.uid, source);
      router.push(`/session/${id}`);
    } catch (e) {
      logger.error("dup workout", e);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Historial</h1>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["day", "Hoy"],
            ["week", "Semana"],
            ["month", "Mes"],
            ["pick", "Fecha"],
          ] as const
        ).map(([k, label]) => (
          <Button
            key={k}
            type="button"
            size="sm"
            variant={period === k ? "default" : "outline"}
            onClick={() => setPeriod(k)}
          >
            {label}
          </Button>
        ))}
      </div>
      {period === "pick" ? (
        <Card>
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={pickDate}
              onSelect={setPickDate}
              locale={es}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay entrenos completados en este periodo.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 p-3"
                >
                  <div>
                    <p className="font-medium">{w.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.startedAt.toLocaleString("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}{" "}
                      · vol. {computeWorkoutVolumeKg(w).toLocaleString("es-ES")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {w.status === "in_progress" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void openWorkout(w.id)}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        Continuar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void dup(w)}
                      >
                        <Copy className="mr-1 h-4 w-4" />
                        Repetir
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/calendar" className="underline">
          Ver calendario
        </Link>
      </p>
    </div>
  );
}
