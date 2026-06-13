"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createWorkout } from "@/lib/gym";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

export default function NewSessionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    void (async () => {
      try {
        const id = await createWorkout(user.uid, "Entreno");
        router.replace(`/session/${id}`);
      } catch (e) {
        logger.error("new session", e);
        router.replace("/");
      }
    })();
  }, [user, router]);

  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
