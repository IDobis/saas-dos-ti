"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Setor, UsuarioLista } from "@/lib/chamados";

const PERFIL_LABEL = { SOLICITANTE: "Solicitante", TECNICO: "Técnico", ADMIN: "Administrador" };

export default function CadastrosPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([api<Setor[]>("/setores"), api<UsuarioLista[]>("/usuarios")]);
      setSetores(s);
      setUsuarios(u);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar.");
    }
  }, []);

  useEffect(() => {
    if (usuario && usuario.perfil !== "ADMIN") router.replace("/chamados"); // RN09
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial dos dados
    else carregar();
  }, [usuario, router, carregar]);

  async function executar(fn: () => Promise<unknown>, ok: string, form?: HTMLFormElement) {
    setOcupado(true);
    try {
      await fn();
      toast.success(ok);
      form?.reset();
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <PageHeader titulo="Cadastros" descricao="Setores e usuários da organização." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Setores</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const nome = String(new FormData(form).get("nome")).trim();
                executar(() => api("/setores", { method: "POST", body: { nome } }), "Setor criado", form);
              }}
            >
              <Input name="nome" required minLength={2} placeholder="Novo setor" />
              <Button type="submit" disabled={ocupado}>Adicionar</Button>
            </form>
            <ul className="grid divide-y text-sm">
              {setores.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span className={s.ativo ? "" : "text-muted-foreground line-through"}>{s.nome}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={ocupado}
                    onClick={() => executar(() => api(`/setores/${s.id}/ativo`, { method: "PATCH" }), s.ativo ? "Setor inativado" : "Setor reativado")}
                  >
                    {s.ativo ? "Inativar" : "Reativar"}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Novo usuário</CardTitle></CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                executar(
                  () =>
                    api("/usuarios", {
                      method: "POST",
                      body: {
                        nome: String(f.get("nome")).trim(),
                        email: String(f.get("email")).trim(),
                        senha: f.get("senha"),
                        perfil: f.get("perfil"),
                        setorId: f.get("setorId") || undefined,
                      },
                    }),
                  "Usuário criado",
                  form,
                );
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2"><Label htmlFor="u-nome">Nome</Label><Input id="u-nome" name="nome" required minLength={2} /></div>
                <div className="grid gap-2"><Label htmlFor="u-email">E-mail</Label><Input id="u-email" name="email" type="email" required /></div>
                <div className="grid gap-2"><Label htmlFor="u-senha">Senha inicial</Label><Input id="u-senha" name="senha" type="password" required minLength={8} /></div>
                <div className="grid gap-2">
                  <Label htmlFor="u-perfil">Perfil</Label>
                  <NativeSelect id="u-perfil" name="perfil" defaultValue="SOLICITANTE">
                    {Object.entries(PERFIL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </NativeSelect>
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="u-setor">Setor</Label>
                  <NativeSelect id="u-setor" name="setorId" defaultValue="">
                    <option value="">Sem setor</option>
                    {setores.filter((s) => s.ativo).map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </NativeSelect>
                </div>
              </div>
              <Button type="submit" disabled={ocupado} className="justify-self-end">
                {ocupado && <Loader2 className="size-4 animate-spin" />} Criar usuário
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Usuários</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="py-2">Nome</th><th>E-mail</th><th>Perfil</th><th className="hidden sm:table-cell">Setor</th><th /></tr>
              </thead>
              <tbody className="divide-y">
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td className={`py-2 font-medium ${u.ativo ? "" : "text-muted-foreground line-through"}`}>{u.nome}</td>
                    <td className="text-muted-foreground">{u.email}</td>
                    <td><Badge variant="outline">{PERFIL_LABEL[u.perfil]}</Badge></td>
                    <td className="hidden text-muted-foreground sm:table-cell">{u.setor?.nome ?? "—"}</td>
                    <td className="text-right">
                      {u.id !== usuario?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={ocupado}
                          onClick={() => executar(() => api(`/usuarios/${u.id}/ativo`, { method: "PATCH" }), u.ativo ? "Usuário inativado" : "Usuário reativado")}
                        >
                          {u.ativo ? "Inativar" : "Reativar"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
