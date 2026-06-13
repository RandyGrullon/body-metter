"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Trophy,
  Dumbbell,
  Sparkles,
  Play,
  History,
  CalendarDays,
  TrendingUp,
  Loader2,
  Target,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { listWorkouts } from "@/lib/gym";
import {
  computeAchievements,
  computeStreak,
  computeTotalXp,
  computeWeeklyStats,
  levelFromXp,
  trainedToday,
  type Achievement,
} from "@/lib/gamification";
import type { Workout } from "@/types/gym";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

export function GameDashboard() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) return;
    setLoading(true);
    listWorkouts(user.uid, 200)
      .then((w) => active && setWorkouts(w))
      .catch((e) => logger.error("dashboard", e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  const data = useMemo(() => {
    const xp = computeTotalXp(workouts);
    return {
      streak: computeStreak(workouts),
      level: levelFromXp(xp),
      achievements: computeAchievements(workouts),
      weekly: computeWeeklyStats(workouts),
      today: trainedToday(workouts),
    };
  }, [workouts]);

  if (loading) return <DashboardSkeleton />;

  const { streak, level, achievements, weekly, today } = data;
  const unlocked = achievements.filter((a) => a.unlocked);
  const nextLocked = achievements.find((a) => !a.unlocked);

  return (
    <div className="space-y-5">
      <HeroLevel
        level={level.level}
        xp={level.xp}
        progress={level.progress}
        xpIntoLevel={level.xpIntoLevel}
        xpForNextLevel={level.xpForNextLevel}
        streak={streak.current}
        trainedToday={today}
      />

      {/* CTA principal estilo juego */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/session/new" className="group animate-rise">
          <Card className="game-card transition-transform group-hover:-translate-y-0.5 group-hover:game-glow">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
                <Play className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-base font-semibold">
                  Empezar entreno
                </p>
                <p className="text-xs text-muted-foreground">
                  Sesión libre o desde rutina
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/workouts/ai" className="group animate-rise">
          <Card className="transition-transform group-hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-base font-semibold">
                  Rutina con IA
                </p>
                <p className="text-xs text-muted-foreground">
                  Genera un plan en segundos
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats de la semana */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<Dumbbell className="h-4 w-4" />}
          label="Entrenos"
          value={`${weekly.workoutsThisWeek}/${weekly.weeklyGoal}`}
          accent
        />
        <StatTile
          icon={<TrendingUp className="h-4 w-4" />}
          label="Volumen"
          value={`${Math.round(weekly.volumeThisWeek / 1000)}k`}
          suffix="kg"
        />
        <StatTile
          icon={<Target className="h-4 w-4" />}
          label="Series"
          value={`${weekly.setsThisWeek}`}
        />
      </div>

      {/* Meta semanal */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Meta semanal</span>
            <span className="text-muted-foreground">
              {weekly.workoutsThisWeek} / {weekly.weeklyGoal} entrenos
            </span>
          </div>
          <Progress
            value={Math.min(
              100,
              (weekly.workoutsThisWeek / weekly.weeklyGoal) * 100
            )}
          />
        </CardContent>
      </Card>

      {/* Logros */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Trophy className="h-5 w-5 text-primary" /> Logros
          </h2>
          <span className="text-xs text-muted-foreground">
            {unlocked.length} / {achievements.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {achievements.map((a) => (
            <AchievementBadge key={a.id} a={a} />
          ))}
        </div>
        {nextLocked ? (
          <p className="text-center text-xs text-muted-foreground">
            Próximo: <span className="font-medium">{nextLocked.title}</span> —{" "}
            {nextLocked.current.toLocaleString("es-ES")}/
            {nextLocked.goal.toLocaleString("es-ES")}
          </p>
        ) : null}
      </section>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/workouts" icon={<Dumbbell />} label="Rutinas" />
        <QuickLink href="/history" icon={<History />} label="Historial" />
        <QuickLink href="/calendar" icon={<CalendarDays />} label="Calendario" />
        <QuickLink href="/exercises" icon={<Target />} label="Ejercicios" />
      </div>
    </div>
  );
}

function HeroLevel({
  level,
  progress,
  xpIntoLevel,
  xpForNextLevel,
  streak,
  trainedToday,
}: {
  level: number;
  xp: number;
  progress: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  streak: number;
  trainedToday: boolean;
}) {
  return (
    <Card className="game-card animate-pop">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-4">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/15">
            <span className="font-display text-2xl font-bold text-gradient">
              {level}
            </span>
            <span className="absolute -bottom-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
              Nivel
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">¡A entrenar!</p>
            <div className="mt-1 flex items-center gap-2">
              <Flame
                className={cn(
                  "h-5 w-5",
                  trainedToday ? "text-orange-500" : "text-muted-foreground"
                )}
              />
              <span className="font-display text-lg font-semibold">
                {streak}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {streak === 1 ? "día de racha" : "días de racha"}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>XP nivel {level}</span>
            <span>
              {xpIntoLevel} / {xpForNextLevel} XP
            </span>
          </div>
          <Progress value={progress * 100} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn(accent && "game-card")}>
      <CardContent className="p-3 text-center">
        <span className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <p className="font-display text-xl font-bold leading-none">
          {value}
          {suffix ? (
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">
              {suffix}
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function AchievementBadge({ a }: { a: Achievement }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition",
        a.unlocked
          ? "game-card"
          : "border-border/60 bg-muted/40 opacity-60 grayscale"
      )}
      title={`${a.title}: ${a.description}`}
    >
      <span className="text-2xl" aria-hidden>
        {a.icon}
      </span>
      <span className="line-clamp-1 text-[10px] font-medium">{a.title}</span>
      {!a.unlocked ? (
        <span className="text-[9px] text-muted-foreground">
          {Math.round(a.progress * 100)}%
        </span>
      ) : null}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-transform hover:-translate-y-0.5">
        <CardContent className="flex flex-col items-center gap-1.5 p-3 text-center">
          <span className="text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
          <span className="text-xs font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    </div>
  );
}
