---
name: bodymatter-overview
description: Qué es BodyMatter y el plan de transformación a estilo Hevy + videojuego
metadata:
  type: project
---

BodyMatter es una PWA de gym (tipo Hevy) en Next.js 14 + Firebase + Tailwind v4, pnpm, puerto 3001. Comparte cuenta Firebase con la app Eaty. Ya tenía rutinas, sesión con timer, historial, calendario, medidas, catálogo de ejercicios, rutinas con IA (Groq), auth.

El usuario quiere convertirla en "videojuego moderno y friendly", completa como Hevy. Plan por fases acordado 2026-06-13:
1. **Rediseño visual + gamificación** (EN CURSO / hecho fase 1): añadidos `lib/gamification.ts` (racha, XP/nivel curva 100·n², logros, stats semanales) + `components/gym/game-dashboard.tsx` (nuevo home) + utilidades CSS `.game-card/.text-gradient/animate-pop` en globals.css. Tests en `lib/gamification.test.ts`.
2. PWA real (service worker, offline, instalable, notificación de descanso) — pendiente.
3. Funciones tipo Hevy en sesión (superseries, RPE, timer descanso con aviso, comparación sesión previa, músculos trabajados) — pendiente.

Nota: node_modules de pnpm con symlinks que bash en Windows no resuelve; usar PowerShell (`pnpm exec tsc --noEmit`, `pnpm test`). `pnpm install` requiere `$env:CI="true"` por el no-TTY.
