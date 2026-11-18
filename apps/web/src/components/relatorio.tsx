"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SeletorMeses } from "@/components/seletor-meses";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import {
  CATEGORIA_LABEL,
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  formatarDuracao,
  type Categoria,
  type Prioridade,
  type Status,
} from "@/lib/chamados";

/**
 * Relatório do período para a banca e o gestor da TI.
 * A API devolve os números; aqui viram CSV (download direto) ou PDF
 * (página de impressão do navegador, opção "Salvar como PDF", sem biblioteca extra).
 */

interface Relatorio {
  organizacao: string;
  geradoPor: string;
  geradoEm: string;
  de: string;
  ate: string;
  totalAbertos: number;
  porStatus: { status: Status; total: number }[];
  concluidos: number;
  tempoMedioResolucaoMin: number | null;
  percentualNoPrazo: number | null;
  avaliacoes: { total: number; media: number | null; notas: { nota: number; total: number }[] };
  estourados: {
    numero: number;
    titulo: string;
    prioridade: Prioridade;
    categoria: Categoria;
    status: Status;
    prazoResolucao: string;
    resolvidoEm: string | null;
    tecnico: string | null;
    atrasoMin: number;
  }[];
}

const ORDEM_STATUS = Object.keys(STATUS_LABEL) as Status[];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function mesIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeMes(anoMes: string) {
  const [ano, mes] = anoMes.split("-").map(Number);
  return `${MESES[mes - 1]}/${ano}`;
}

const periodo = (r: Relatorio) => (r.de === r.ate ? nomeMes(r.de) : `${nomeMes(r.de)} a ${nomeMes(r.ate)}`);
const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** Linhas de cada bloco do relatório, usadas igualmente pelo CSV e pelo PDF. */
function secoes(r: Relatorio) {
  const status = ORDEM_STATUS.map((s) => [STATUS_LABEL[s], r.porStatus.find((x) => x.status === s)?.total ?? 0]);
  return {
    resumo: [
      ["Chamados abertos no período", r.totalAbertos],
      ["Concluídos no período", r.concluidos],
      ["Tempo médio de resolução", formatarDuracao(r.tempoMedioResolucaoMin)],
      ["Concluídos dentro do prazo", r.percentualNoPrazo === null ? "—" : `${r.percentualNoPrazo}%`],
      ["Chamados estourados", r.estourados.length],
      ["Avaliações recebidas", r.avaliacoes.total],
      ["Nota média", r.avaliacoes.media === null ? "—" : r.avaliacoes.media.toLocaleString("pt-BR")],
    ],
    status,
    notas: [...r.avaliacoes.notas].reverse().map((n) => [`${n.nota} estrela${n.nota > 1 ? "s" : ""}`, n.total]),
    estourados: r.estourados.map((c) => [
      `#${c.numero}`,
      c.titulo,
      PRIORIDADE_LABEL[c.prioridade],
      CATEGORIA_LABEL[c.categoria],
      c.tecnico ?? "Sem técnico",
      dataHora(c.prazoResolucao),
      c.resolvidoEm ? dataHora(c.resolvidoEm) : `Em aberto (${STATUS_LABEL[c.status]})`,
      formatarDuracao(c.atrasoMin),
    ]),
  };
}

const COLUNAS_ESTOURADOS = ["Nº", "Título", "Prioridade", "Categoria", "Técnico", "Prazo", "Resolvido em", "Atraso"];

// ---------- CSV ----------

/** ";" e BOM para o Excel em português abrir com acentos e colunas certas. */
function gerarCsv(r: Relatorio) {
  const s = secoes(r);
  const cel = (v: string | number) => {
    const t = String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const bloco = (titulo: string, cabecalho: string[], linhas: (string | number)[][]) =>
    [titulo, cabecalho.map(cel).join(";"), ...linhas.map((l) => l.map(cel).join(";"))].join("\r\n");

  return (
    "﻿" +
    [
      bloco(`Relatório de chamados - ${r.organizacao}`, ["Período", "Gerado em", "Gerado por"], [[periodo(r), dataHora(r.geradoEm), r.geradoPor]]),
      bloco("Resumo", ["Indicador", "Valor"], s.resumo),
      bloco("Volume por status", ["Status", "Chamados"], s.status),
      bloco("Notas de avaliação", ["Nota", "Avaliações"], s.notas),
      bloco("Chamados estourados", COLUNAS_ESTOURADOS, s.estourados),
    ].join("\r\n\r\n")
  );
}

function baixar(conteudo: string, nome: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- PDF (impressão) ----------

const esc = (v: string | number) =>
  String(v).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

function tabela(cabecalho: string[], linhas: (string | number)[][], vazio = "Nenhum registro no período.") {
  if (!linhas.length) return `<p class="vazio">${vazio}</p>`;
  return `<table><thead><tr>${cabecalho.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${linhas
    .map((l) => `<tr>${l.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function gerarHtml(r: Relatorio) {
  const s = secoes(r);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de chamados ${esc(periodo(r))}</title>
<style>
@page { size: A4; margin: 16mm; }
body { font: 10pt/1.45 "Segoe UI", Arial, sans-serif; color: #1f2328; margin: 0; }
h1 { font-size: 17pt; margin: 0 0 2px; }
h2 { font-size: 12pt; margin: 18px 0 6px; padding-bottom: 3px; border-bottom: 1.5px solid #4f46e5; color: #312e81; }
.sub { color: #59636e; margin: 0 0 6px; }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
.kpi { border: 1px solid #d0d7de; border-radius: 6px; padding: 6px 8px; }
.kpi span { display: block; color: #59636e; font-size: 8.5pt; }
.kpi b { font-size: 13pt; }
.lado { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
th { background: #f1f3f5; font-size: 8.5pt; color: #59636e; }
tr { break-inside: avoid; }
.vazio { color: #59636e; }
</style></head><body>
<h1>Relatório de chamados</h1>
<p class="sub">${esc(r.organizacao)} · Período: ${esc(periodo(r))} · Gerado em ${esc(dataHora(r.geradoEm))} por ${esc(r.geradoPor)}</p>
<div class="kpis">${s.resumo
    .slice(0, 4)
    .concat([s.resumo[4], s.resumo[6]])
    .map(([k, v]) => `<div class="kpi"><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
    .join("")}</div>
<div class="lado">
  <div><h2>Volume por status</h2>${tabela(["Status", "Chamados"], s.status)}</div>
  <div><h2>Notas de avaliação</h2>${tabela(["Nota", "Avaliações"], s.notas)}
  <p class="sub">${r.avaliacoes.total} avaliação(ões), média ${esc(s.resumo[6][1])}.</p></div>
</div>
<h2>Chamados estourados (${r.estourados.length})</h2>
${tabela(COLUNAS_ESTOURADOS, s.estourados, "Nenhum chamado estourou o prazo no período.")}
</body></html>`;
}

/** Imprime num iframe escondido: o usuário escolhe "Salvar como PDF" no diálogo do navegador. */
function imprimir(html: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  const janela = iframe.contentWindow!;
  janela.addEventListener("afterprint", () => iframe.remove());
  // dá tempo de aplicar o CSS antes de abrir o diálogo
  window.setTimeout(() => {
    janela.focus();
    janela.print();
  }, 250);
}

// ---------- botão do painel ----------

export function BotaoRelatorio() {
  const hoje = mesIso(new Date());
  const [aberto, setAberto] = useState(false);
  const [de, setDe] = useState(mesIso(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)));
  const [ate, setAte] = useState(hoje);
  const [gerando, setGerando] = useState<"csv" | "pdf" | null>(null);

  async function exportar(formato: "csv" | "pdf") {
    setGerando(formato);
    try {
      const r = await api<Relatorio>("/relatorio", { query: { de, ate } });
      const nome = `relatorio-chamados_${r.de}_a_${r.ate}`;
      if (formato === "csv") baixar(gerarCsv(r), `${nome}.csv`, "text/csv;charset=utf-8");
      else imprimir(gerarHtml(r));
      setAberto(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível gerar o relatório.");
    } finally {
      setGerando(null);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        Exportar relatório
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar relatório</DialogTitle>
            <DialogDescription>
              Volume por status, tempo médio de resolução, notas de avaliação e chamados estourados no período.
            </DialogDescription>
          </DialogHeader>
          <SeletorMeses
            de={de}
            ate={ate}
            max={hoje}
            onChange={(novoDe, novoAte) => {
              setDe(novoDe);
              setAte(novoAte);
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => exportar("csv")} disabled={gerando !== null}>
              {gerando === "csv" ? "Gerando..." : "Baixar CSV"}
            </Button>
            <Button onClick={() => exportar("pdf")} disabled={gerando !== null}>
              {gerando === "pdf" ? "Gerando..." : "Baixar PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
