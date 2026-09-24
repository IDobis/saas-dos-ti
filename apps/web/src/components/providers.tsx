"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthProvider>
      {/* Todas as notificações do sistema duram 6 segundos */}
      <Toaster duration={6000} position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}
