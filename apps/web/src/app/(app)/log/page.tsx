"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Paginacao, usePorPagina } from "@/components/paginacao";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatarDataHora } from "@/lib/chamados";
import { useModuleReady } from "@/lib/module-ready";

interface Log {
  id: string;
  acao: string;
  detalhe: string | null;
  criadoEm: string;
  usuario: { nome: string } | null;
}

export default function LogPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [dados, setDados] = useState<{ itens: Log[]; total: number } | null>(null);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = usePorPagina("log-por-pagina");
  useModuleReady(!!dados);

  useEffect(() => {
    if (!usuario) return;
    if (usuario.perfil !== "ADMIN") {
      router.replace("/chamados"); // RN09
      return;
    }
    let atual = true; // resposta antiga não sobrescreve a mais nova
    const t = setTimeout(() => {
      api<{ itens: Log[]; total: number }>("/log", {
        query: { pagina: String(pagina), porPagina: String(porPagina), busca: busca.trim() || undefined },
      })
        .then((d) => {
          if (atual) setDados(d);
        })
        .catch((e: Error) => {
          if (!atual) return;
          toast.error(e.message);
          setDados((d) => d ?? { itens: [], total: 0 });
        });
    }, busca ? 300 : 0);
    return () => {
      atual = false;
      clearTimeout(t);
    };
  }, [usuario, router, pagina, porPagina, busca]);

  return (
    <>
      <PageHeader
        titulo="Log"
        descricao="Todas as ações registradas no sistema, da mais recente para a mais antiga."
        acao={
          <Input
            className="w-64"
            placeholder="Buscar ação, usuário ou chamado"
            aria-label="Buscar no log"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
          />
        }
      />
      <Card className="gap-0 overflow-hidden p-0">
        {dados && dados.itens.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Quando</TableHead>
                <TableHead className="w-48">Usuário</TableHead>
                <TableHead className="w-52">Ação</TableHead>
                <TableHead>Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados?.itens.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground tabular-nums">{formatarDataHora(l.criadoEm)}</TableCell>
                  <TableCell>{l.usuario?.nome ?? "—"}</TableCell>
                  <TableCell className="font-medium">{l.acao}</TableCell>
                  <TableCell className="min-w-64 whitespace-normal break-words text-muted-foreground">
                    {l.detalhe ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {dados && (
        <Paginacao
          rotulo="Registros por página"
          total={dados.total}
          pagina={pagina}
          porPagina={porPagina}
          onPagina={setPagina}
          onPorPagina={setPorPagina}
        />
      )}
    </>
  );
}
