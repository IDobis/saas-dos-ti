"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { LayoutDashboard, LifeBuoy, LogOut, Menu, Moon, PlusCircle, Sun, Ticket, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, type Perfil } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: typeof Ticket; perfis?: Perfil[] }[] = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard, perfis: ["TECNICO", "ADMIN"] },
  { href: "/chamados", label: "Chamados", icon: Ticket },
  { href: "/chamados/novo", label: "Novo chamado", icon: PlusCircle },
  { href: "/cadastros", label: "Cadastros", icon: Users, perfis: ["ADMIN"] },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { usuario } = useAuth();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.filter((n) => !n.perfis || (usuario && n.perfis.includes(usuario.perfil))).map(({ href, label, icon: Icon }) => {
        const ativo = href === "/chamados" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              ativo ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {ativo && (
              <motion.span
                layoutId="nav-ativo"
                className="absolute inset-0 rounded-lg bg-primary/10"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="relative size-4" />
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-3 font-semibold">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <LifeBuoy className="size-4" />
      </span>
      SaaS dos TI
    </Link>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const { usuario, sair } = useAuth();
  const iniciais = (usuario?.nome ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r bg-background py-5 lg:flex">
        <Brand />
        <div className="flex-1 px-3">
          <NavLinks />
        </div>
        <div className="flex items-center gap-3 border-t px-4 pt-4">
          <Avatar>
            <AvatarFallback>{iniciais}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium">{usuario?.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{usuario?.organizacao ?? usuario?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            onClick={sair}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setAberto(true)}>
            <Menu className="size-4" />
          </Button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <AnimatePresence>
          {aberto && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAberto(false)}
              />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 bg-background py-5 shadow-xl lg:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
              >
                <div className="flex items-center justify-between pr-3">
                  <Brand />
                  <Button variant="ghost" size="icon" aria-label="Fechar menu" onClick={() => setAberto(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="px-3">
                  <NavLinks onNavigate={() => setAberto(false)} />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
