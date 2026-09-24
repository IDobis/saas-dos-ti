"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore } from "@/lib/api";

export type Perfil = "SOLICITANTE" | "TECNICO" | "ADMIN";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  organizacao?: string;
}

interface AuthCtx {
  usuario: Usuario | null;
  carregando: boolean;
  ehEquipe: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  registrar: (d: { organizacao: string; nome: string; email: string; senha: string }) => Promise<void>;
  sair: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no cliente
      setCarregando(false);
      return;
    }
    api<Usuario>("/auth/me")
      .then(setUsuario)
      .catch(() => tokenStore.clear())
      .finally(() => setCarregando(false));
  }, []);

  const finalizar = useCallback((r: { token: string; usuario: Usuario }) => {
    tokenStore.set(r.token);
    setUsuario(r.usuario);
  }, []);

  const entrar = useCallback(
    async (email: string, senha: string) =>
      finalizar(await api("/auth/login", { method: "POST", body: { email, senha } })),
    [finalizar],
  );

  const registrar = useCallback<AuthCtx["registrar"]>(
    async (d) => finalizar(await api("/auth/registrar", { method: "POST", body: d })),
    [finalizar],
  );

  const sair = useCallback(() => {
    tokenStore.clear();
    setUsuario(null);
    router.replace("/login");
  }, [router]);

  return (
    <Ctx.Provider
      value={{ usuario, carregando, ehEquipe: usuario?.perfil !== "SOLICITANTE" && !!usuario, entrar, registrar, sair }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
