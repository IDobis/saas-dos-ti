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

export const STATUS_PONTO: Record<Status, string> = {
  ABERTO: "bg-slate-400",
  EM_ANDAMENTO: "bg-indigo-400",
  AGUARDANDO: "bg-amber-400",
  RESOLVIDO: "bg-emerald-500",
  FECHADO: "bg-neutral-400",
  CANCELADO: "bg-rose-400",
};

export const PRIORIDADE_PONTO: Record<Prioridade, string> = {
  BAIXA: "bg-neutral-400",
  MEDIA: "bg-sky-400",
  ALTA: "bg-amber-400",
  CRITICA: "bg-rose-400",
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
