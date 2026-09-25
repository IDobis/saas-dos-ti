export type Status = "ABERTO" | "EM_ANDAMENTO" | "AGUARDANDO" | "RESOLVIDO" | "FECHADO" | "CANCELADO";
export type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
export type Categoria = "HARDWARE" | "SOFTWARE" | "REDE" | "ACESSO" | "OUTROS";

interface Ref {
  id: string;
  nome: string;
}

export interface Chamado {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  prioridade: Prioridade;
  status: Status;
  abertoEm: string;
  resolvidoEm: string | null;
  prazoResolucao: string | null;
  solicitante: Ref;
  tecnico: Ref | null;
  setor: Ref;
  equipamento: Ref | null;
}

export interface Historico {
  id: string;
  tipo: "CRIACAO" | "MUDANCA_STATUS" | "ATRIBUICAO" | "FOLLOWUP" | "REABERTURA" | "CANCELAMENTO";
  conteudo: string | null;
  interno: boolean;
  criadoEm: string;
  autor: { id: string; nome: string; perfil: string };
}

export interface ChamadoDetalhe extends Chamado {
  historico: Historico[];
  avaliacao: { nota: number; comentario: string | null } | null;
}

export interface Setor {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface UsuarioLista {
  id: string;
  nome: string;
  email: string;
  perfil: "SOLICITANTE" | "TECNICO" | "ADMIN";
  especialidade: string | null;
  ativo: boolean;
  setor: Ref | null;
}

export const STATUS_LABEL: Record<Status, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO: "Aguardando",
  RESOLVIDO: "Resolvido",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  HARDWARE: "Hardware",
  SOFTWARE: "Software",
  REDE: "Rede",
  ACESSO: "Acesso",
  OUTROS: "Outros",
};

export const STATUS_STYLE: Record<Status, string> = {
  ABERTO: "bg-slate-200 text-slate-900! dark:bg-indigo-500/15 dark:text-indigo-300!",
  EM_ANDAMENTO: "bg-slate-300 text-slate-950! dark:bg-violet-500/15 dark:text-violet-300!",
  AGUARDANDO: "bg-amber-100 text-amber-950! dark:bg-amber-500/15 dark:text-amber-300!",
  RESOLVIDO: "bg-emerald-100 text-emerald-950! dark:bg-emerald-500/15 dark:text-emerald-300!",
  FECHADO: "bg-neutral-200 text-neutral-900! dark:bg-slate-500/15 dark:text-slate-300!",
  CANCELADO: "bg-rose-100 text-rose-950! dark:bg-rose-500/15 dark:text-rose-300!",
};

export const PRIORIDADE_STYLE: Record<Prioridade, string> = {
  BAIXA: "bg-neutral-200 text-neutral-900! dark:bg-slate-500/15 dark:text-slate-300!",
  MEDIA: "bg-slate-200 text-slate-900! dark:bg-indigo-500/15 dark:text-indigo-300!",
  ALTA: "bg-amber-100 text-amber-950! dark:bg-amber-500/15 dark:text-amber-300!",
  CRITICA: "bg-rose-100 text-rose-950! dark:bg-rose-500/15 dark:text-rose-300!",
};

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarDuracao(min: number | null) {
  if (min === null) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${min % 60}min`;
}
