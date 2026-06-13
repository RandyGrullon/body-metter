"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  History,
  Home,
  Link2,
  Loader2,
  Ruler,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/workouts", label: "Rutinas", icon: Dumbbell },
  { href: "/history", label: "Historial", icon: History },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/profile", label: "Perfil", icon: User },
] as const;

export function BodyMatterShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  const sessionMode = pathname.startsWith("/session");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header
        className={
          sessionMode ?
            "hidden"
          : "sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
        }
      >
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2 md:px-4">
          <Link
            href="/"
            className="mr-1 flex items-center gap-2 font-semibold tracking-tight text-foreground"
          >
            <Activity className="h-5 w-5 text-primary" aria-hidden />
            <span className="hidden sm:inline">Body Metter</span>
          </Link>
          <nav className="ml-2 hidden flex-1 flex-wrap items-center gap-1 md:flex">
            {nav.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ?
                  pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href}>
                  <Button
                    type="button"
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-1"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </Button>
                </Link>
              );
            })}
            <Link href="/exercises">
              <Button
                type="button"
                variant={
                  pathname.startsWith("/exercises") ? "secondary" : "ghost"
                }
                size="sm"
                className="gap-1"
              >
                <Dumbbell className="h-4 w-4" aria-hidden />
                Ejercicios
              </Button>
            </Link>
            <Link href="/measures">
              <Button
                type="button"
                variant={
                  pathname.startsWith("/measures") ? "secondary" : "ghost"
                }
                size="sm"
                className="gap-1"
              >
                <Ruler className="h-4 w-4" aria-hidden />
                Medidas
              </Button>
            </Link>
            <Link href="/integracion">
              <Button
                type="button"
                variant={
                  pathname.startsWith("/integracion") ? "secondary" : "ghost"
                }
                size="sm"
                className="gap-1"
              >
                <Link2 className="h-4 w-4" aria-hidden />
                Eaty
              </Button>
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void logout()}
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main
        className={
          sessionMode ?
            "flex min-h-0 w-full flex-1 flex-col px-0 py-0"
          : "mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 py-4 pb-24 md:px-4 md:pb-6"
        }
      >
        {children}
      </main>

      <nav
        className={
          sessionMode ?
            "hidden"
          : "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        }
      >
        <div className="mx-auto flex max-w-lg justify-around gap-1 px-1 py-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ?
                pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
