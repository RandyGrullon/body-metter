"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { saveRoutine } from "@/lib/gym";
import { generateGymRoutineAi } from "@/lib/groq-gym-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GroqApiError } from "@/lib/groq-api-error";
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { logger } from "@/lib/logger";

const STEPS = 4;

export default function WorkoutAiPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "intermediate"
  );
  const [equipment, setEquipment] = useState("");
  const [sessionMinutes, setSessionMinutes] = useState(60);
  const [injuries, setInjuries] = useState("");
  const [generating, setGenerating] = useState(false);

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const idToken = await user.getIdToken();
      const routine = await generateGymRoutineAi({
        goal: goal.trim(),
        daysPerWeek,
        level,
        equipment: equipment.trim() || "gimnasio completo",
        sessionMinutes,
        injuriesNote: injuries.trim() || null,
        idToken,
      });
      await saveRoutine(user.uid, {
        title: routine.title,
        exercises: routine.exercises.map((e) => ({
          exerciseRefId: e.exerciseRefId,
          customExerciseId: e.customExerciseId ?? null,
          nameSnapshot: e.nameSnapshot,
          targetSets: e.targetSets,
          targetRepsHint: e.targetRepsHint ?? null,
        })),
      });
      toast({ title: "Rutina guardada" });
      router.push("/workouts");
    } catch (e) {
      logger.error("ai routine", e);
      const msg =
        e instanceof GroqApiError ? e.message : "No se pudo generar la rutina.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-bold">Rutina con IA</h1>
        <p className="text-sm text-muted-foreground">
          Paso {step + 1} de {STEPS}
        </p>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((step + 1) / STEPS) * 100}%` }}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          {step === 0 ? (
            <>
              <Label>Objetivo principal</Label>
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ej. Hipertrofia piernas, pérdida de grasa…"
              />
            </>
          ) : null}
          {step === 1 ? (
            <>
              <Label>Días a la semana (orientativo)</Label>
              <Select
                value={String(daysPerWeek)}
                onValueChange={(v) => setDaysPerWeek(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} días
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Nivel</Label>
              <Select
                value={level}
                onValueChange={(v) =>
                  setLevel(v as "beginner" | "intermediate" | "advanced")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <Label>Material disponible</Label>
              <Input
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="Mancuernas en casa, gimnasio completo, máquinas…"
              />
              <Label>Duración orientativa (min)</Label>
              <Input
                type="number"
                min={15}
                max={180}
                value={sessionMinutes}
                onChange={(e) =>
                  setSessionMinutes(parseInt(e.target.value, 10) || 60)
                }
              />
            </>
          ) : null}
          {step === 3 ? (
            <>
              <Label>Lesiones o limitaciones (opcional)</Label>
              <Input
                value={injuries}
                onChange={(e) => setInjuries(e.target.value)}
                placeholder="Rodilla, espalda baja…"
              />
              <p className="text-xs text-muted-foreground">
                Se aplicará cuota diaria de generación por IA en el servidor.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={back}
          disabled={step === 0 || generating}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Atrás
        </Button>
        {step < STEPS - 1 ? (
          <Button
            type="button"
            onClick={next}
            disabled={
              (step === 0 && goal.trim().length < 4) ||
              (step === 2 && equipment.trim().length < 2)
            }
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void generate()}
            disabled={generating || goal.trim().length < 4}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-4 w-4" />
            )}
            Generar y guardar
          </Button>
        )}
      </div>
    </div>
  );
}
