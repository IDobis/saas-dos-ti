"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { usuario, carregando, entrar, registrar } = useAuth();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!carregando && usuario) router.replace("/dashboard");
  }, [carregando, usuario, router]);

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
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1>
            <Logo markClassName="size-11" className="text-xl" />
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {modo === "entrar" ? "Acesso ao sistema de chamados" : "Cadastro da organização"}
          </p>
        </div>
        <Card>
          <CardContent>
            <form key={modo} onSubmit={enviar} className="grid gap-4">
              {modo === "criar" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="organizacao">Organização</Label>
                    <Input id="organizacao" name="organizacao" required minLength={2} placeholder="Nome da empresa" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Seu nome</Label>
                    <Input id="nome" name="nome" required minLength={2} />
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required placeholder="voce@empresa.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  minLength={modo === "criar" ? 8 : 1}
                  placeholder={modo === "criar" ? "Mínimo de 8 caracteres" : undefined}
                />
              </div>
              <Button type="submit" disabled={enviando}>
                {enviando && <Loader2 className="size-4 animate-spin" />}
                {modo === "entrar" ? "Entrar" : "Criar conta"}
              </Button>
            </form>
            <button
              type="button"
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
            >
              {modo === "entrar" ? "Não tem conta? Cadastre sua organização" : "Já tem conta? Entrar"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
