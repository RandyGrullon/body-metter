"use client";

import Link from "next/link";
import { getEatyPublicOrigin } from "@/lib/env-public";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Utensils, Dumbbell } from "lucide-react";

export default function IntegracionPage() {
  const eaty = getEatyPublicOrigin();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Eaty y Body Metter
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Dos aplicaciones independientes con el mismo proyecto Firebase. Con la
          misma cuenta, nutrición y entreno comparten identidad y datos donde el
          modelo lo permita.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border border-border/80 shadow-none">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Utensils className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="font-medium tracking-tight">Eaty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nutrición y comidas
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/80 shadow-none">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Dumbbell className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="font-medium tracking-tight">Body Metter</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Rutinas, sesión y medidas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-dashed border-border bg-muted/30 shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-muted-foreground">
            En Vercel, cada repo tiene su propio dominio. Configura{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              NEXT_PUBLIC_EATY_ORIGIN
            </code>{" "}
            con la URL pública de Eaty.
          </p>
          <Button asChild size="sm" className="shrink-0 gap-1.5">
            <a href={eaty} rel="noopener noreferrer" target="_blank">
              Abrir Eaty
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </Button>
        </CardContent>
      </Card>

      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al inicio
        </Link>
      </Button>
    </div>
  );
}
