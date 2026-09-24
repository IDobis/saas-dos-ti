"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { LifeBuoy, Loader2 } from "lucide-react";
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
        toast.success("Bem-vindo de volta!");
      } else {
        await registrar({
          organizacao: String(f.get("organizacao")).trim(),
          nome: String(f.get("nome")).trim(),
          email,
          senha,
        });
        toast.success("Conta criada!", { description: "Você é o administrador da sua organização." });
      }
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500/10 via-background to-violet-500/10 p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="mb-6 flex flex-col items-center gap-3">
          <motion.span
            className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <LifeBuoy className="size-7" />
          </motion.span>
          <h1 className="text-2xl font-semibold tracking-tight">SaaS dos TI</h1>
          <p className="text-sm text-muted-foreground">
            {modo === "entrar" ? "Entre para abrir e acompanhar chamados" : "Crie a conta da sua organização"}
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
      </motion.div>
    </div>
  );
}
