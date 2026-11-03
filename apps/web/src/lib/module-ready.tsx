"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ModuleReadyCtx = {
  ready: boolean;
  modulo: string;
  markReady: () => void;
};

const Ctx = createContext<ModuleReadyCtx | null>(null);

/** A página avisa quando o carregamento inicial terminou; aí o shell libera o Effect. */
export function useModuleReady(pronto: boolean) {
  const ctx = useContext(Ctx);
  useEffect(() => {
    if (pronto) ctx?.markReady();
  }, [pronto, ctx, ctx?.modulo]);
  return ctx?.ready ?? true;
}

export function ModuleReadyProvider({
  modulo,
  children,
}: {
  modulo: string;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
  }, [modulo]);

  // Se a página não sinalizar, libera depois de um tempo para não travar a navegação.
  useEffect(() => {
    if (ready) return;
    const t = window.setTimeout(() => setReady(true), 4000);
    return () => window.clearTimeout(t);
  }, [modulo, ready]);

  const markReady = useCallback(() => {
    setReady(true);
  }, []);

  return <Ctx.Provider value={{ ready, modulo, markReady }}>{children}</Ctx.Provider>;
}

export function useModuleReadyState() {
  return useContext(Ctx);
}
