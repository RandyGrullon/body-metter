"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { Dumbbell, Timer, TrendingUp } from "lucide-react";

const highlights = [
  {
    icon: Dumbbell,
    title: "Rutinas y ejercicios",
    text: "Crea rutinas, usa el catálogo o ejercicios personalizados.",
  },
  {
    icon: Timer,
    title: "Entreno guiado",
    text: "Temporizador de sesión y descansos entre series.",
  },
  {
    icon: TrendingUp,
    title: "Historial y estadísticas",
    text: "Volumen, PRs y calendario con la misma cuenta que Eaty.",
  },
];

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="relative min-h-[220px] overflow-hidden border-b border-border lg:min-h-screen lg:w-[42%] lg:border-b-0 lg:border-r">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-chart-2 opacity-[0.97]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white,transparent_55%),radial-gradient(circle_at_80%_60%,white,transparent_45%)] opacity-[0.15]"
          aria-hidden
        />
        <div className="relative z-10 flex h-full flex-col justify-between px-8 py-10 text-primary-foreground lg:h-full lg:px-12 lg:py-14">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
                <Dumbbell className="h-5 w-5" aria-hidden />
              </div>
              <span className="text-xl font-semibold tracking-tight">
                Body Metter
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
              Tu espacio de entrenamiento. Misma cuenta Firebase que Eaty: tus
              datos de gym viven en un solo lugar.
            </p>
          </div>

          <ul className="mt-10 hidden gap-4 sm:grid lg:mt-0">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex gap-3 rounded-xl bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/10"
              >
                <Icon
                  className="mt-0.5 h-5 w-5 shrink-0 opacity-90"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-xs text-primary-foreground/75">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin
                ? "Ingresa con la misma cuenta que usas en Eaty."
                : "Crea una cuenta o usa la misma que en Eaty para ver tus rutinas."}
            </p>
          </div>

          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </main>
    </div>
  );
}
