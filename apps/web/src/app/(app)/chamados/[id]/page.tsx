"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/native-select";
import { FadeIn } from "@/components/motion";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CATEGORIA_LABEL,
  PRIORIDADE_LABEL,
  PRIORIDADE_STYLE,
  STATUS_LABEL,
  STATUS_STYLE,
  formatarDataHora,
  type ChamadoDetalhe,
  type Status,
  type UsuarioLista,
} from "@/lib/chamados";
import { cn } from "@/lib/utils";

/** Espelha as transições da API (RN04); a API continua sendo a fonte da verdade. */
const PROXIMOS: Record<Status, Status[]> = {
  ABERTO: ["EM_ANDAMENTO", "CANCELADO"],
  EM_ANDAMENTO: ["AGUARDANDO", "RESOLVIDO", "CANCELADO"],
  AGUARDANDO: ["EM_ANDAMENTO", "RESOLVIDO", "CANCELADO"],
  RESOLVIDO: ["FECHADO"],
  FECHADO: [],
  CANCELADO: [],
};

export default function ChamadoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { usuario, ehEquipe } = useAuth();
  const [c, setC] = useState<ChamadoDetalhe | null>(null);
  const [tecnicos, setTecnicos] = useState<UsuarioLista[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [acaoJust, setAcaoJust] = useState<"cancelar" | "reabrir" | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [interno, setInterno] = useState(false);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  const carregar = useCallback(
    () =>
      api<ChamadoDetalhe>(`/chamados/${id}`)
        .then(setC)
        .catch((e: Error) => toast.error(e.message)),
    [id],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!ehEquipe) return;
    api<UsuarioLista[]>("/usuarios")
      .then((u) => setTecnicos(u.filter((x) => x.ativo && x.perfil !== "SOLICITANTE")))
      .catch(() => {});
  }, [ehEquipe]);

  async function executar(fn: () => Promise<unknown>, sucesso: string) {
    setOcupado(true);
    try {
      await fn();
      toast.success(sucesso);
      setJustificativa("");
      setAcaoJust(null);
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setOcupado(false);
    }
  }

  if (!c || !usuario) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  const souSolicitante = c.solicitante.id === usuario.id;
  const encerrado = c.status === "FECHADO" || c.status === "CANCELADO";
  const proximos = PROXIMOS[c.status].filter((s) =>
    ehEquipe ? true : souSolicitante && (s === "CANCELADO" || s === "FECHADO"),
  );
  const podeAvaliar = souSolicitante && !c.avaliacao && (c.status === "RESOLVIDO" || c.status === "FECHADO");
  const podeReabrir = ehEquipe && (c.status === "RESOLVIDO" || c.status === "FECHADO");

  const mudarStatus = (status: Status) => {
    if (status === "CANCELADO") return setAcaoJust("cancelar");
    executar(() => api(`/chamados/${id}/status`, { method: "PATCH", body: { status } }), `Status: ${STATUS_LABEL[status]}`);
  };

  return (
    <FadeIn>
      <Link href="/chamados" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Chamados
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">#{c.numero}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{c.titulo}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className={STATUS_STYLE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
            <Badge className={PRIORIDADE_STYLE[c.prioridade]}>{PRIORIDADE_LABEL[c.prioridade]}</Badge>
            <Badge variant="outline">{CATEGORIA_LABEL[c.categoria]}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {proximos.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === "CANCELADO" ? "destructive" : "default"}
              disabled={ocupado}
              onClick={() => mudarStatus(s)}
            >
              {s === "CANCELADO" ? "Cancelar" : `→ ${STATUS_LABEL[s]}`}
            </Button>
          ))}
          {podeReabrir && (
            <Button size="sm" variant="outline" disabled={ocupado} onClick={() => setAcaoJust("reabrir")}>
              Reabrir
            </Button>
          )}
        </div>
      </div>

      {acaoJust && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 overflow-hidden">
          <Card>
            <CardContent className="grid gap-3">
              <p className="text-sm font-medium">
                {acaoJust === "cancelar" ? "Justificativa do cancelamento" : "Motivo da reabertura"}
              </p>
              <Textarea rows={3} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAcaoJust(null)}>Voltar</Button>
                <Button
                  size="sm"
                  disabled={ocupado || justificativa.trim().length < 3}
                  onClick={() =>
                    acaoJust === "cancelar"
                      ? executar(
                          () => api(`/chamados/${id}/status`, { method: "PATCH", body: { status: "CANCELADO", justificativa } }),
                          "Chamado cancelado",
                        )
                      : executar(
                          () => api(`/chamados/${id}/reabrir`, { method: "PATCH", body: { justificativa } }),
                          "Chamado reaberto",
                        )
                  }
                >
                  {ocupado && <Loader2 className="size-4 animate-spin" />} Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Descrição</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{c.descricao}</p></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative grid gap-5 border-l pl-5">
                {c.historico.map((h, i) => (
                  <motion.li
                    key={h.id}
                    className="relative"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.05 }}
                  >
                    <span className={cn("absolute -left-[26px] top-1.5 size-2.5 rounded-full", h.tipo === "FOLLOWUP" ? "bg-primary" : "bg-muted-foreground/50")} />
                    <p className="text-xs text-muted-foreground">
                      {h.autor.nome} · {formatarDataHora(h.criadoEm)}
                      {h.interno && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Lock className="size-3" /> interno
                        </span>
                      )}
                    </p>
                    <p className={cn("mt-0.5 whitespace-pre-wrap text-sm", h.tipo !== "FOLLOWUP" && "text-muted-foreground")}>{h.conteudo}</p>
                  </motion.li>
                ))}
              </ol>

              {!encerrado && (
                <form
                  className="mt-6 grid gap-3 border-t pt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    executar(async () => {
                      await api(`/chamados/${id}/followups`, { method: "POST", body: { conteudo: followUp, interno } });
                      setFollowUp("");
                      setInterno(false);
                    }, "Comentário adicionado");
                  }}
                >
                  <Textarea rows={3} placeholder="Escreva uma atualização…" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
                  <div className="flex items-center justify-between gap-3">
                    {ehEquipe ? (
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" checked={interno} onChange={(e) => setInterno(e.target.checked)} />
                        Nota interna (invisível ao solicitante)
                      </label>
                    ) : <span />}
                    <Button type="submit" size="sm" disabled={ocupado || !followUp.trim()}>Comentar</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <Info rotulo="Solicitante" valor={c.solicitante.nome} />
              <Info rotulo="Setor" valor={c.setor.nome} />
              <Info rotulo="Aberto em" valor={formatarDataHora(c.abertoEm)} />
              <Info rotulo="Prazo de resolução" valor={c.prazoResolucao ? formatarDataHora(c.prazoResolucao) : "—"} />
              <div>
                <p className="text-xs text-muted-foreground">Técnico</p>
                {ehEquipe && !encerrado ? (
                  <NativeSelect
                    className="mt-1"
                    value={c.tecnico?.id ?? ""}
                    disabled={ocupado}
                    onChange={(e) =>
                      e.target.value &&
                      executar(() => api(`/chamados/${id}/atribuir`, { method: "PATCH", body: { tecnicoId: e.target.value } }), "Técnico atribuído")
                    }
                  >
                    <option value="" disabled>Sem técnico</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </NativeSelect>
                ) : (
                  <p>{c.tecnico?.nome ?? "Sem técnico"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {(podeAvaliar || c.avaliacao) && (
            <Card>
              <CardHeader><CardTitle>Avaliação</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                {c.avaliacao ? (
                  <>
                    <Estrelas valor={c.avaliacao.nota} />
                    {c.avaliacao.comentario && <p className="text-sm text-muted-foreground">{c.avaliacao.comentario}</p>}
                  </>
                ) : (
                  <>
                    <Estrelas valor={nota} onChange={setNota} />
                    <Textarea rows={2} placeholder="Comentário (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
                    <Button
                      size="sm"
                      disabled={ocupado || nota === 0}
                      onClick={() => executar(() => api(`/chamados/${id}/avaliacao`, { method: "POST", body: { nota, comentario: comentario || undefined } }), "Obrigado pela avaliação!")}
                    >
                      Enviar avaliação
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p>{valor}</p>
    </div>
  );
}

function Estrelas({ valor, onChange }: { valor: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          onClick={() => onChange?.(n)}
          className="transition-transform enabled:hover:scale-110"
        >
          <Star className={cn("size-6", n <= valor ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}
