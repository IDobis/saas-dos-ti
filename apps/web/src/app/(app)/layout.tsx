"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { usuario, carregando } = useAuth();

  useEffect(() => {
    if (!carregando && !usuario) router.replace("/login");
  }, [carregando, usuario, router]);

  if (carregando || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
