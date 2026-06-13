"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getCatalogExercises,
  searchCatalogExercises,
} from "@/lib/exercise-catalog";
import type { CustomExercise } from "@/types/gym";

type GymExercisePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customExercises: CustomExercise[];
  onPickCatalog: (exerciseRefId: string) => void;
  onPickCustom: (customExerciseId: string) => void;
};

const EQUIPMENT_FILTERS = [
  { id: "", label: "Todo" },
  { id: "barbell", label: "Barra" },
  { id: "dumbbell", label: "Mancuerna" },
  { id: "machine", label: "Máquina" },
  { id: "cable", label: "Polea" },
  { id: "bodyweight", label: "Peso corporal" },
  { id: "kettlebell", label: "Kettlebell" },
] as const;

export function GymExercisePickerDialog({
  open,
  onOpenChange,
  customExercises,
  onPickCatalog,
  onPickCustom,
}: GymExercisePickerDialogProps) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");

  const catalogResults = useMemo(() => {
    return searchCatalogExercises({
      query: q,
      muscle: muscle || undefined,
      equipment: equipment || undefined,
    });
  }, [q, muscle, equipment]);

  const allCatalog = useMemo(() => getCatalogExercises(), []);

  const muscles = useMemo(() => {
    const s = new Set<string>();
    for (const e of allCatalog) {
      e.muscleGroups.forEach((m) => s.add(m));
    }
    return [...s].sort((a, b) => a.localeCompare(b, "es"));
  }, [allCatalog]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border p-4 pb-3">
          <DialogTitle>Añadir ejercicio</DialogTitle>
          <div className="mt-3 space-y-2">
            <Input
              placeholder="Buscar por nombre o músculo…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-xl"
            />
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_FILTERS.map((f) => (
                <Button
                  key={f.id || "all"}
                  type="button"
                  size="sm"
                  variant={equipment === f.id ? "default" : "outline"}
                  className="h-7 rounded-full text-xs"
                  onClick={() => setEquipment(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={muscle === "" ? "default" : "outline"}
                className="h-7 rounded-full text-xs"
                onClick={() => setMuscle("")}
              >
                Todos los músculos
              </Button>
              {muscles.slice(0, 12).map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant={muscle === m ? "default" : "outline"}
                  className="h-7 rounded-full text-xs capitalize"
                  onClick={() => setMuscle(m)}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] px-2">
          {customExercises.length > 0 ? (
            <div className="space-y-1 border-b border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mis ejercicios
              </p>
              {customExercises.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-2 text-left transition-colors hover:bg-muted/40"
                  onClick={() => {
                    onPickCustom(c.id);
                    onOpenChange(false);
                  }}
                >
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="space-y-1 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Catálogo
            </p>
            {catalogResults.map((e) => (
              <button
                key={e.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-2 text-left transition-colors hover:bg-muted/30"
                onClick={() => {
                  onPickCatalog(e.id);
                  onOpenChange(false);
                }}
              >
                <img
                  src={e.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{e.nameEs}</p>
                  <p className="text-[0.65rem] capitalize text-muted-foreground">
                    {e.muscleGroups.join(" · ")} · {e.equipment}
                  </p>
                </div>
              </button>
            ))}
            {catalogResults.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin resultados. Prueba otra búsqueda o filtro.
              </p>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
