"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/native-select";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { CATEGORIA_LABEL, PRIORIDADE_LABEL, type Chamado, type Setor } from "@/lib/chamados";

export default function NovoChamadoPage() {
  const router = useRouter();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api<Setor[]>("/setores")
      .then((s) => setSetores(s.filter((x) => x.ativo)))
      .catch((e: Error) => toast.error(e.message));
  }, []);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    try {
      const c = await api<Chamado>("/chamados", {
        method: "POST",
        body: {
          titulo: String(f.get("titulo")).trim(),
          descricao: String(f.get("descricao")).trim(),
          categoria: f.get("categoria"),
          prioridade: f.get("prioridade"),
          setorId: f.get("setorId"),
        },
      });
      toast.success(`Chamado #${c.numero} aberto`);
      router.push(`/chamados/${c.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível abrir o chamado.");
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHeader titulo="Novo chamado" descricao="Descreva o problema para a equipe de TI." />
      <Card className="max-w-2xl">
          <CardContent>
            <form onSubmit={enviar} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título</Label>
                <Input id="titulo" name="titulo" required minLength={3} placeholder="Ex.: Impressora não imprime" />
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="setorId">Setor</Label>
                  <NativeSelect id="setorId" name="setorId" required defaultValue="">
                    <option value="" disabled>Selecione…</option>
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <NativeSelect id="categoria" name="categoria" defaultValue="HARDWARE">
                    {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <NativeSelect id="prioridade" name="prioridade" defaultValue="MEDIA">
                    {Object.entries(PRIORIDADE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  required
                  minLength={3}
                  rows={5}
                  placeholder="O que aconteceu? Desde quando?"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={enviando}>
                  {enviando && <Loader2 className="size-4 animate-spin" />} Abrir chamado
                </Button>
              </div>
            </form>
          </CardContent>
      </Card>
    </>
  );
}
