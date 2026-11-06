"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Marcador } from "@/components/marcador";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { PRIORIDADE_LABEL, PRIORIDADE_PONTO, type Chamado } from "@/lib/chamados";
import {
  SLA_LABEL,
  SLA_ORDEM,
  SLA_PONTO,
  emRisco,
  formatarRestante,
  situacaoSla,
  useAgora,
} from "@/lib/sla";
import { cn } from "@/lib/utils";

type ChamadoSla = Pick<Chamado, "status" | "abertoEm" | "resolvidoEm" | "prazoResolucao">;

/** Semáforo para a lista: ponto colorido + texto curto. */
export function SemaforoSla({ chamado, agora }: { chamado: ChamadoSla; agora?: number }) {
  const { estado, restanteMs } = situacaoSla(chamado, agora);
  const aberto = estado === "NO_PRAZO" || estado === "PERTO" || estado === "ESTOURADO";
  return (
    <span title={SLA_LABEL[estado]}>
      <Marcador cor={SLA_PONTO[estado]}>
        <span className={cn(estado === "ESTOURADO" && "font-medium text-rose-600 dark:text-rose-400")}>
          {aberto && restanteMs !== null
            ? restanteMs > 0
              ? formatarRestante(restanteMs)
              : `-${formatarRestante(restanteMs)}`
            : SLA_LABEL[estado]}
        </span>
      </Marcador>
    </span>
  );
}

/** Bloco do detalhe: contagem regressiva ao vivo + barra de consumo do prazo. */
export function ContagemSla({ chamado }: { chamado: ChamadoSla }) {
  const agora = useAgora(1000);
  const { estado, restanteMs, consumido } = situacaoSla(chamado, agora);

  let texto: string;
  if (restanteMs === null) texto = "—";
  else if (estado === "CUMPRIDO") texto = `Resolvido ${formatarRestante(restanteMs)} antes do prazo`;
  else if (estado === "VIOLADO") texto = `Resolvido ${formatarRestante(restanteMs)} após o prazo`;
  else if (estado === "ESTOURADO") texto = `Atrasado há ${formatarRestante(restanteMs, true)}`;
  else texto = `Faltam ${formatarRestante(restanteMs, true)}`;

  return (
    <div>
      <p className="text-xs text-muted-foreground">SLA</p>
      <Marcador cor={SLA_PONTO[estado]}>{SLA_LABEL[estado]}</Marcador>
      <p
        className={cn(
          "mt-1 tabular-nums",
          estado === "ESTOURADO" && "font-medium text-rose-600 dark:text-rose-400",
          estado === "PERTO" && "font-medium text-amber-600 dark:text-amber-400",
        )}
      >
        {texto}
      </p>
      {consumido !== null && (
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span className={cn("block h-full rounded-full", SLA_PONTO[estado])} style={{ width: `${consumido * 100}%` }} />
        </span>
      )}
    </div>
  );
}

/** Card do painel: chamados abertos perto do prazo ou estourados. */
export function ChamadosEmRisco({ versao = 0, limite = 8 }: { versao?: number; limite?: number }) {
  const agora = useAgora(60_000);
  const [lista, setLista] = useState<Chamado[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    api<Chamado[]>("/chamados")
      .then((d) => {
        setLista(d);
        setErro(false);
      })
      .catch(() => setErro(true));
  }, [versao]);

  const risco = (lista ?? [])
    .filter((c) => emRisco(c, agora))
    .map((c) => ({ c, s: situacaoSla(c, agora) }))
    .sort((a, b) => SLA_ORDEM[a.s.estado] - SLA_ORDEM[b.s.estado] || (a.s.restanteMs ?? 0) - (b.s.restanteMs ?? 0));
  const estourados = risco.filter((r) => r.s.estado === "ESTOURADO").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Em risco de SLA</CardTitle>
        {lista && risco.length > 0 && (
          <div data-slot="card-action" className="flex gap-3 text-xs text-muted-foreground">
            <Marcador cor={SLA_PONTO.ESTOURADO}>{estourados} estourado{estourados === 1 ? "" : "s"}</Marcador>
            <Marcador cor={SLA_PONTO.PERTO}>{risco.length - estourados} perto</Marcador>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {erro ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Não foi possível carregar.</p>
        ) : !lista ? (
          <div className="grid gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : risco.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum chamado em risco. Tudo dentro do prazo.</p>
        ) : (
          <ul className="divide-y text-sm">
            {risco.slice(0, limite).map(({ c, s }) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <span className="w-12 shrink-0 font-mono text-muted-foreground">#{c.numero}</span>
                <Link href={`/chamados/${c.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                  {c.titulo}
                </Link>
                <span className="hidden shrink-0 sm:inline">
                  <Marcador cor={PRIORIDADE_PONTO[c.prioridade]}>{PRIORIDADE_LABEL[c.prioridade]}</Marcador>
                </span>
                <span className="hidden w-32 shrink-0 truncate text-muted-foreground md:inline">
                  {c.tecnico?.nome ?? "Sem técnico"}
                </span>
                <span className="w-28 shrink-0 text-right">
                  <SemaforoSla chamado={c} agora={agora} />
                </span>
              </li>
            ))}
            {risco.length > limite && (
              <li className="pt-2.5 text-xs text-muted-foreground">
                + {risco.length - limite} outro{risco.length - limite === 1 ? "" : "s"} —{" "}
                <Link href="/chamados" className="underline">ver lista</Link>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
