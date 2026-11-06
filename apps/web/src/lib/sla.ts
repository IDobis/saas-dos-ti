import { useEffect, useState } from "react";
import type { Chamado } from "@/lib/chamados";

/**
 * Monitor de SLA (RF09) — só leitura do prazoResolucao que a API já grava.
 * Nada aqui altera dados; é cálculo no navegador.
 */

export type EstadoSla =
  | "NO_PRAZO" // em aberto, com folga
  | "PERTO" // em aberto, restando 25% ou menos do prazo
  | "ESTOURADO" // em aberto, prazo já passou
  | "CUMPRIDO" // resolvido dentro do prazo
  | "VIOLADO" // resolvido depois do prazo
  | "SEM_PRAZO"; // sem SLA cadastrado ou chamado cancelado

/** Fração do prazo total abaixo da qual o chamado fica "perto" de estourar. */
export const LIMITE_PERTO = 0.25;

export const SLA_LABEL: Record<EstadoSla, string> = {
  NO_PRAZO: "No prazo",
  PERTO: "Perto do prazo",
  ESTOURADO: "Estourado",
  CUMPRIDO: "Cumprido",
  VIOLADO: "Fora do prazo",
  SEM_PRAZO: "Sem SLA",
};

export const SLA_PONTO: Record<EstadoSla, string> = {
  NO_PRAZO: "bg-emerald-500",
  PERTO: "bg-amber-400",
  ESTOURADO: "bg-rose-500",
  CUMPRIDO: "bg-emerald-500/50",
  VIOLADO: "bg-rose-500/50",
  SEM_PRAZO: "bg-neutral-300 dark:bg-neutral-600",
};

/** Ordem de urgência (para ordenar a coluna SLA e o bloco "em risco"). */
export const SLA_ORDEM: Record<EstadoSla, number> = {
  ESTOURADO: 0,
  PERTO: 1,
  NO_PRAZO: 2,
  VIOLADO: 3,
  CUMPRIDO: 4,
  SEM_PRAZO: 5,
};

type ChamadoSla = Pick<Chamado, "status" | "abertoEm" | "resolvidoEm" | "prazoResolucao">;

export interface SituacaoSla {
  estado: EstadoSla;
  /** ms até o prazo (negativo = atrasado). null quando não há prazo. */
  restanteMs: number | null;
  /** 0..1 do prazo já consumido (só para chamados em aberto). */
  consumido: number | null;
}

export function situacaoSla(c: ChamadoSla, agora: number = Date.now()): SituacaoSla {
  if (!c.prazoResolucao || c.status === "CANCELADO") {
    return { estado: "SEM_PRAZO", restanteMs: null, consumido: null };
  }
  const prazo = new Date(c.prazoResolucao).getTime();

  // Já resolvido: compara a data de resolução com o prazo (mesma regra do painel)
  if (c.resolvidoEm) {
    const resolvido = new Date(c.resolvidoEm).getTime();
    return { estado: resolvido <= prazo ? "CUMPRIDO" : "VIOLADO", restanteMs: prazo - resolvido, consumido: null };
  }

  const inicio = new Date(c.abertoEm).getTime();
  const total = Math.max(prazo - inicio, 1);
  const restanteMs = prazo - agora;
  const consumido = Math.min(Math.max((agora - inicio) / total, 0), 1);

  if (restanteMs <= 0) return { estado: "ESTOURADO", restanteMs, consumido: 1 };
  if (restanteMs / total <= LIMITE_PERTO) return { estado: "PERTO", restanteMs, consumido };
  return { estado: "NO_PRAZO", restanteMs, consumido };
}

/** Chamado ainda conta para o monitor (aberto e com prazo). */
export function emRisco(c: ChamadoSla, agora?: number) {
  const { estado } = situacaoSla(c, agora);
  return estado === "PERTO" || estado === "ESTOURADO";
}

/** "2d 3h", "4h 12min", "8min 05s" — sempre em valor absoluto. */
export function formatarRestante(ms: number, comSegundos = false) {
  const s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  return comSegundos ? `${m}min ${String(seg).padStart(2, "0")}s` : `${m}min`;
}

/** Relógio que re-renderiza o componente a cada `intervaloMs`. */
export function useAgora(intervaloMs = 60_000) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => window.clearInterval(t);
  }, [intervaloMs]);
  return agora;
}
