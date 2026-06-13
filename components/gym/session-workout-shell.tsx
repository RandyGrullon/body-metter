"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { GymWorkoutEditor } from "@/components/gym/gym-workout-editor";
import type { CustomExercise, Workout } from "@/types/gym";

function formatElapsed(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type SessionWorkoutShellProps = {
  userId: string;
  initial: Workout;
  customExercises: CustomExercise[];
  onClose: () => void;
};

export function SessionWorkoutShell({
  userId,
  initial,
  customExercises,
  onClose,
}: SessionWorkoutShellProps) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setElapsedSec((x) => x + 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-center gap-2 border-b border-teal-500/30 bg-teal-500/10 py-2 text-teal-700 dark:text-teal-300">
        <Timer className="h-4 w-4" aria-hidden />
        <span className="text-sm font-bold tabular-nums">
          Sesión: {formatElapsed(elapsedSec)}
        </span>
      </div>
      <GymWorkoutEditor
        userId={userId}
        initial={initial}
        customExercises={customExercises}
        onClose={onClose}
      />
    </div>
  );
}
