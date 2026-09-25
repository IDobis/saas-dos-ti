"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AreaChart, BarList, DonutChart } from "@tremor/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CATEGORIA_LABEL,
  STATUS_LABEL,
  formatarDuracao,
  type Categoria,
  type Status,
} from "@/lib/chamados";

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
  const [painel, setPainel] = useState<Painel | null>(null);
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [desenhar, setDesenhar] = useState(false);
  const [versaoDemo, setVersaoDemo] = useState(0);

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

  useEffect(() => {
    if (!painel || semAnimacao) return;
    const id = requestAnimationFrame(() => setDesenhar(true));
    return () => cancelAnimationFrame(id);
  }, [painel, semAnimacao]);

  if (!painel) {
    return (
      <>
        <PageHeader titulo="Painel" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-4 h-80 rounded-xl" />
      </>
    );
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
        {kpis.map(({ titulo, valor }) => (
          <Card key={titulo}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{titulo}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{valor}</p>
            </CardContent>
          </Card>
        ))}
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
              <AreaChart
                key="area"
                className="h-72"
                data={painel.semana}
                index="dia"
                categories={linhas}
                colors={[...cores]}
                yAxisWidth={32}
                allowDecimals={false}
                showAnimation={!semAnimacao}
                animationDuration={1200}
              />
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
                key="rosca"
                className="h-56"
                data={porStatus}
                category="total"
                index="nome"
                colors={[...cores]}
                showAnimation={!semAnimacao}
                animationDuration={1200}
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
              <BarList data={porCategoriaVisivel} color="indigo" showAnimation={!semAnimacao} />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Sem chamados ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
