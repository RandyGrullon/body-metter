"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { listWorkouts } from "@/lib/gym";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { Workout } from "@/types/gym";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

export default function CalendarPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setWorkouts(await listWorkouts(user.uid, 200));
    } catch (e) {
      logger.error("calendar", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completedDays = useMemo(() => {
    const days = new Set<string>();
    for (const w of workouts) {
      if (w.status !== "completed") continue;
      days.add(w.startedAt.toDateString());
    }
    return days;
  }, [workouts]);

  const modifiers = useMemo(
    () => ({
      trained: (d: Date) => completedDays.has(d.toDateString()),
    }),
    [completedDays]
  );

  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const dayWorkouts = useMemo(() => {
    if (!selected) return [];
    return workouts.filter(
      (w) => w.status === "completed" && isSameDay(w.startedAt, selected)
    );
  }, [workouts, selected]);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Calendario</h1>
      <p className="text-sm text-muted-foreground">
        Días con al menos un entreno completado.
      </p>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4 p-3 sm:flex-row">
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={selected}
              onSelect={setSelected}
              locale={es}
              modifiers={modifiers}
              modifiersClassNames={{
                trained:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
            />
            <div className="min-h-[120px] flex-1 border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <p className="text-sm font-medium">
                {selected?.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              {dayWorkouts.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Sin entrenos completados ese día.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {dayWorkouts.map((w) => (
                    <li key={w.id} className="text-muted-foreground">
                      {w.title}{" "}
                      <span className="text-xs">
                        (
                        {w.startedAt.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        )
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
