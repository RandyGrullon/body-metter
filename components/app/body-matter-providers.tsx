"use client";

import type React from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { BodyMatterShell } from "@/components/layout/body-matter-shell";

export function BodyMatterProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <BodyMatterShell>{children}</BodyMatterShell>
      <Toaster />
    </AuthProvider>
  );
}
