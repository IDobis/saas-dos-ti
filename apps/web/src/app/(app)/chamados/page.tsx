"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
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
} from "@/lib/chamados";

export default function ChamadosPage() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [lista, setLista] = useState<Chamado[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api<Chamado[]>("/chamados", {
        query: { busca: busca.trim() || undefined, status: status || undefined, prioridade: prioridade || undefined },
      })
        .then(setLista)
        .catch((e: Error) => toast.error(e.message));
    }, busca ? 300 : 0);
    return () => clearTimeout(t);
  }, [busca, status, prioridade]);

  return (
    <>
      <PageHeader
        titulo="Chamados"
        descricao="Acompanhe e filtre os chamados."
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
        {lista === null ? (
          <div className="grid gap-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nº</th>
                    <th className="px-4 py-3">Título</th>
                    <th className="hidden px-4 py-3 md:table-cell">Solicitante</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Técnico</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Aberto</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {lista.map((c, i) => (
                      <motion.tr
                        key={c.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                        exit={{ opacity: 0 }}
                        className="border-b last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          <Link href={`/chamados/${c.id}`}>#{c.numero}</Link>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/chamados/${c.id}`} className="hover:text-primary hover:underline">
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
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {lista.length === 0 && (
              <p className="p-10 text-center text-sm text-muted-foreground">Nenhum chamado encontrado.</p>
            )}
          </>
        )}
      </Card>
    </>
  );
}
