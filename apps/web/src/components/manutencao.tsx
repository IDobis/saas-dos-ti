"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { TriangleAlert } from "@/components/animate-ui/icons/triangle-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatarDataHora } from "@/lib/chamados";

/**
 * Modo manutenção: o bloqueio de escrita é feito pela API (503).
 * Aqui só mostramos o aviso e o controle do admin para entrar/sair.
 */

interface Situacao {
  ativa: boolean;
  motivo: string | null;
  previsao: string | null;
}

const Ctx = createContext<{ situacao: Situacao | null; definir: (s: Situacao) => void } | null>(null);

export function ManutencaoProvider({ children }: { children: React.ReactNode }) {
  const [situacao, setSituacao] = useState<Situacao | null>(null);

  useEffect(() => {
    const atualizar = () => api<Situacao>("/manutencao").then(setSituacao).catch(() => {});
    atualizar();
    // outros usuários percebem a mudança sem recarregar a página
    const t = window.setInterval(atualizar, 30_000);
    return () => window.clearInterval(t);
  }, []);

  return <Ctx.Provider value={{ situacao, definir: setSituacao }}>{children}</Ctx.Provider>;
}

function useManutencao() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useManutencao fora do ManutencaoProvider");
  return ctx;
}

/** Faixa no topo, visível para toda a organização enquanto a manutenção estiver ativa. */
export function BannerManutencao() {
  const { situacao, definir } = useManutencao();
  const { usuario } = useAuth();
  const [saindo, setSaindo] = useState(false);
  if (!situacao?.ativa) return null;

  async function sair() {
    setSaindo(true);
    try {
      definir(await api<Situacao>("/manutencao", { method: "DELETE" }));
      toast.success("Manutenção encerrada.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível encerrar a manutenção.");
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 lg:px-8 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
    >
      <TriangleAlert className="size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        <span className="font-medium">Sistema em manutenção:</span> {situacao.motivo}
        {situacao.previsao && <> · Previsão de retorno: {formatarDataHora(situacao.previsao)}</>}
        <span className="block text-xs opacity-80">Apenas consultas estão liberadas no momento.</span>
      </p>
      {usuario?.perfil === "ADMIN" && (
        <Button size="sm" variant="outline" onClick={sair} disabled={saindo}>
          {saindo ? "Encerrando..." : "Encerrar manutenção"}
        </Button>
      )}
    </div>
  );
}

/** Botão do cabeçalho, só para admin, para colocar a organização em manutenção. */
export function BotaoManutencao() {
  const { situacao, definir } = useManutencao();
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const entrar = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const previsao = String(f.get("previsao") ?? "");
      setEnviando(true);
      try {
        definir(
          await api<Situacao>("/manutencao", {
            method: "POST",
            body: {
              motivo: String(f.get("motivo") ?? ""),
              ...(previsao && { previsao: new Date(previsao).toISOString() }),
            },
          }),
        );
        setAberto(false);
        toast.success("Organização em manutenção.");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Não foi possível entrar em manutenção.");
      } finally {
        setEnviando(false);
      }
    },
    [definir],
  );

  if (usuario?.perfil !== "ADMIN" || !situacao || situacao.ativa) return null;

  return (
    <>
      <Button variant="ghost" onClick={() => setAberto(true)}>
        Manutenção
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={entrar} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Entrar em manutenção</DialogTitle>
              <DialogDescription>
                Toda a organização verá o aviso. Ninguém poderá abrir chamados, mudar status nem cadastrar até você
                encerrar. Consultas e login continuam liberados.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="m-motivo">Motivo</Label>
              <Textarea id="m-motivo" name="motivo" required minLength={3} maxLength={300} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-previsao">Previsão de retorno (opcional)</Label>
              <Input id="m-previsao" name="previsao" type="datetime-local" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Entrando..." : "Entrar em manutenção"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
