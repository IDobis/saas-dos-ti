"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "@/components/animate-ui/icons/loader-circle";
import { Marcador } from "@/components/marcador";
import { PageHeader } from "@/components/page-header";
import { SemaforoSla } from "@/components/sla";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import {
  PRIORIDADE_LABEL,
  PRIORIDADE_PONTO,
  STATUS_LABEL,
  STATUS_PONTO,
  formatarData,
  type Chamado,
} from "@/lib/chamados";
import { useModuleReady } from "@/lib/module-ready";
import { useAgora } from "@/lib/sla";

interface Fila {
  /** Já vem ordenada pela API: prazo de SLA, depois prioridade. */
  meus: Chamado[];
  semDono: number;
}

export default function FilaPage() {
  const router = useRouter();
  const [fila, setFila] = useState<Fila | null>(null);
  const [pegando, setPegando] = useState(false);
  const agora = useAgora(60_000);
  useModuleReady(!!fila);

  const carregar = useCallback(
    () =>
      api<Fila>("/chamados/fila")
        .then(setFila)
        .catch((e: Error) => {
          toast.error(e.message);
          setFila({ meus: [], semDono: 0 });
        }),
    [],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function pegarProximo() {
    setPegando(true);
    try {
      const c = await api<Chamado>("/chamados/pegar-proximo", { method: "POST" });
      toast.success(`Você pegou o #${c.numero}`);
      router.push(`/chamados/${c.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível pegar um chamado.");
      await carregar();
      setPegando(false);
    }
  }

  const semDono = fila?.semDono ?? 0;

  return (
    <>
      <PageHeader
        titulo="Minha vez"
        descricao="Seus chamados em aberto, do mais urgente ao menos urgente (prazo de SLA e prioridade)."
        acao={
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums">
              {semDono} sem dono na fila
            </span>
            <Button onClick={pegarProximo} disabled={pegando || semDono === 0}>
              {pegando && <LoaderCircle className="size-4" animate />}
              Pegar próximo
            </Button>
          </div>
        }
      />

      <Card className="gap-0 overflow-hidden p-0">
        {fila && fila.meus.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {semDono > 0
              ? "Você não tem chamados em aberto. Use \"Pegar próximo\" para puxar o mais urgente da fila."
              : "Você não tem chamados em aberto e a fila está vazia."}
          </p>
        ) : (
          <ol className="divide-y text-sm">
            {fila?.meus.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <span className="w-12 shrink-0 font-mono text-muted-foreground">#{c.numero}</span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <Link href={`/chamados/${c.id}`} className="truncate font-medium hover:underline">
                    {c.titulo}
                  </Link>
                  <span className="truncate text-xs text-muted-foreground">
                    {c.solicitante.nome} · aberto em {formatarData(c.abertoEm)}
                  </span>
                </span>
                <span className="hidden w-28 shrink-0 sm:inline">
                  <Marcador cor={PRIORIDADE_PONTO[c.prioridade]}>{PRIORIDADE_LABEL[c.prioridade]}</Marcador>
                </span>
                <span className="hidden w-32 shrink-0 md:inline">
                  <Marcador cor={STATUS_PONTO[c.status]}>{STATUS_LABEL[c.status]}</Marcador>
                </span>
                <span className="w-28 shrink-0 text-right">
                  <SemaforoSla chamado={c} agora={agora} />
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  );
}
