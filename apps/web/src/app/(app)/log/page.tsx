"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
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
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [busca, setBusca] = useState("");
  useModuleReady(!!logs);

  useEffect(() => {
    if (!usuario) return;
    if (usuario.perfil !== "ADMIN") {
      router.replace("/chamados"); // RN09
      return;
    }
    api<Log[]>("/log")
      .then(setLogs)
      .catch((e: Error) => {
        toast.error(e.message);
        setLogs([]);
      });
  }, [usuario, router]);

  const termo = busca.trim().toLowerCase();
  const visiveis = (logs ?? []).filter(
    (l) => !termo || [l.acao, l.detalhe, l.usuario?.nome].some((t) => t?.toLowerCase().includes(termo)),
  );

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
            onChange={(e) => setBusca(e.target.value)}
          />
        }
      />
      <Card className="gap-0 overflow-hidden p-0">
        {logs && visiveis.length === 0 ? (
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
              {visiveis.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground tabular-nums">{formatarDataHora(l.criadoEm)}</TableCell>
                  <TableCell>{l.usuario?.nome ?? "—"}</TableCell>
                  <TableCell className="font-medium">{l.acao}</TableCell>
                  <TableCell className="max-w-0 truncate text-muted-foreground" title={l.detalhe ?? undefined}>
                    {l.detalhe ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
