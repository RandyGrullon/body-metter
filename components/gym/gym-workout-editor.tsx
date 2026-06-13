"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  saveWorkout,
  setWorkoutCompleted,
  abandonWorkout,
  getLastCompletedSetsForCatalogExercise,
} from "@/lib/gym";
import { getCatalogExerciseById } from "@/lib/exercise-catalog";
import {
  clearWorkoutDraftLocal,
  saveWorkoutDraftLocal,
} from "@/lib/gym-offline";
import { calculatePlatesPerSide } from "@/lib/plate-calculator";
import { GymExercisePickerDialog } from "@/components/gym/gym-exercise-picker-dialog";
import type {
  CardioSegment,
  CustomExercise,
  Workout,
  WorkoutExerciseInstance,
  WorkoutSet,
  WorkoutSetType,
} from "@/types/gym";
import {
  Dumbbell,
  Plus,
  Trash2,
  Timer,
  Check,
  Layers,
  Download,
} from "lucide-react";
import { logger } from "@/lib/logger";

const SET_TYPES: { value: WorkoutSetType; label: string }[] = [
  { value: "warmup", label: "Calentamiento" },
  { value: "working", label: "Trabajo" },
  { value: "failure", label: "Fallo" },
  { value: "dropset", label: "Dropset" },
];

function defaultSet(i: number, type: WorkoutSetType = "working"): WorkoutSet {
  return {
    setIndex: i,
    setType: type,
    weightKg: null,
    reps: null,
    completed: false,
    restSecondsTarget: type === "warmup" ? 60 : 120,
  };
}

type GymWorkoutEditorProps = {
  userId: string;
  initial: Workout;
  customExercises: CustomExercise[];
  onClose: () => void;
};

export function GymWorkoutEditor({
  userId,
  initial,
  customExercises,
  onClose,
}: GymWorkoutEditorProps) {
  const [w, setW] = useState<Workout>(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [plateOpen, setPlateOpen] = useState(false);
  const [plateTarget, setPlateTarget] = useState("");
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [pairOpen, setPairOpen] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const persist = useCallback(async () => {
    try {
      await saveWorkout(userId, w);
      saveWorkoutDraftLocal({
        workoutId: w.id,
        updatedAt: new Date().toISOString(),
        payload: w,
      });
    } catch (e) {
      logger.error("saveWorkout", e);
    }
  }, [userId, w]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persist();
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [w, persist]);

  useEffect(() => {
    if (restUntil == null) return;
    const t = setInterval(() => {
      if (Date.now() >= restUntil) {
        setRestUntil(null);
        if (typeof window !== "undefined" && "Notification" in window) {
          try {
            void new Notification("Descanso", { body: "Serie lista" });
          } catch {
            /* no perm */
          }
        }
      }
    }, 500);
    return () => clearInterval(t);
  }, [restUntil]);

  const addExerciseCatalog = async (exerciseRefId: string) => {
    const cat = getCatalogExerciseById(exerciseRefId);
    const name = cat?.nameEs ?? exerciseRefId;
    let sets =
      (await getLastCompletedSetsForCatalogExercise(
        userId,
        exerciseRefId
      )) ?? null;
    if (!sets || sets.length === 0) {
      sets = [
        defaultSet(1, "warmup"),
        { ...defaultSet(2, "working"), weightKg: null, reps: 10 },
      ];
    } else {
      sets = sets.map((s, idx) => ({
        ...s,
        setIndex: idx + 1,
        completed: false,
      }));
    }
    const inst: WorkoutExerciseInstance = {
      id: crypto.randomUUID(),
      order: w.exercises.length,
      nameSnapshot: name,
      exerciseRefId,
      customExerciseId: null,
      notes: null,
      supersetGroupId: null,
      equipmentUsed: cat?.equipment ?? null,
      sets,
    };
    setW((prev) => ({
      ...prev,
      exercises: [...prev.exercises, inst].map((e, i) => ({
        ...e,
        order: i,
      })),
    }));
  };

  const addExerciseCustom = (customExerciseId: string) => {
    const c = customExercises.find((x) => x.id === customExerciseId);
    const name = c?.name ?? "Personalizado";
    const inst: WorkoutExerciseInstance = {
      id: crypto.randomUUID(),
      order: w.exercises.length,
      nameSnapshot: name,
      exerciseRefId: null,
      customExerciseId,
      notes: null,
      supersetGroupId: null,
      equipmentUsed: c?.equipment,
      sets: [defaultSet(1, "warmup"), defaultSet(2, "working")],
    };
    setW((prev) => ({
      ...prev,
      exercises: [...prev.exercises, inst].map((e, i) => ({
        ...e,
        order: i,
      })),
    }));
  };

  const updateSet = (
    exerciseId: string,
    setIndex: number,
    patch: Partial<WorkoutSet>
  ) => {
    setW((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) =>
            s.setIndex === setIndex ? { ...s, ...patch } : s
          ),
        };
      }),
    }));
  };

  const toggleComplete = (exerciseId: string, setIndex: number) => {
    setW((prev) => {
      const ex = prev.exercises.find((e) => e.id === exerciseId);
      const s = ex?.sets.find((x) => x.setIndex === setIndex);
      const willComplete = !(s?.completed ?? false);
      const next = {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((x) =>
              x.setIndex === setIndex ? { ...x, completed: willComplete } : x
            ),
          };
        }),
      };
      if (willComplete && s?.restSecondsTarget) {
        setRestUntil(Date.now() + s.restSecondsTarget * 1000);
      }
      return next;
    });
  };

  const addSetRow = (exerciseId: string) => {
    setW((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const n = ex.sets.length + 1;
        return {
          ...ex,
          sets: [...ex.sets, defaultSet(n, "working")],
        };
      }),
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setW((prev) => ({
      ...prev,
      exercises: prev.exercises
        .filter((e) => e.id !== exerciseId)
        .map((e, i) => ({ ...e, order: i })),
    }));
  };

  const pairWith = (fromId: string, toId: string) => {
    const gid = crypto.randomUUID();
    setW((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) =>
        e.id === fromId || e.id === toId
          ? { ...e, supersetGroupId: gid }
          : e
      ),
    }));
    setPairOpen(null);
  };

  const addCardio = () => {
    const seg: CardioSegment = {
      id: crypto.randomUUID(),
      label: "Cardio",
      durationSec: 600,
      distanceM: null,
      machine: null,
      caloriesEstimate: null,
      inclinePercent: null,
      notes: null,
    };
    setW((prev) => ({
      ...prev,
      cardioSegments: [...prev.cardioSegments, seg],
    }));
  };

  const plateBreakdown = useMemo(() => {
    const n = parseFloat(plateTarget.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return null;
    return calculatePlatesPerSide({ targetTotalKg: n });
  }, [plateTarget]);

  const finish = async () => {
    try {
      await setWorkoutCompleted(userId, w.id, w.exercises, w.cardioSegments, w.notes);
      clearWorkoutDraftLocal();
      onClose();
    } catch (e) {
      logger.error("finish workout", e);
    }
  };

  const abandon = async () => {
    try {
      await abandonWorkout(userId, w.id);
      clearWorkoutDraftLocal();
      onClose();
    } catch (e) {
      logger.error("abandon workout", e);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(w, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entreno-${w.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restLabel = useMemo(() => {
    if (restUntil == null) return null;
    const sec = Math.max(0, Math.ceil((restUntil - Date.now()) / 1000));
    return `${sec}s`;
  }, [restUntil]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {restLabel != null ? (
        <div className="sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-primary/30 bg-primary/15 py-3 text-primary">
          <Timer className="h-4 w-4" />
          <span className="text-sm font-bold tabular-nums">
            Descanso: {restLabel}
          </span>
          <Button type="button" size="sm" variant="ghost" onClick={() => setRestUntil(null)}>
            Saltar
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Ejercicio
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={addCardio}>
          Cardio / HIIT
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setPlateOpen(true)}>
          Calculadora discos
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={exportJson}>
          <Download className="mr-1 h-4 w-4" />
          Export JSON
        </Button>
        <div className="flex-1" />
        <Button type="button" size="sm" variant="destructive" onClick={() => void abandon()}>
          Abandonar
        </Button>
        <Button type="button" size="sm" onClick={() => void finish()}>
          <Check className="mr-1 h-4 w-4" />
          Finalizar
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 pb-28">
        {w.cardioSegments.length > 0 ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">Cardio / condición</p>
              {w.cardioSegments.map((seg, idx) => (
                <div
                  key={seg.id}
                  className="grid gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-4"
                >
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={seg.label}
                      onChange={(e) => {
                        const v = e.target.value;
                        setW((p) => ({
                          ...p,
                          cardioSegments: p.cardioSegments.map((c, i) =>
                            i === idx ? { ...c, label: v } : c
                          ),
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Minutos</Label>
                    <Input
                      type="number"
                      value={Math.round(seg.durationSec / 60)}
                      onChange={(e) => {
                        const min = parseInt(e.target.value, 10) || 0;
                        setW((p) => ({
                          ...p,
                          cardioSegments: p.cardioSegments.map((c, i) =>
                            i === idx ? { ...c, durationSec: min * 60 } : c
                          ),
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Distancia (m)</Label>
                    <Input
                      type="number"
                      value={seg.distanceM ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setW((p) => ({
                          ...p,
                          cardioSegments: p.cardioSegments.map((c, i) =>
                            i === idx
                              ? {
                                  ...c,
                                  distanceM: v === "" ? null : Number(v),
                                }
                              : c
                          ),
                        }));
                      }}
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Label className="text-xs">Máquina / notas</Label>
                    <Input
                      value={seg.machine ?? ""}
                      placeholder="Cinta, bici, remo…"
                      onChange={(e) => {
                        const v = e.target.value;
                        setW((p) => ({
                          ...p,
                          cardioSegments: p.cardioSegments.map((c, i) =>
                            i === idx ? { ...c, machine: v || null } : c
                          ),
                        }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {w.exercises.map((ex) => (
          <Card key={ex.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{ex.nameSnapshot}</h3>
                    {ex.supersetGroupId ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-medium text-primary">
                        Superserie
                      </span>
                    ) : null}
                  </div>
                  {ex.equipmentUsed ? (
                    <p className="text-xs capitalize text-muted-foreground">
                      {ex.equipmentUsed}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPairOpen(ex.id)}
                  >
                    <Layers className="mr-1 h-3.5 w-3.5" />
                    Emparejar
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeExercise(ex.id)}
                    aria-label="Quitar ejercicio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2 pr-2">Tipo</th>
                      <th className="py-2 pr-2">Peso (kg)</th>
                      <th className="py-2 pr-2">Reps</th>
                      <th className="py-2 pr-2">Desc (s)</th>
                      <th className="py-2 pr-2">BW</th>
                      <th className="py-2 pr-2">Listo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((s) => (
                      <tr key={s.setIndex} className="border-b border-border/40">
                        <td className="py-1.5 pr-2 tabular-nums">{s.setIndex}</td>
                        <td className="py-1.5 pr-2">
                          <Select
                            value={s.setType}
                            onValueChange={(v) =>
                              updateSet(ex.id, s.setIndex, {
                                setType: v as WorkoutSetType,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-[120px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SET_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1.5 pr-2">
                          <Input
                            className="h-8 w-20"
                            type="number"
                            disabled={s.bodyweight}
                            value={s.weightKg ?? ""}
                            onChange={(e) =>
                              updateSet(ex.id, s.setIndex, {
                                weightKg:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <Input
                            className="h-8 w-16"
                            type="number"
                            value={s.reps ?? ""}
                            onChange={(e) =>
                              updateSet(ex.id, s.setIndex, {
                                reps:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <Input
                            className="h-8 w-16"
                            type="number"
                            value={s.restSecondsTarget ?? ""}
                            onChange={(e) =>
                              updateSet(ex.id, s.setIndex, {
                                restSecondsTarget:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="checkbox"
                            checked={Boolean(s.bodyweight)}
                            onChange={(e) =>
                              updateSet(ex.id, s.setIndex, {
                                bodyweight: e.target.checked,
                                weightKg: e.target.checked ? null : s.weightKg,
                              })
                            }
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <Button
                            type="button"
                            size="icon"
                            variant={s.completed ? "default" : "outline"}
                            className="h-8 w-8"
                            onClick={() => toggleComplete(ex.id, s.setIndex)}
                            aria-label="Serie hecha"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSetRow(ex.id)}
              >
                + Serie
              </Button>
            </CardContent>
          </Card>
        ))}

        {w.exercises.length === 0 && w.cardioSegments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Añade ejercicios o un bloque cardio para empezar.
          </p>
        ) : null}
      </div>

      <GymExercisePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        customExercises={customExercises}
        onPickCatalog={(id) => void addExerciseCatalog(id)}
        onPickCustom={(id) => {
          addExerciseCustom(id);
          setPickerOpen(false);
        }}
      />

      <Dialog open={plateOpen} onOpenChange={setPlateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculadora de discos</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Barra olímpica ~20 kg. Discos iguales a cada lado según inventario
            estándar (ajustable en código).
          </p>
          <Input
            placeholder="Peso total deseado (kg)"
            value={plateTarget}
            onChange={(e) => setPlateTarget(e.target.value)}
          />
          {plateBreakdown ? (
            <div className="space-y-2 text-sm">
              <p>Por lado: {plateBreakdown.loadPerSideKg.toFixed(2)} kg de discos</p>
              <ul className="list-disc pl-4">
                {plateBreakdown.platesPerSide.map((p) => (
                  <li key={p.weightKg}>
                    {p.count} × {p.weightKg} kg
                  </li>
                ))}
              </ul>
              {plateBreakdown.remainderKgPerSide > 0.001 ? (
                <p className="text-amber-700 text-xs dark:text-amber-400">
                  Residuo por lado no cubierto:{" "}
                  {plateBreakdown.remainderKgPerSide.toFixed(2)} kg
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={pairOpen != null} onOpenChange={(o) => !o && setPairOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elegir pareja de superserie</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {w.exercises
              .filter((e) => e.id !== pairOpen)
              .map((e) => (
                <Button
                  key={e.id}
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (pairOpen) pairWith(pairOpen, e.id);
                  }}
                >
                  {e.nameSnapshot}
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
