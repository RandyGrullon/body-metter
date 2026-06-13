"use client";

import { useAuth } from "@/hooks/use-auth";
import { AuthScreen } from "@/components/auth/auth-screen";
import { GameDashboard } from "@/components/gym/game-dashboard";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <GameDashboard />;
}
