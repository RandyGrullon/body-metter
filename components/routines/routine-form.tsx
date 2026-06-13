"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GymExercisePickerDialog } from "@/components/gym/gym-exercise-picker-dialog";
import { getCatalogExerciseById } from "@/lib/exercise-catalog";
import { saveRoutine } from "@/lib/gym";
import type { CustomExercise, Routine, RoutineTemplateExercise } from "@/types/gym";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

type RoutineFormProps = {
  userId: string;
  customExercises: CustomExercise[];
  initial?: Routine | null;
};

export function RoutineForm({
  userId,
  customExercises,
  initial,
}: RoutineFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [exercises, setExercises] = useState<RoutineTemplateExercise[]>(
    () =>
      initial?.exercises?.length ?
        initial.exercises.map((e) => ({ ...e }))
      : []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const onPickCatalog = useCallback((exerciseRefId: string) => {
    const cat = getCatalogExerciseById(exerciseRefId);
    if (!cat) return;
    setExercises((prev) => [
      ...prev,
      {
        exerciseRefId,
        customExerciseId: null,
        nameSnapshot: cat.nameEs,
        targetSets: 3,
        targetRepsHint: "8-12",
      },
    ]);
  }, []);

  const onPickCustom = useCallback(
    (customExerciseId: string) => {
      const c = customExercises.find((x) => x.id === customExerciseId);
      if (!c) return;
      setExercises((prev) => [
        ...prev,
        {
          exerciseRefId: null,
          customExerciseId,
          nameSnapshot: c.name,
          targetSets: 3,
          targetRepsHint: "8-12",
        },
      ]);
    },
    [customExercises]
  );

  const save = async () => {
    if (!title.trim() || exercises.length === 0) return;
    setSaving(true);
    try {
      await saveRoutine(userId, {
        id: initial?.id,
        title: title.trim(),
        exercises,
      });
      router.push("/workouts");
      router.refresh();
    } catch (e) {
      logger.error("save routine", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <Label htmlFor="rtitle">Nombre de la rutina</Label>
        <Input
          id="rtitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Tren superior A"
          className="mt-1"
        />
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Ejercicios</p>
            <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Añadir
            </Button>
          </div>
          {exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Añade ejercicios del catálogo o personalizados.
            </p>
          ) : (
            <ul className="space-y-3">
              {exercises.map((ex, idx) => (
                <li
                  key={`${ex.nameSnapshot}-${idx}`}
                  className="rounded-xl border border-border/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{ex.nameSnapshot}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        setExercises((p) => p.filter((_, i) => i !== idx))
                      }
                      aria-label="Quitar ejercicio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Series</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={ex.targetSets}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          setExercises((p) =>
                            p.map((row, i) =>
                              i === idx ?
                                {
                                  ...row,
                                  targetSets: Number.isFinite(n) ?
                                    Math.min(12, Math.max(1, n))
                                  : row.targetSets,
                                }
                              : row
                            )
                          );
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reps (pista)</Label>
                      <Input
                        value={ex.targetRepsHint ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExercises((p) =>
                            p.map((row, i) =>
                              i === idx ?
                                { ...row, targetRepsHint: v || null }
                              : row
                            )
                          );
                        }}
                        placeholder="8-12"
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/workouts")}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void save()}
          disabled={saving || !title.trim() || exercises.length === 0}
        >
          {saving ? "Guardando…" : "Guardar rutina"}
        </Button>
      </div>

      <GymExercisePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        customExercises={customExercises}
        onPickCatalog={onPickCatalog}
        onPickCustom={onPickCustom}
      />
    </div>
  );
}
