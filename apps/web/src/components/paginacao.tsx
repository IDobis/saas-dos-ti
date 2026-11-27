"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PADRAO = 50;
const MAXIMO = 300;

function ler(chave: string) {
  try {
    const n = Number(localStorage.getItem(chave));
    return Number.isInteger(n) && n >= 1 && n <= MAXIMO ? n : PADRAO;
  } catch {
    return PADRAO; // armazenamento bloqueado pelo navegador
  }
}

/** Itens por página, salvo no navegador. Só usar em telas de (app), que montam apenas no cliente. */
export function usePorPagina(chave: string) {
  const [porPagina, setPorPagina] = useState(() => ler(chave));
  function salvar(n: number) {
    setPorPagina(n);
    try {
      localStorage.setItem(chave, String(n));
    } catch {
      // sem armazenamento: vale só até sair da tela
    }
  }
  return [porPagina, salvar] as const;
}

export function Paginacao({
  rotulo,
  total,
  pagina,
  porPagina,
  onPagina,
  onPorPagina,
}: {
  rotulo: string;
  total: number;
  pagina: number;
  porPagina: number;
  onPagina: (pagina: number) => void;
  onPorPagina: (porPagina: number) => void;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = (pagina - 1) * porPagina;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onPorPagina(Number(new FormData(e.currentTarget).get("porPagina")));
          onPagina(1);
        }}
      >
        <label htmlFor="porPagina">{rotulo}</label>
        <Input id="porPagina" name="porPagina" type="number" min={1} max={MAXIMO} required defaultValue={porPagina} className="w-20" />
        <Button type="submit" variant="outline">Aplicar</Button>
      </form>
      <div className="flex items-center gap-2">
        <span aria-live="polite">
          {total === 0 ? 0 : inicio + 1}–{Math.min(inicio + porPagina, total)} de {total}
        </span>
        <Button variant="outline" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>Anterior</Button>
        <Button variant="outline" disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)}>Próxima</Button>
      </div>
    </div>
  );
}
