"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AreaChart, DonutChart, type CustomTooltipProps } from "@tremor/react";
import { Effect, Effects } from "@animate-ui/react/primitives/effects/effect";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { IndicadorReincidencia } from "@/components/reincidencia";
import { ChamadosEmRisco } from "@/components/sla";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useModuleReady, useModuleReadyState } from "@/lib/module-ready";
import {
  CATEGORIA_LABEL,
  STATUS_LABEL,
  formatarDuracao,
  type Categoria,
  type Status,
} from "@/lib/chamados";

const COR_PONTO: Record<string, string> = {
  indigo: "bg-indigo-500 dark:bg-indigo-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  violet: "bg-violet-500 dark:bg-violet-400",
  slate: "bg-slate-500 dark:bg-slate-300",
  blue: "bg-blue-500 dark:bg-blue-400",
  rose: "bg-rose-500 dark:bg-rose-400",
  gray: "bg-muted-foreground",
};

/** Tooltip Animate UI (spring) com cores do tema do app. */
function TooltipGrafico({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const itens = payload.filter((p) => p.type !== "none" && p.value != null);
  if (!itens.length) return null;

  return (
    <Effect
      key={String(label)}
      fade
      zoom={{ initialScale: 0.7 }}
      transition={{ type: "spring", stiffness: 400, damping: 31 }}
      className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
    >
      <p className="mb-1.5 font-medium text-muted-foreground">{label}</p>
      <ul className="grid gap-1">
        {itens.map((item) => (
          <li
            key={String(item.dataKey ?? item.name)}
            className="flex items-center justify-between gap-5"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  COR_PONTO[String(item.color)] ?? "bg-muted-foreground",
                )}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-medium tabular-nums text-foreground">{item.value}</span>
          </li>
        ))}
      </ul>
    </Effect>
  );
}

function BarrasCategoria({
  itens,
  animar,
}: {
  itens: { name: string; value: number }[];
  animar: boolean;
}) {
  const maior = Math.max(...itens.map((item) => item.value), 1);
  return (
    <ul className="grid gap-3">
      {itens.map((item) => (
        <li key={item.name} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate text-foreground">{item.name}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-muted">
            <span
              className={cn("block h-full rounded-full bg-indigo-600 dark:bg-indigo-400", animar && "transition-[width] duration-700")}
              style={{ width: `${Math.max((item.value / maior) * 100, item.value > 0 ? 2 : 0)}%` }}
            />
          </span>
          <span className="text-right tabular-nums text-foreground">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

function usePrefereMenosMovimento() {
  const [reduzido, setReduzido] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduzido(mq.matches);
    const atualizar = () => setReduzido(mq.matches);
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, []);
  return reduzido;
}

const STATUS_ORDEM = ["Aberto", "Em andamento", "Aguardando", "Resolvido", "Fechado", "Cancelado"] as const;
const STATUS_CORES = ["indigo", "amber", "violet", "slate", "blue", "rose"] as const;

interface PontoSemana {
  dia: string;
  Aberto: number;
  "Em andamento": number;
  Aguardando: number;
  Resolvido: number;
  Fechado: number;
  Cancelado: number;
}

interface Painel {
  abertos: number;
  concluidos: number;
  tempoMedioResolucaoMin: number | null;
  percentualNoPrazo: number | null;
  porStatus: { status: Status; total: number }[];
  porCategoria: { categoria: Categoria; total: number }[];
  anos: number[];
  ano: number;
  semana: PontoSemana[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { ehEquipe } = useAuth();
  const semAnimacao = usePrefereMenosMovimento();
  const moduloPronto = useModuleReadyState()?.ready ?? false;
  const [painel, setPainel] = useState<Painel | null>(null);
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [desenhar, setDesenhar] = useState(false);
  const [versaoDemo, setVersaoDemo] = useState(0);
  useModuleReady(!!painel);

  useEffect(() => {
    const atualizar = () => setVersaoDemo((v) => v + 1);
    window.addEventListener("demo-alterada", atualizar);
    return () => window.removeEventListener("demo-alterada", atualizar);
  }, []);

  useEffect(() => {
    if (!ehEquipe) {
      router.replace("/chamados"); // RN09: painel é da equipe
      return;
    }
    setDesenhar(false);
    api<Painel>("/dashboard", { query: { ano } })
      .then(setPainel)
      .catch((e: Error) => toast.error(e.message));
  }, [ehEquipe, router, versaoDemo, ano]);

  // Gráficos só depois do Effect do módulo (evita briga com blur/scale).
  useEffect(() => {
    if (!painel || !moduloPronto) return;
    if (semAnimacao) {
      setDesenhar(true);
      return;
    }
    const t = window.setTimeout(() => setDesenhar(true), 480);
    return () => window.clearTimeout(t);
  }, [painel, moduloPronto, semAnimacao]);

  if (!painel) {
    return null;
  }

  const linhas = STATUS_ORDEM.filter((nome) => painel.porStatus.some((s) => STATUS_LABEL[s.status] === nome));
  const cores = STATUS_CORES.filter((_, i) => linhas.includes(STATUS_ORDEM[i]));
  const kpis = [
    { titulo: "Chamados abertos", valor: String(painel.abertos) },
    { titulo: "Concluídos", valor: String(painel.concluidos) },
    { titulo: "Tempo médio de resolução", valor: formatarDuracao(painel.tempoMedioResolucaoMin) },
    { titulo: "Dentro do prazo", valor: painel.percentualNoPrazo === null ? "—" : `${painel.percentualNoPrazo}%` },
  ];
  const porStatus = STATUS_ORDEM.flatMap((nome) => {
    const item = painel.porStatus.find((s) => STATUS_LABEL[s.status] === nome);
    return item ? [{ nome, total: item.total }] : [];
  });
  const porCategoria = painel.porCategoria.map((c) => ({ name: CATEGORIA_LABEL[c.categoria], value: c.total }));
  const porCategoriaVisivel = desenhar || semAnimacao ? porCategoria : porCategoria.map((c) => ({ ...c, value: 0 }));

  return (
    <>
      <PageHeader titulo="Painel" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Effects
          holdDelay={semAnimacao ? 0 : 90}
          fade
          slide={semAnimacao ? false : { direction: "right", offset: 32 }}
        >
          {kpis.map(({ titulo, valor }) => (
            <Card key={titulo}>
              <CardContent>
                <p className="text-sm text-muted-foreground">{titulo}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{valor}</p>
              </CardContent>
            </Card>
          ))}
        </Effects>
      </div>

      <div className="mt-4">
        <ChamadosEmRisco versao={versaoDemo} />
      </div>

      <div className="mt-4">
        <IndicadorReincidencia versao={versaoDemo} />
      </div>

      <div className="painel-graficos mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Por mês de abertura</CardTitle>
            <div data-slot="card-action" className="flex flex-wrap gap-1">
              {painel.anos.map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setAno(String(valor))}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs",
                    String(valor) === ano ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {valor}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {desenhar || semAnimacao ? (
              <div className={cn("h-72", !semAnimacao && "grafico-reveal-ltr")}>
                <AreaChart
                  key={`area-${ano}-${versaoDemo}`}
                  className="h-72"
                  data={painel.semana}
                  index="dia"
                  categories={linhas}
                  colors={[...cores]}
                  yAxisWidth={32}
                  allowDecimals={false}
                  showAnimation={false}
                  customTooltip={TooltipGrafico}
                />
              </div>
            ) : (
              <div className="h-72" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por status</CardTitle>
          </CardHeader>
          <CardContent>
            {porStatus.length && (desenhar || semAnimacao) ? (
              <DonutChart
                key={`rosca-${ano}-${versaoDemo}`}
                className="h-56"
                data={porStatus}
                category="total"
                index="nome"
                colors={[...cores]}
                showAnimation={!semAnimacao}
                animationDuration={1600}
                customTooltip={TooltipGrafico}
              />
            ) : porStatus.length ? (
              <div className="h-56" />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">Sem chamados ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {porCategoria.length ? (
              <BarrasCategoria itens={porCategoriaVisivel} animar={!semAnimacao} />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Sem chamados ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
