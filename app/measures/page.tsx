"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { addBodyMeasurement, listBodyMeasurements } from "@/lib/gym";
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
import type { BodyMeasurement } from "@/types/gym";
import { Loader2, Plus, Ruler } from "lucide-react";
import { logger } from "@/lib/logger";

export default function MeasuresPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mw, setMw] = useState("");
  const [mwaist, setMwaist] = useState("");
  const [mneck, setMneck] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setRows(await listBodyMeasurements(user.uid, 40));
    } catch (e) {
      logger.error("measures", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async () => {
    if (!user) return;
    try {
      await addBodyMeasurement(user.uid, {
        weightKg: mw === "" ? null : Number(mw),
        waistCm: mwaist === "" ? null : Number(mwaist),
        neckCm: mneck === "" ? null : Number(mneck),
        notes: null,
      });
      setOpen(false);
      setMw("");
      setMwaist("");
      setMneck("");
      await refresh();
    } catch (e) {
      logger.error("measurement", e);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Medidas corporales</h1>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva medida
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Mismo formato que en Eaty: peso (kg), cintura y cuello (cm).
      </p>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin medidas aún.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {rows.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 p-3"
                >
                  <Ruler className="h-4 w-4 text-primary" aria-hidden />
                  <span className="font-medium">
                    {m.measuredAt.toLocaleDateString("es-ES")}
                  </span>
                  <span className="text-muted-foreground">
                    {m.weightKg != null ? `${m.weightKg} kg` : "—"} · cintura{" "}
                    {m.waistCm != null ? `${m.waistCm} cm` : "—"} · cuello{" "}
                    {m.neckCm != null ? `${m.neckCm} cm` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva medida</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Peso (kg)</Label>
              <Input value={mw} onChange={(e) => setMw(e.target.value)} />
            </div>
            <div>
              <Label>Cintura (cm)</Label>
              <Input value={mwaist} onChange={(e) => setMwaist(e.target.value)} />
            </div>
            <div>
              <Label>Cuello (cm)</Label>
              <Input value={mneck} onChange={(e) => setMneck(e.target.value)} />
            </div>
            <Button type="button" onClick={() => void save()}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
