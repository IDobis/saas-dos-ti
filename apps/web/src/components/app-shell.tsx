"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useRef, useState } from "react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { LayoutDashboard, LogOut, Menu, Moon, PlusCircle, Sun, Ticket, Users, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api, ApiError } from "@/lib/api";
import { useAuth, type Perfil } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: typeof Ticket; perfis?: Perfil[] }[] = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard, perfis: ["TECNICO", "ADMIN"] },
  { href: "/chamados", label: "Chamados", icon: Ticket },
  { href: "/chamados/novo", label: "Novo chamado", icon: PlusCircle },
  { href: "/cadastros", label: "Cadastros", icon: Users, perfis: ["ADMIN"] },
];

function NavLinks({ onNavigate, grupo }: { onNavigate?: () => void; grupo: string }) {
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
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              ativo ? "font-medium text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            {ativo && (
              <motion.span
                layoutId={`modulo-sys-${grupo}`}
                className="absolute inset-0 rounded-md bg-foreground/10 dark:bg-white/10"
                transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
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
    <Link href="/dashboard" className="px-3">
      <Logo />
    </Link>
  );
}

const LIMITE_DEMO = 300;

type QuantidadesDemo = {
  abertos: number;
  resolvidos: number;
  emAndamento: number;
  resto: number;
};

const QUANTIDADE_INICIAL: QuantidadesDemo = { abertos: 8, resolvidos: 6, emAndamento: 4, resto: 2 };

function mesIso(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

const AGORA = new Date();
const MES_ATUAL = mesIso(AGORA);
const MES_INICIAL = mesIso(new Date(AGORA.getFullYear(), AGORA.getMonth() - 2, 1));

function somaDemo(q: QuantidadesDemo) {
  return q.abertos + q.resolvidos + q.emAndamento + q.resto;
}

function randomizarDemo(): QuantidadesDemo {
  const bruto = {
    abertos: Math.floor(Math.random() * 121),
    resolvidos: Math.floor(Math.random() * 121),
    emAndamento: Math.floor(Math.random() * 121),
    resto: Math.floor(Math.random() * 121),
  };
  const soma = somaDemo(bruto);
  if (soma === 0) return { abertos: 10, resolvidos: 0, emAndamento: 0, resto: 0 };
  if (soma <= LIMITE_DEMO) return bruto;
  const fator = LIMITE_DEMO / soma;
  const ajustado = {
    abertos: Math.floor(bruto.abertos * fator),
    resolvidos: Math.floor(bruto.resolvidos * fator),
    emAndamento: Math.floor(bruto.emAndamento * fator),
    resto: Math.floor(bruto.resto * fator),
  };
  const falta = LIMITE_DEMO - somaDemo(ajustado);
  ajustado.abertos += falta;
  return ajustado;
}

function DemoButton() {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [qtd, setQtd] = useState<QuantidadesDemo>(QUANTIDADE_INICIAL);
  const [de, setDe] = useState(MES_INICIAL);
  const [ate, setAte] = useState(MES_ATUAL);
  const [carregando, setCarregando] = useState<"gerar" | "remover" | null>(null);
  if (usuario?.perfil !== "ADMIN") return null;

  const total = somaDemo(qtd);

  function definir(campo: keyof QuantidadesDemo, valor: number) {
    const proximo = { ...qtd, [campo]: valor };
    const excesso = somaDemo(proximo) - LIMITE_DEMO;
    if (excesso > 0) proximo[campo] = Math.max(0, valor - excesso);
    setQtd(proximo);
  }

  async function gerar() {
    setCarregando("gerar");
    try {
      await api("/chamados/demo", { method: "POST", body: { ...qtd, de, ate } });
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível gerar os dados de teste.");
      setCarregando(null);
    }
  }

  async function remover() {
    setCarregando("remover");
    try {
      await api("/chamados/demo", { method: "DELETE" });
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível remover os dados de teste.");
      setCarregando(null);
    }
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setAberto(true)}>
        Demo
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dados de teste</DialogTitle>
            <DialogDescription>
              Escolha o intervalo de meses e quantos chamados criar em cada status. A soma não passa de {LIMITE_DEMO}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              Mês inicial
              <input
                type="month"
                value={de}
                max={ate || MES_ATUAL}
                onChange={(e) => setDe(e.target.value)}
                className="h-9 rounded-lg border border-input bg-transparent px-3 dark:bg-input/30"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Mês final
              <input
                type="month"
                value={ate}
                min={de}
                max={MES_ATUAL}
                onChange={(e) => setAte(e.target.value)}
                className="h-9 rounded-lg border border-input bg-transparent px-3 dark:bg-input/30"
              />
            </label>
          </div>
          <div className="grid gap-3">
            <BarraDemo rotulo="Abertos" valor={qtd.abertos} onChange={(v) => definir("abertos", v)} />
            <BarraDemo rotulo="Em andamento" valor={qtd.emAndamento} onChange={(v) => definir("emAndamento", v)} />
            <BarraDemo rotulo="Resolvidos" valor={qtd.resolvidos} onChange={(v) => definir("resolvidos", v)} />
            <BarraDemo
              rotulo="Outros status"
              detalhe="Aguardando, fechados e cancelados"
              valor={qtd.resto}
              onChange={(v) => definir("resto", v)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <p className="text-sm text-muted-foreground">{total} de {LIMITE_DEMO}</p>
            <Button variant="outline" size="sm" onClick={() => setQtd(randomizarDemo())} disabled={carregando !== null}>
              Randomizar
            </Button>
          </div>
          <Button onClick={gerar} disabled={carregando !== null || total < 1 || !de || !ate || de > ate}>
            {carregando === "gerar" ? "Gerando..." : "Gerar chamados de teste"}
          </Button>
          <div className="grid gap-2 border-t pt-3">
            <p className="text-sm text-muted-foreground">Apaga só os chamados marcados como teste.</p>
            <Button variant="destructive" onClick={remover} disabled={carregando !== null}>
              {carregando === "remover" ? "Apagando..." : "Apagar dados de teste"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BarraDemo({
  rotulo,
  detalhe,
  valor,
  onChange,
}: {
  rotulo: string;
  detalhe?: string;
  valor: number;
  onChange: (valor: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="flex items-baseline justify-between gap-3">
        <span>
          {rotulo}
          {detalhe && <span className="mt-0.5 block text-xs text-muted-foreground">{detalhe}</span>}
        </span>
        <span className="tabular-nums text-muted-foreground">{valor}</span>
      </span>
      <input
        type="range"
        min={0}
        max={LIMITE_DEMO}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-foreground"
      />
    </label>
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

function PaginaCongelada({ children }: { children: React.ReactNode }) {
  const contexto = useContext(LayoutRouterContext);
  const congelado = useRef(contexto).current;
  return <LayoutRouterContext.Provider value={congelado}>{children}</LayoutRouterContext.Provider>;
}

function TransicaoPagina({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
        >
          <PaginaCongelada>{children}</PaginaCongelada>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
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
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r bg-sidebar py-5 lg:flex">
        <Brand />
        <div className="flex-1 px-3">
          <NavLinks grupo="lateral" />
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-sidebar px-4 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setAberto(true)}>
            <Menu className="size-4" />
          </Button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DemoButton />
            <ThemeToggle />
          </div>
        </header>

        {aberto && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setAberto(false)}
              />
              <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 border-r bg-sidebar py-5 lg:hidden">
                <div className="flex items-center justify-between pr-3">
                  <Brand />
                  <Button variant="ghost" size="icon" aria-label="Fechar menu" onClick={() => setAberto(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="px-3">
                  <NavLinks grupo="menu" onNavigate={() => setAberto(false)} />
                </div>
              </aside>
            </>
          )}

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-8">
          <TransicaoPagina>{children}</TransicaoPagina>
        </main>
      </div>
    </div>
  );
}
