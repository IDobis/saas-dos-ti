"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NativeSelect } from "@/components/native-select";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  PRIORIDADE_LABEL,
  PRIORIDADE_STYLE,
  STATUS_LABEL,
  STATUS_STYLE,
  formatarData,
  type Chamado,
  type Prioridade,
  type Status,
} from "@/lib/chamados";

type Coluna = "numero" | "titulo" | "solicitante" | "tecnico" | "prioridade" | "status" | "aberto";

const PRIORIDADE_ORDEM: Record<Prioridade, number> = { BAIXA: 0, MEDIA: 1, ALTA: 2, CRITICA: 3 };
const STATUS_ORDEM: Record<Status, number> = {
  ABERTO: 0,
  EM_ANDAMENTO: 1,
  AGUARDANDO: 2,
  RESOLVIDO: 3,
  FECHADO: 4,
  CANCELADO: 5,
};

function valorOrdenacao(c: Chamado, coluna: Coluna): string | number {
  if (coluna === "numero") return c.numero;
  if (coluna === "titulo") return c.titulo;
  if (coluna === "solicitante") return c.solicitante.nome;
  if (coluna === "tecnico") return c.tecnico?.nome ?? "Sem técnico";
  if (coluna === "prioridade") return PRIORIDADE_ORDEM[c.prioridade];
  if (coluna === "status") return STATUS_ORDEM[c.status];
  return new Date(c.abertoEm).getTime();
}

export default function ChamadosPage() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [coluna, setColuna] = useState<Coluna>("aberto");
  const [direcao, setDirecao] = useState<"asc" | "desc">("desc");
  const [lista, setLista] = useState<Chamado[] | null>(null);
  const [versaoDemo, setVersaoDemo] = useState(0);

  useEffect(() => {
    const atualizar = () => setVersaoDemo((v) => v + 1);
    window.addEventListener("demo-alterada", atualizar);
    return () => window.removeEventListener("demo-alterada", atualizar);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api<Chamado[]>("/chamados", {
        query: { busca: busca.trim() || undefined, status: status || undefined, prioridade: prioridade || undefined },
      })
        .then(setLista)
        .catch((e: Error) => toast.error(e.message));
    }, busca ? 300 : 0);
    return () => clearTimeout(t);
  }, [busca, status, prioridade, versaoDemo]);

  const ordenada = useMemo(() => {
    if (!lista) return null;
    const fator = direcao === "asc" ? 1 : -1;
    return [...lista].sort((a, b) => {
      const va = valorOrdenacao(a, coluna);
      const vb = valorOrdenacao(b, coluna);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * fator;
      return String(va).localeCompare(String(vb), "pt-BR") * fator;
    });
  }, [lista, coluna, direcao]);

  function ordenar(proxima: Coluna) {
    if (coluna === proxima) setDirecao((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setColuna(proxima);
      setDirecao(proxima === "aberto" ? "desc" : "asc");
    }
  }

  return (
    <>
      <PageHeader
        titulo="Chamados"
        descricao="Busca por título, descrição ou número."
        acao={
          <Link href="/chamados/novo" className={cn(buttonVariants())}>
            <Plus className="size-4" /> Novo chamado
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por título, descrição ou nº"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </NativeSelect>
        <NativeSelect value={prioridade} onChange={(e) => setPrioridade(e.target.value)} aria-label="Prioridade">
          <option value="">Todas as prioridades</option>
          {Object.entries(PRIORIDADE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </NativeSelect>
      </div>

      <Card className="overflow-hidden p-0">
        {ordenada === null ? (
          <div className="grid gap-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                  <tr>
                    <Cabecalho coluna="numero" ativa={coluna} direcao={direcao} onClick={ordenar}>Nº</Cabecalho>
                    <Cabecalho coluna="titulo" ativa={coluna} direcao={direcao} onClick={ordenar}>Título</Cabecalho>
                    <Cabecalho coluna="solicitante" ativa={coluna} direcao={direcao} onClick={ordenar} className="hidden md:table-cell">Solicitante</Cabecalho>
                    <Cabecalho coluna="tecnico" ativa={coluna} direcao={direcao} onClick={ordenar} className="hidden lg:table-cell">Técnico</Cabecalho>
                    <Cabecalho coluna="prioridade" ativa={coluna} direcao={direcao} onClick={ordenar}>Prioridade</Cabecalho>
                    <Cabecalho coluna="status" ativa={coluna} direcao={direcao} onClick={ordenar}>Status</Cabecalho>
                    <Cabecalho coluna="aberto" ativa={coluna} direcao={direcao} onClick={ordenar} className="hidden sm:table-cell">Aberto</Cabecalho>
                  </tr>
                </thead>
                <tbody>
                    {ordenada.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          <Link href={`/chamados/${c.id}`}>#{c.numero}</Link>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/chamados/${c.id}`} className="hover:text-primary hover:underline dark:hover:text-brand-amber">
                            {c.titulo}
                          </Link>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">{c.solicitante.nome}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                          {c.tecnico?.nome ?? "Sem técnico"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={PRIORIDADE_STYLE[c.prioridade]}>{PRIORIDADE_LABEL[c.prioridade]}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_STYLE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {formatarData(c.abertoEm)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {ordenada.length === 0 && (
              <p className="p-10 text-center text-sm text-muted-foreground">Nenhum chamado encontrado.</p>
            )}
          </>
        )}
      </Card>
    </>
  );
}

function Cabecalho({
  coluna,
  ativa,
  direcao,
  onClick,
  className,
  children,
}: {
  coluna: Coluna;
  ativa: Coluna;
  direcao: "asc" | "desc";
  onClick: (coluna: Coluna) => void;
  className?: string;
  children: ReactNode;
}) {
  const selecionada = ativa === coluna;
  return (
    <th className={cn("px-4 py-3", className)}>
      <button
        type="button"
        onClick={() => onClick(coluna)}
        className="inline-flex items-center gap-1 rounded-md hover:text-foreground"
        aria-pressed={selecionada}
      >
        {children}
        {selecionada && (direcao === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
      </button>
    </th>
  );
}
