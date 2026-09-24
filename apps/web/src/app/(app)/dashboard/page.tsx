"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AreaChart, BarList, DonutChart } from "@tremor/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Inbox, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { listItem } from "@/components/motion";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CATEGORIA_LABEL,
  STATUS_LABEL,
  formatarDuracao,
  type Categoria,
  type Status,
} from "@/lib/chamados";

interface Painel {
  abertos: number;
  concluidos: number;
  tempoMedioResolucaoMin: number | null;
  percentualNoPrazo: number | null;
  porStatus: { status: Status; total: number }[];
  porCategoria: { categoria: Categoria; total: number }[];
  semana: { dia: string; Abertos: number; Resolvidos: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { ehEquipe } = useAuth();
  const [painel, setPainel] = useState<Painel | null>(null);

  useEffect(() => {
    if (!ehEquipe) {
      router.replace("/chamados"); // RN09: painel é da equipe
      return;
    }
    api<Painel>("/dashboard")
      .then(setPainel)
      .catch((e: Error) => toast.error(e.message));
  }, [ehEquipe, router]);

  if (!painel) {
    return (
      <>
        <PageHeader titulo="Painel" descricao="Visão geral do atendimento." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-4 h-80 rounded-xl" />
      </>
    );
  }

  const kpis = [
    { titulo: "Chamados abertos", valor: String(painel.abertos), icon: Inbox, cor: "text-blue-500 bg-blue-500/10" },
    { titulo: "Concluídos", valor: String(painel.concluidos), icon: CheckCircle2, cor: "text-emerald-500 bg-emerald-500/10" },
    { titulo: "Tempo médio de resolução", valor: formatarDuracao(painel.tempoMedioResolucaoMin), icon: Timer, cor: "text-violet-500 bg-violet-500/10" },
    { titulo: "Dentro do prazo", valor: painel.percentualNoPrazo === null ? "—" : `${painel.percentualNoPrazo}%`, icon: Clock, cor: "text-amber-500 bg-amber-500/10" },
  ];
  const porStatus = painel.porStatus.map((s) => ({ nome: STATUS_LABEL[s.status], total: s.total }));
  const porCategoria = painel.porCategoria.map((c) => ({ name: CATEGORIA_LABEL[c.categoria], value: c.total }));

  return (
    <>
      <PageHeader titulo="Painel" descricao="Visão geral do atendimento." />

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.08 }}
      >
        {kpis.map(({ titulo, valor, icon: Icon, cor }) => (
          <motion.div key={titulo} variants={listItem} whileHover={{ y: -3 }}>
            <Card>
              <CardContent className="flex items-center gap-4">
                <span className={`flex size-11 items-center justify-center rounded-xl ${cor}`}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{titulo}</p>
                  <p className="text-2xl font-semibold">{valor}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-4 grid gap-4 lg:grid-cols-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
      >
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              className="h-72"
              data={painel.semana}
              index="dia"
              categories={["Abertos", "Resolvidos"]}
              colors={["indigo", "emerald"]}
              yAxisWidth={32}
              allowDecimals={false}
              showAnimation
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por status</CardTitle>
          </CardHeader>
          <CardContent>
            {porStatus.length ? (
              <DonutChart
                className="h-56"
                data={porStatus}
                category="total"
                index="nome"
                colors={["blue", "violet", "amber", "emerald", "slate", "rose"]}
                showAnimation
              />
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
              <BarList data={porCategoria} color="indigo" />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Sem chamados ainda.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
