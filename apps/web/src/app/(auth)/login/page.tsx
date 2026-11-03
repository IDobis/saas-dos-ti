"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimateIcon } from "@animate-ui/react/icons";
import { Effect } from "@animate-ui/react/primitives/effects/effect";
import { MorphingText } from "@animate-ui/react/primitives/texts/morphing";
import { toast } from "sonner";
import { Eye } from "@/components/animate-ui/icons/eye";
import { EyeOff } from "@/components/animate-ui/icons/eye-off";
import { LoaderCircle } from "@/components/animate-ui/icons/loader-circle";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

/** Campos do login: sem reação no hover; foco bem leve. */
const campoLogin = cn(
  "hover:border-input hover:bg-transparent",
  "focus-visible:border-input focus-visible:ring-1 focus-visible:ring-ring/25",
);

export default function LoginPage() {
  const router = useRouter();
  const { usuario, carregando, entrar, registrar } = useAuth();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [enviando, setEnviando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const morphTimer = useRef<number | null>(null);

  const textoModo =
    modo === "entrar" ? "Não tem conta? Cadastre sua organização" : "Já tem conta? Entrar";
  const [textoMorph, setTextoMorph] = useState(textoModo);

  useEffect(() => {
    if (morphTimer.current) window.clearTimeout(morphTimer.current);
    setTextoMorph(textoModo);
  }, [textoModo]);

  useEffect(() => {
    if (!carregando && usuario) router.replace("/dashboard");
  }, [carregando, usuario, router]);

  function baguncarMorph() {
    if (morphTimer.current) window.clearTimeout(morphTimer.current);
    // some e volta o mesmo texto: blur out → blur in, sem trocar letras de lugar
    setTextoMorph("");
    morphTimer.current = window.setTimeout(() => {
      setTextoMorph(textoModo);
      morphTimer.current = null;
    }, 160);
  }

  function restaurarMorph() {
    if (morphTimer.current) window.clearTimeout(morphTimer.current);
    setTextoMorph(textoModo);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const senha = String(f.get("senha"));
    setEnviando(true);
    try {
      if (modo === "entrar") {
        await entrar(email, senha);
      } else {
        await registrar({
          organizacao: String(f.get("organizacao")).trim(),
          nome: String(f.get("nome")).trim(),
          email,
          senha,
        });
        toast.success("Conta criada", { description: "Você é o administrador da organização." });
      }
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Effect fade slide className="w-full max-w-sm">
        <Card>
          <CardHeader className="gap-2">
            <div className="flex items-start justify-between gap-2">
              <h1>
                <Logo markClassName="size-11" className="text-xl" />
              </h1>
              <ThemeToggle />
            </div>
            <CardDescription>
              {modo === "entrar" ? "Acesso ao sistema de chamados" : "Cadastro da organização"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form key={modo} onSubmit={enviar} className="grid gap-4">
              {modo === "criar" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="organizacao">Organização</Label>
                    <Input
                      id="organizacao"
                      name="organizacao"
                      required
                      minLength={2}
                      placeholder="Nome da empresa"
                      className={campoLogin}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Seu nome</Label>
                    <Input id="nome" name="nome" required minLength={2} className={campoLogin} />
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="voce@empresa.com"
                  className={campoLogin}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    required
                    minLength={modo === "criar" ? 8 : 1}
                    placeholder={modo === "criar" ? "Mínimo de 8 caracteres" : undefined}
                    className={cn(campoLogin, "pr-9")}
                    autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                  />
                  <AnimateIcon animateOnHover animateOnTap asChild>
                    <button
                      type="button"
                      className="absolute top-1/2 right-1.5 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/25"
                      aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                      aria-pressed={mostrarSenha}
                      onClick={() => setMostrarSenha((v) => !v)}
                    >
                      {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </AnimateIcon>
                </div>
              </div>
              <Button type="submit" disabled={enviando} className="w-full">
                {enviando ? (
                  <LoaderCircle className="size-4" animate />
                ) : modo === "entrar" ? (
                  "Entrar"
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>
            <button
              type="button"
              className="mt-4 grid min-h-5 w-full place-items-center text-sm text-muted-foreground hover:text-foreground"
              onMouseEnter={baguncarMorph}
              onMouseLeave={restaurarMorph}
              onClick={() => {
                restaurarMorph();
                setModo(modo === "entrar" ? "criar" : "entrar");
              }}
            >
              <MorphingText text={textoMorph} />
            </button>
          </CardContent>
        </Card>
      </Effect>
    </div>
  );
}
