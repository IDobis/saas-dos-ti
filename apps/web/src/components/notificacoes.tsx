"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { STATUS_LABEL, formatarDataHora, type Status } from "@/lib/chamados";
import { cn } from "@/lib/utils";

interface Notificacao {
  id: string;
  lidaEm: string | null;
  criadoEm: string;
  historico: {
    conteudo: string | null;
    autor: { nome: string };
    chamado: { id: string; numero: number; titulo: string; status: Status };
  };
}

interface Resposta {
  naoLidas: number;
  itens: Notificacao[];
}

function Sino({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  );
}

/** Sino do cabeçalho: menções (@nome) em follow-ups que a pessoa ainda não leu. */
export function SinoNotificacoes() {
  const router = useRouter();
  const [dados, setDados] = useState<Resposta | null>(null);

  const atualizar = useCallback(() => api<Resposta>("/notificacoes").then(setDados).catch(() => {}), []);

  useEffect(() => {
    atualizar();
    // sem WebSocket: confere a cada 30s e quando a aba volta a ter foco
    const t = window.setInterval(atualizar, 30_000);
    window.addEventListener("focus", atualizar);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", atualizar);
    };
  }, [atualizar]);

  async function abrir(n: Notificacao) {
    if (!n.lidaEm) api<Resposta>(`/notificacoes/${n.id}/lida`, { method: "PATCH" }).then(setDados).catch(() => {});
    router.push(`/chamados/${n.historico.chamado.id}`);
  }

  const naoLidas = dados?.naoLidas ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
        aria-label={naoLidas ? `Notificações: ${naoLidas} não lida${naoLidas === 1 ? "" : "s"}` : "Notificações"}
      >
        <Sino className="size-4" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium leading-none text-white tabular-nums">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <span className="text-xs font-medium text-muted-foreground">Menções</span>
          {naoLidas > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              onClick={() => api<Resposta>("/notificacoes/lidas", { method: "PATCH" }).then(setDados).catch(() => {})}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {!dados?.itens.length ? (
          <p className="px-1.5 py-6 text-center text-sm text-muted-foreground">Ninguém mencionou você ainda.</p>
        ) : (
          dados.itens.map((n) => (
            <DropdownMenuItem key={n.id} onClick={() => abrir(n)} className="items-start gap-2 py-2">
              <span
                className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.lidaEm ? "bg-transparent" : "bg-rose-500")}
                aria-hidden="true"
              />
              <span className="grid min-w-0 gap-0.5">
                <span className={cn("truncate", !n.lidaEm && "font-medium")}>
                  {n.historico.autor.nome} mencionou você em #{n.historico.chamado.numero}
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{n.historico.conteudo}</span>
                <span className="text-xs text-muted-foreground">
                  {STATUS_LABEL[n.historico.chamado.status]} · {formatarDataHora(n.criadoEm)}
                </span>
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
