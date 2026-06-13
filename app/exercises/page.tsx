"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  createCustomExercise,
  listCustomExercises,
  updateCustomExerciseImageUrl,
} from "@/lib/gym";
import { uploadCustomExerciseImage } from "@/lib/gym-storage";
import { getCatalogExercises } from "@/lib/exercise-catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomExercise } from "@/types/gym";
import { Loader2, Plus } from "lucide-react";
import { logger } from "@/lib/logger";

export default function ExercisesPage() {
  const { user } = useAuth();
  const [custom, setCustom] = useState<CustomExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setCustom(await listCustomExercises(user.uid));
    } catch (e) {
      logger.error("exercises", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveCustom = async () => {
    if (!user || !name.trim()) return;
    try {
      const id = await createCustomExercise(user.uid, {
        name: name.trim(),
        muscleTags: muscle
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        equipment: null,
        imageUrl: null,
        instructions: null,
      });
      if (file) {
        const url = await uploadCustomExerciseImage(user.uid, id, file);
        await updateCustomExerciseImageUrl(user.uid, id, url);
      }
      setOpen(false);
      setName("");
      setMuscle("");
      setFile(null);
      await refresh();
    } catch (e) {
      logger.error("custom exercise", e);
    }
  };

  const catalog = getCatalogExercises();

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Ejercicios</h1>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Personalizado
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold">Mis ejercicios</h2>
          {loading ? (
            <Loader2 className="mt-4 h-6 w-6 animate-spin text-primary" />
          ) : custom.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Aún no has creado ejercicios personalizados.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {custom.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-border/60 p-3 text-sm"
                >
                  {c.name}
                  {c.muscleTags.length > 0 ? (
                    <span className="ml-2 text-muted-foreground">
                      ({c.muscleTags.join(", ")})
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="max-h-[50vh] overflow-y-auto p-4">
          <h2 className="font-semibold">Catálogo</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {catalog.map((e) => (
              <li key={e.id} className="text-muted-foreground">
                <span className="font-medium text-foreground">{e.nameEs}</span>{" "}
                · {e.muscleGroups.join(", ")}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo ejercicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Músculos (coma)</Label>
              <Input value={muscle} onChange={(e) => setMuscle(e.target.value)} />
            </div>
            <div>
              <Label>Foto (opcional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="button" onClick={() => void saveCustom()}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
