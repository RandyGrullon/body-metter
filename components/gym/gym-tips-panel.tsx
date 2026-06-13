"use client";

import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, ExternalLink } from "lucide-react";
import { generateGymTips } from "@/lib/groq-gym-client";
import { GroqApiError } from "@/lib/groq-api-error";
import { logger } from "@/lib/logger";
import type { PersonalizedGymTip } from "@/lib/gym-schemas";
import { useToast } from "@/hooks/use-toast";

type GymTipsPanelProps = {
  idToken: string;
  recentWorkoutsSummary: string;
  fitnessGoal?: string | null;
};

export function GymTipsPanel({
  idToken,
  recentWorkoutsSummary,
  fitnessGoal,
}: GymTipsPanelProps) {
  const [tips, setTips] = useState<PersonalizedGymTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<PersonalizedGymTip | null>(null);
  const [injuriesNote, setInjuriesNote] = useState("");
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await generateGymTips({
        recentWorkoutsSummary,
        fitnessGoal,
        injuriesNote: injuriesNote.trim() || null,
        idToken,
      });
      setTips(t);
    } catch (e) {
      logger.error("gym tips", e);
      if (e instanceof GroqApiError && e.status === 429) {
        toast({
          title: "Límite diario",
          description: e.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No se pudieron cargar consejos",
          description: "Inténtalo más tarde.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [recentWorkoutsSummary, fitnessGoal, injuriesNote, idToken, toast]);

  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Consejos IA (gym)</h3>
            </div>
            <Button
              type="button"
              size="sm"
              variant="default"
              disabled={loading}
              onClick={() => void load()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Generar consejos"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Notas opcionales (molestias, sin diagnóstico):{" "}
            <input
              className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-xs"
              value={injuriesNote}
              onChange={(e) => setInjuriesNote(e.target.value)}
              placeholder="Ej. molestia rodilla izquierda al flexionar…"
            />
          </p>
          <p className="text-[0.7rem] text-muted-foreground">
            La IA no sustituye a un profesional de la salud. Ante dolor agudo,
            para y consulta.
          </p>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <button
                key={i}
                type="button"
                className="w-full rounded-xl border border-border/70 bg-muted/20 p-3 text-left text-sm transition-colors hover:bg-muted/40"
                onClick={() => setDetail(tip)}
              >
                <p className="font-semibold text-primary">{tip.focusTitle}</p>
                <p className="mt-1 line-clamp-2 text-muted-foreground">
                  {tip.whatToChange}
                </p>
              </button>
            ))}
            {!loading && tips.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Pulsa «Generar consejos» (usa tu cuota diaria de IA gym).
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Sheet open={detail != null} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl">
          {detail ? (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{detail.focusTitle}</SheetTitle>
                <SheetDescription className="text-left text-base font-medium text-foreground">
                  {detail.whatToChange}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-3 px-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Dónde
                  </p>
                  <p>{detail.whereApply}</p>
                </div>
                {detail.whyItHelps ? (
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Por qué
                    </p>
                    <p>{detail.whyItHelps}</p>
                  </div>
                ) : null}
                {detail.techniqueCue ? (
                  <div>
                    <p className="text-xs font-bold uppercase text-primary">
                      Cue técnica
                    </p>
                    <p>{detail.techniqueCue}</p>
                  </div>
                ) : null}
                <Separator />
                <ol className="list-decimal space-y-2 pl-4">
                  {detail.miniSteps.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
                {detail.safetyNote ? (
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    {detail.safetyNote}
                  </p>
                ) : null}
              </div>
              <SheetFooter className="flex-col gap-2">
                <Button type="button" className="w-full" asChild>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(detail.videoSearchQuery + " técnica gimnasio")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Buscar vídeos
                  </a>
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
