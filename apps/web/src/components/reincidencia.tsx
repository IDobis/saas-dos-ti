"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { CATEGORIA_LABEL, type Categoria } from "@/lib/chamados";
import { cn } from "@/lib/utils";

export type CausaReabertura = "VOLTOU_A_FALHAR" | "SOLUCAO_INCOMPLETA" | "USUARIO_NAO_VALIDOU";

export const CAUSA_LABEL: Record<CausaReabertura, string> = {
  VOLTOU_A_FALHAR: "Voltou a falhar",
  SOLUCAO_INCOMPLETA: "Solução incompleta",
  USUARIO_NAO_VALIDOU: "Usuário não validou",
};

interface Linha {
  reaberturas: number;
  reabertos: number;
  resolvidos: number;
  /** % dos chamados resolvidos que foram reabertos. */
  taxa: number;
}

interface Reincidencia {
  total: number;
  porCausa: { causa: CausaReabertura; total: number }[];
  porCategoria: (Linha & { categoria: Categoria })[];
  porTecnico: (Linha & { tecnicoId: string; nome: string })[];
}

/** Card do painel: taxa de reabertura por categoria e por técnico. */
export function IndicadorReincidencia({ versao = 0 }: { versao?: number }) {
  const [dados, setDados] = useState<Reincidencia | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    api<Reincidencia>("/reincidencia")
      .then((d) => {
        setDados(d);
        setErro(false);
      })
      .catch(() => setErro(true));
  }, [versao]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reincidência</CardTitle>
        {dados && dados.total > 0 && (
          <div data-slot="card-action" className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {dados.porCausa.map((c) => (
              <span key={c.causa}>
                {CAUSA_LABEL[c.causa]}: <span className="font-medium text-foreground tabular-nums">{c.total}</span>
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {erro ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Não foi possível carregar.</p>
        ) : !dados ? (
          <div className="grid gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : dados.total === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum chamado reaberto até agora.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Tabela
              titulo="Por categoria"
              linhas={dados.porCategoria.map((l) => ({ chave: l.categoria, nome: CATEGORIA_LABEL[l.categoria], ...l }))}
            />
            <Tabela
              titulo="Por técnico"
              linhas={dados.porTecnico.map((l) => ({ chave: l.tecnicoId, nome: l.nome, ...l }))}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Tabela({ titulo, linhas }: { titulo: string; linhas: (Linha & { chave: string; nome: string })[] }) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{titulo}</p>
      {linhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="grid gap-2.5 text-sm">
          {linhas.map((l) => (
            <li key={l.chave} className="grid gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">{l.nome}</span>
                <span
                  className="shrink-0 tabular-nums text-muted-foreground"
                  title={`${l.reabertos} de ${l.resolvidos} chamados resolvidos foram reabertos (${l.reaberturas} reaberturas)`}
                >
                  <span className={cn("font-medium text-foreground", l.taxa >= 20 && "text-rose-600 dark:text-rose-400")}>
                    {l.taxa}%
                  </span>{" "}
                  · {l.reabertos}/{l.resolvidos}
                </span>
              </div>
              <span className="block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span
                  className={cn("block h-full rounded-full", l.taxa >= 20 ? "bg-rose-500" : "bg-amber-400")}
                  style={{ width: `${l.taxa}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
