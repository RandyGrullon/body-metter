import {
  differenceInCalendarDays,
  isSameDay,
  startOfWeek,
  endOfDay,
  isWithinInterval,
} from "date-fns";
import type { Workout } from "@/types/gym";
import { computeWorkoutVolumeKg } from "@/lib/gym";

/**
 * Capa de gamificación: deriva racha, XP/nivel y logros a partir de los
 * entrenos reales del usuario. Todo se calcula en cliente sobre los
 * `Workout` ya cargados — no inventa datos.
 */

function completed(workouts: Workout[]): Workout[] {
  return workouts
    .filter((w) => w.status === "completed")
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

/** Días consecutivos (hasta hoy o ayer) con al menos un entreno completado. */
export function computeStreak(workouts: Workout[]): {
  current: number;
  best: number;
} {
  const days = [
    ...new Set(
      completed(workouts).map((w) => startOfDay(w.startedAt).getTime())
    ),
  ].sort((a, b) => b - a);

  if (days.length === 0) return { current: 0, best: 0 };

  // Racha actual
  let current = 0;
  const today = startOfDay(new Date()).getTime();
  const offsetFromToday = differenceInCalendarDays(today, days[0]);
  if (offsetFromToday <= 1) {
    current = 1;
    for (let i = 1; i < days.length; i++) {
      if (differenceInCalendarDays(days[i - 1], days[i]) === 1) current += 1;
      else break;
    }
  }

  // Mejor racha histórica
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (differenceInCalendarDays(days[i - 1], days[i]) === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  return { current, best: Math.max(best, current) };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const XP_PER_WORKOUT = 100;
const XP_PER_1000_VOLUME = 10;

/** XP total: base por entreno + bono por volumen movido. */
export function computeTotalXp(workouts: Workout[]): number {
  let xp = 0;
  for (const w of completed(workouts)) {
    xp += XP_PER_WORKOUT;
    xp += Math.round((computeWorkoutVolumeKg(w) / 1000) * XP_PER_1000_VOLUME);
  }
  return xp;
}

export type LevelInfo = {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number; // 0..1
};

/** Curva de nivel cuadrática suave: nivel n requiere 100 * n^2 XP acumulada. */
export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xp >= 100 * (level + 1) * (level + 1)) level += 1;
  const floor = 100 * level * level;
  const ceil = 100 * (level + 1) * (level + 1);
  const xpIntoLevel = xp - floor;
  const xpForNextLevel = ceil - floor;
  return {
    level,
    xp,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0,
  };
}

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji para look "videojuego"
  unlocked: boolean;
  progress: number; // 0..1
  goal: number;
  current: number;
};

export function computeAchievements(workouts: Workout[]): Achievement[] {
  const done = completed(workouts);
  const totalWorkouts = done.length;
  const totalVolume = done.reduce((a, w) => a + computeWorkoutVolumeKg(w), 0);
  const totalSets = done.reduce(
    (a, w) =>
      a +
      w.exercises.reduce(
        (b, ex) => b + ex.sets.filter((s) => s.completed).length,
        0
      ),
    0
  );
  const { best } = computeStreak(workouts);

  const mk = (
    id: string,
    title: string,
    description: string,
    icon: string,
    current: number,
    goal: number
  ): Achievement => ({
    id,
    title,
    description,
    icon,
    current,
    goal,
    progress: Math.min(1, goal > 0 ? current / goal : 0),
    unlocked: current >= goal,
  });

  return [
    mk("first", "Primer paso", "Completa tu primer entreno", "🎯", totalWorkouts, 1),
    mk("ten", "En racha", "Completa 10 entrenos", "🔥", totalWorkouts, 10),
    mk("fifty", "Veterano", "Completa 50 entrenos", "🏅", totalWorkouts, 50),
    mk("century", "Centurión", "Completa 100 entrenos", "👑", totalWorkouts, 100),
    mk("streak7", "Semana de hierro", "7 días seguidos entrenando", "⚡", best, 7),
    mk("streak30", "Imparable", "30 días seguidos entrenando", "💎", best, 30),
    mk("vol10k", "Levantador", "Mueve 10.000 kg en total", "🏋️", Math.round(totalVolume), 10000),
    mk("vol100k", "Titán", "Mueve 100.000 kg en total", "🦾", Math.round(totalVolume), 100000),
    mk("sets500", "Volumen alto", "Completa 500 series", "📈", totalSets, 500),
  ];
}

export type WeeklyStats = {
  workoutsThisWeek: number;
  volumeThisWeek: number;
  setsThisWeek: number;
  weeklyGoal: number;
};

export function computeWeeklyStats(
  workouts: Workout[],
  weeklyGoal = 4
): WeeklyStats {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfDay(now);
  const week = completed(workouts).filter((w) =>
    isWithinInterval(w.startedAt, { start, end })
  );
  return {
    workoutsThisWeek: week.length,
    volumeThisWeek: week.reduce((a, w) => a + computeWorkoutVolumeKg(w), 0),
    setsThisWeek: week.reduce(
      (a, w) =>
        a +
        w.exercises.reduce(
          (b, ex) => b + ex.sets.filter((s) => s.completed).length,
          0
        ),
      0
    ),
    weeklyGoal,
  };
}

/** ¿Entrenó hoy? Para resaltar el estado de la racha. */
export function trainedToday(workouts: Workout[]): boolean {
  const now = new Date();
  return completed(workouts).some((w) => isSameDay(w.startedAt, now));
}
